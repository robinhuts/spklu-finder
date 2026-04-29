
import React, { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ChargingStation } from '../utils/api';
import { useMapbox } from '../hooks/useMapbox';
import { createUserLocationMarker } from './map/UserLocationMarker';
import { createStationMarker } from './map/StationMarker';
import { createStationCluster } from './map/StationCluster';
import { createLocationMarker } from './map/LocationMarker';
import { clusterStations } from '../lib/utils';
import { throttle } from '../lib/utils';
import { MAPBOX_API_KEY, hasMapboxApiKey } from '../utils/mapbox';

interface MapProps {
  stations: ChargingStation[];
  userLocation: { latitude: number; longitude: number } | null;
  onStationClick: (station: ChargingStation) => void;
  selectedStation: ChargingStation | null;
  apiKey?: string;
  directionsRoute?: GeoJSON.Feature | null;
  searchedLocation?: { latitude: number; longitude: number } | null;
}

const Map: React.FC<MapProps> = ({ 
  stations, 
  userLocation, 
  onStationClick,
  selectedStation,
  apiKey = MAPBOX_API_KEY,
  directionsRoute,
  searchedLocation
}) => {
  const hasMapboxConfig = hasMapboxApiKey();
  const {
    mapContainer,
    map,
    mapLoaded,
    markersRef,
    userMarkerRef,
    locationMarkerRef,
    initializeMap,
    clearMap,
    updateRouteSource
  } = useMapbox({ apiKey, defaultLocation: userLocation, onStationClick });

  // Store previous user location to avoid updating marker unnecessarily
  const prevUserLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  
  // Track the previous directions route to avoid unnecessary updates
  const prevDirectionsRouteRef = useRef<GeoJSON.Feature | null>(null);
  
  // Store current map bounds and zoom level for clustering
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(12);
  
  // Update bounds and zoom on map move
  const updateMapViewData = useRef(throttle(() => {
    if (map.current) {
      const bounds = map.current.getBounds();
      setMapBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
      setMapZoom(map.current.getZoom());
    }
  }, 300)).current;

  // Initialize map
  useEffect(() => {
    initializeMap();
    return () => clearMap();
  }, [apiKey]);
  
  // Add map event listeners for clustering
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Add event listeners for map move/zoom to update bounds data
    map.current.on('moveend', updateMapViewData);
    map.current.on('zoomend', updateMapViewData);
    
    // Initial bounds calculation
    updateMapViewData();
    
    return () => {
      if (map.current) {
        map.current.off('moveend', updateMapViewData);
        map.current.off('zoomend', updateMapViewData);
      }
    };
  }, [mapLoaded, updateMapViewData]);

  // Handle user location updates - ensure we only create marker when location actually changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;
    
    // Check if location has changed
    const locationChanged = 
      !prevUserLocationRef.current || 
      prevUserLocationRef.current.latitude !== userLocation.latitude ||
      prevUserLocationRef.current.longitude !== userLocation.longitude;
    
    if (locationChanged) {
      // Update marker with new location
      createUserLocationMarker({
        map: map.current,
        location: userLocation,
        markerRef: userMarkerRef
      });
      
      // Update previous location
      prevUserLocationRef.current = userLocation;
    }
  }, [userLocation, mapLoaded]);

  // Handle searched location updates
  useEffect(() => {
    if (!map.current || !mapLoaded || !searchedLocation) return;
    
    createLocationMarker({
      map: map.current,
      location: searchedLocation,
      markerRef: locationMarkerRef
    });
    
    // Fly to the searched location
    map.current.flyTo({
      center: [searchedLocation.longitude, searchedLocation.latitude],
      zoom: 14,
      speed: 1.5,
      curve: 1
    });
  }, [searchedLocation, mapLoaded]);

  // Handle stations updates with clustering
  useEffect(() => {
    if (!map.current || !mapLoaded || !mapBounds) return;

    console.log("Updating station markers, count:", stations.length);
    
    // Clear existing markers before adding new ones
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Cluster stations based on current zoom level and map bounds
    const { clusters, singleStations } = clusterStations(stations, mapZoom, mapBounds);
    
    console.log(`Created ${clusters.length} clusters and ${singleStations.length} single stations`);
    
    // Add cluster markers
    clusters.forEach(cluster => {
      const marker = createStationCluster({
        cluster,
        map: map.current!,
        onClusterClick: (clusterData) => {
          if (mapZoom < 14) {
            // Zoom to cluster
            map.current!.flyTo({
              center: [clusterData.longitude, clusterData.latitude],
              zoom: Math.min(mapZoom + 2, 15)
            });
          } else {
            // Show all stations in this cluster
            clusterData.stations.forEach(station => {
              onStationClick(station);
            });
          }
        }
      });
      markersRef.current.push(marker);
    });
    
    // Add individual station markers
    singleStations.forEach(station => {
      const marker = createStationMarker({
        station,
        map: map.current!,
        onStationClick
      });
      markersRef.current.push(marker);
    });

    if (selectedStation) {
      // Highlight the selected station
      const selectedMarker = markersRef.current.find(marker => {
        const element = marker.getElement();
        const stationId = element.getAttribute('data-marker-id')?.split('-')[1];
        return stationId === String(selectedStation.id);
      });
      
      if (selectedMarker) {
        selectedMarker.getElement().classList.add('scale-125', 'z-20', 'shadow-lg');
        selectedMarker.getElement().style.filter = 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5))';
        
        map.current.flyTo({
          center: [selectedStation.addressInfo.longitude, selectedStation.addressInfo.latitude],
          zoom: 15,
          speed: 0.8,
          curve: 1
        });
      }
    }
  }, [stations, mapLoaded, selectedStation, onStationClick, mapBounds, mapZoom]);

  // Handle directions route updates
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Check if the route has changed by comparing with previous route
    const routeChanged = directionsRoute !== prevDirectionsRouteRef.current;
    
    if (routeChanged) {
      // Update the route source with the new route or empty route if null
      updateRouteSource(directionsRoute);
      prevDirectionsRouteRef.current = directionsRoute;
      
      // Only adjust map view if we have a valid route
      if (directionsRoute && directionsRoute.properties?.bbox) {
        const [minLng, minLat, maxLng, maxLat] = directionsRoute.properties.bbox as number[];
        map.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat]
          ],
          {
            padding: 50,
            duration: 1000
          }
        );
      }
    }
  }, [directionsRoute, mapLoaded, updateRouteSource]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      <div ref={mapContainer} className="map-container h-full w-full" />

      {!hasMapboxConfig && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 px-4 text-white">
          <div className="max-w-md rounded-3xl border border-white/15 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 text-2xl">
              ⚡
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Mapbox belum dikonfigurasi</h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Tambahkan environment variable <span className="font-semibold text-cyan-200">VITE_MAPBOX_API_KEY</span> di Vercel, lalu redeploy agar peta dan pencarian lokasi tampil.
            </p>
            <div className="mt-5 rounded-2xl bg-slate-900/80 p-3 text-left text-xs text-slate-200">
              Vercel → Project Settings → Environment Variables → VITE_MAPBOX_API_KEY
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-md">
        <p className="text-sm font-semibold text-slate-800">
          {stations.length > 0 
            ? `${stations.length} Stasiun Ditemukan` 
            : userLocation 
              ? "Tidak ada stasiun dalam radius pencarian" 
              : "Menunggu lokasi..."}
        </p>
      </div>
      
      {directionsRoute && directionsRoute.properties?.distance && directionsRoute.properties?.duration && (
        <div className="absolute bottom-4 right-4 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-xl backdrop-blur-md">
          <div className="text-sm">
            <p className="font-semibold text-slate-800">Info Rute</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Jarak</p>
                <p className="font-semibold">{(directionsRoute.properties.distance / 1000).toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Waktu</p>
                <p className="font-semibold">{Math.round(directionsRoute.properties.duration / 60)} menit</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 right-4 bg-white bg-opacity-80 p-2 rounded-lg shadow-md max-w-xs text-xs overflow-auto max-h-40">
          <p className="font-medium">Debug Info:</p>
          <p>Map Loaded: {mapLoaded ? 'Yes' : 'No'}</p>
          <p>User Location: {userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 'None'}</p>
          <p>Stations Count: {stations.length}</p>
          <p>Markers Count: {markersRef.current.length}</p>
          <p>Clusters: {mapBounds ? stations.length - clusterStations(stations, mapZoom, mapBounds).singleStations.length : 0}</p>
          <p>Zoom: {mapZoom.toFixed(1)}</p>
          <p>Directions: {directionsRoute ? 'Active' : 'None'}</p>
          <p>Searched Location: {searchedLocation ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default Map;
