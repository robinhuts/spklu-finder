
import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { ChargingStation } from '../utils/api';

interface UseMapboxProps {
  apiKey: string;
  defaultLocation?: { latitude: number; longitude: number } | null;
  onStationClick: (station: ChargingStation) => void;
}

export const useMapbox = ({ apiKey, defaultLocation, onStationClick }: UseMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const locationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeSourceInitialized = useRef<boolean>(false);

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || map.current) return;
    if (!apiKey) return;

    console.log("Initializing map");
    mapboxgl.accessToken = apiKey;

    const center = defaultLocation || { 
      latitude: -6.200000, 
      longitude: 106.816666 
    };

    console.log("Map center:", center);

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.longitude, center.latitude],
      zoom: 12,
      pitch: 0,
      attributionControl: false
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.AttributionControl({
        compact: true
      }),
      'bottom-right'
    );

    // Remove the GeolocateControl to prevent duplicate markers
    // since we'll handle our own user location marker

    map.current.on('load', () => {
      console.log("Map loaded successfully");
      setMapLoaded(true);
      
      // Initialize route source and layers
      if (!routeSourceInitialized.current && map.current) {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });
        
        map.current.addLayer({
          id: 'route-outline',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': 10,
            'line-opacity': 0.4
          }
        });
        
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 6,
            'line-opacity': 0.8
          }
        });
        
        routeSourceInitialized.current = true;
      }
    });
  }, [apiKey, defaultLocation]);

  // Helper function to update route source data
  const updateRouteSource = useCallback((routeData: GeoJSON.Feature | null) => {
    if (!map.current || !mapLoaded) return;
    
    if (map.current.getSource('route')) {
      // If route is null, clear the route by providing empty coordinates
      if (!routeData) {
        console.log("Clearing route data");
        (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
      } else {
        console.log("Updating route data");
        (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(routeData);
      }
    }
  }, [mapLoaded]);

  const clearMap = useCallback(() => {
    // Clear all markers and references
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }
    
    if (locationMarkerRef.current) {
      locationMarkerRef.current.remove();
      locationMarkerRef.current = null;
    }
    
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Clear route data if it exists
    if (map.current && map.current.getSource('route')) {
      try {
        (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
      } catch (error) {
        console.error("Error clearing route data:", error);
      }
    }
    
    // Finally, remove the map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Reset state
    setMapLoaded(false);
    routeSourceInitialized.current = false;
  }, []);

  return {
    mapContainer,
    map,
    mapLoaded,
    markersRef,
    userMarkerRef,
    vehicleMarkerRef,
    locationMarkerRef,
    initializeMap,
    updateRouteSource,
    clearMap
  };
};
