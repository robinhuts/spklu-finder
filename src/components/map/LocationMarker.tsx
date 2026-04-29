
import mapboxgl from 'mapbox-gl';
import React from 'react';

interface LocationMarkerProps {
  map: mapboxgl.Map;
  location: { latitude: number; longitude: number };
  markerRef: React.MutableRefObject<mapboxgl.Marker | null>;
}

export const createLocationMarker = ({ map, location, markerRef }: LocationMarkerProps) => {
  // Remove existing marker if it exists
  if (markerRef.current) {
    markerRef.current.remove();
    markerRef.current = null;
  }

  // Create marker element
  const locationMarkerElement = document.createElement('div');
  locationMarkerElement.className = 'location-marker';
  locationMarkerElement.style.width = '24px';
  locationMarkerElement.style.height = '24px';
  
  const markerPin = document.createElement('div');
  markerPin.className = 'relative z-10 h-5 w-5 rounded-full border-2 border-white bg-amber-500 shadow-md';
  locationMarkerElement.appendChild(markerPin);

  const pulseRing = document.createElement('div');
  pulseRing.className = 'absolute h-10 w-10 rounded-full border-4 border-amber-300/80 animate-ping';
  locationMarkerElement.appendChild(pulseRing);

  // Create and store the marker
  markerRef.current = new mapboxgl.Marker({
    element: locationMarkerElement,
    anchor: 'center',
    pitchAlignment: 'map',
    rotationAlignment: 'map',
  })
    .setLngLat([location.longitude, location.latitude])
    .addTo(map);

  return markerRef.current;
};
