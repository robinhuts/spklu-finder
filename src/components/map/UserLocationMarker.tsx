
import React from 'react';
import mapboxgl from 'mapbox-gl';

interface UserLocationMarkerProps {
  map: mapboxgl.Map;
  location: { latitude: number; longitude: number };
  markerRef: React.MutableRefObject<mapboxgl.Marker | null>;
}

export const createUserLocationMarker = ({ map, location, markerRef }: UserLocationMarkerProps) => {
  // Remove existing marker if it exists
  if (markerRef.current) {
    markerRef.current.remove();
    markerRef.current = null;
  }

  // Create marker element
  const userMarkerElement = document.createElement('div');
  userMarkerElement.className = 'user-marker';
  userMarkerElement.style.width = '24px';
  userMarkerElement.style.height = '24px';
  
  const userDot = document.createElement('div');
  userDot.className = 'relative z-10 h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-md';
  userMarkerElement.appendChild(userDot);

  const pulseRing = document.createElement('div');
  pulseRing.className = 'absolute h-10 w-10 rounded-full border-4 border-blue-300/80 animate-ping';
  userMarkerElement.appendChild(pulseRing);

  // Create and store the marker
  markerRef.current = new mapboxgl.Marker({
    element: userMarkerElement,
    anchor: 'center',
    pitchAlignment: 'map',
    rotationAlignment: 'map',
  })
    .setLngLat([location.longitude, location.latitude])
    .addTo(map);

  // Fly to the user location
  map.flyTo({
    center: [location.longitude, location.latitude],
    zoom: 13,
    speed: 1.5,
    curve: 1,
    easing(t) { return t; }
  });
};
