
import { ChargingStation } from './api';

interface DirectionsParams {
  origin: [number, number];
  destination: [number, number];
  waypoints?: [number, number][];
  apiKey: string;
}

interface DirectionsResponse {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: Array<[number, number]>;
      type: string;
    };
    legs: Array<{
      steps: Array<unknown>;
      summary: string;
      distance: number;
      duration: number;
    }>;
    weight: number;
    weight_name: string;
  }>;
  waypoints: Array<{
    distance: number;
    name: string;
    location: [number, number];
  }>;
  code: string;
  uuid: string;
}

// Define proper GeoJSON types that match Mapbox's response format
interface DirectionsGeometry {
  type: "LineString";
  coordinates: Array<[number, number]>;
}

interface DirectionsProperties {
  distance: number;
  duration: number;
  bbox?: number[];
  legs?: Array<{
    distance: number;
    duration: number;
  }>;
}

export async function getDirections({
  origin,
  destination,
  waypoints = [],
  apiKey
}: DirectionsParams): Promise<GeoJSON.Feature<DirectionsGeometry, DirectionsProperties> | null> {
  try {
    // Construct the coordinates string for the URL
    // Format: lon1,lat1;lon2,lat2;...
    let coordinatesString = `${origin[1]},${origin[0]}`;
    
    // Add waypoints if they exist
    if (waypoints.length > 0) {
      waypoints.forEach(waypoint => {
        coordinatesString += `;${waypoint[1]},${waypoint[0]}`;
      });
    }
    
    // Add destination
    coordinatesString += `;${destination[1]},${destination[0]}`;

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${apiKey}`;

    console.log("Fetching directions from:", url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch directions: ${response.status}`);
    }
    
    const data: DirectionsResponse = await response.json();
    console.log("Received directions data", data);
    
    if (!data.routes || data.routes.length === 0) {
      console.error("No routes found in directions response");
      return null;
    }
    
    const route = data.routes[0];
    
    // Create a GeoJSON feature with proper typing
    const geojson: GeoJSON.Feature<DirectionsGeometry, DirectionsProperties> = {
      type: 'Feature',
      properties: {
        distance: route.distance,
        duration: route.duration,
        bbox: getBoundingBox(route.geometry.coordinates),
        legs: route.legs.map(leg => ({
          distance: leg.distance,
          duration: leg.duration
        }))
      },
      geometry: {
        type: "LineString",
        coordinates: route.geometry.coordinates
      }
    };
    
    return geojson;
  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
}

// Calculate a bounding box from an array of coordinates
function getBoundingBox(coordinates: Array<[number, number]>): number[] {
  if (!coordinates || coordinates.length === 0) return [0, 0, 0, 0];
  
  let minLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLng = coordinates[0][0];
  let maxLat = coordinates[0][1];
  
  coordinates.forEach(coord => {
    minLng = Math.min(minLng, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLng = Math.max(maxLng, coord[0]);
    maxLat = Math.max(maxLat, coord[1]);
  });
  
  return [minLng, minLat, maxLng, maxLat];
}

// Get directions for a multi-stop route
export async function getMultiStopDirections(
  stops: ChargingStation[],
  apiKey: string
): Promise<GeoJSON.Feature<DirectionsGeometry, DirectionsProperties> | null> {
  if (!stops || stops.length < 2) {
    console.error("Need at least 2 stops for directions");
    return null;
  }
  
  try {
    const origin: [number, number] = [stops[0].addressInfo.latitude, stops[0].addressInfo.longitude];
    const destination: [number, number] = [stops[stops.length - 1].addressInfo.latitude, stops[stops.length - 1].addressInfo.longitude];
    
    // Create waypoints from middle stops
    const waypoints: [number, number][] = stops.slice(1, -1).map(stop => 
      [stop.addressInfo.latitude, stop.addressInfo.longitude]
    );
    
    return getDirections({
      origin,
      destination,
      waypoints,
      apiKey
    });
  } catch (error) {
    console.error("Error calculating multi-stop directions:", error);
    return null;
  }
}

// Format directions duration into a human-readable string
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }
  
  return `${minutes} menit`;
}

// Format directions distance into a human-readable string
export function formatDirectionsDistance(meters: number): string {
  const km = meters / 1000;
  
  if (km < 1) {
    return `${Math.round(meters)} m`;
  }
  
  return `${km.toFixed(1)} km`;
}
