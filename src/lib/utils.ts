import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type ChargingStation } from "../utils/api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debounce<Args extends unknown[], Result>(
  func: (...args: Args) => Result,
  wait: number
): (...args: Args) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function(...args: Args) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function throttle<Args extends unknown[], Result>(
  func: (...args: Args) => Result,
  limit: number
): (...args: Args) => void {
  let inThrottle: boolean = false;
  
  return function(...args: Args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function compareIds(id1: string | number | null, id2: string | number | null): boolean {
  if (id1 === null || id2 === null) return false;
  return String(id1) === String(id2);
}

export function clusterStations(
  stations: ChargingStation[], 
  zoom: number,
  bounds: { north: number; south: number; east: number; west: number }
): { 
  clusters: Array<{ 
    longitude: number; 
    latitude: number; 
    count: number; 
    stations: ChargingStation[];
  }>;
  singleStations: ChargingStation[];
} {
  if (zoom >= 14) {
    return { 
      clusters: [], 
      singleStations: stations 
    };
  }

  const clusterDistance = 0.01 * Math.pow(2, 14 - Math.min(zoom, 14));
  
  const padding = clusterDistance * 2;
  const withinBounds = stations.filter(station => {
    const { longitude, latitude } = station.addressInfo;
    return longitude >= bounds.west - padding &&
           longitude <= bounds.east + padding &&
           latitude >= bounds.south - padding &&
           latitude <= bounds.north + padding;
  });
  
  const clusters: Array<{ longitude: number; latitude: number; count: number; stations: ChargingStation[] }> = [];
  const processed = new Set<string | number>();
  
  withinBounds.forEach(station => {
    if (processed.has(station.id)) return;
    
    const { longitude, latitude } = station.addressInfo;
    const nearbyStations = withinBounds.filter(s => {
      if (processed.has(s.id)) return false;
      
      const distance = Math.sqrt(
        Math.pow(s.addressInfo.longitude - longitude, 2) + 
        Math.pow(s.addressInfo.latitude - latitude, 2)
      );
      
      return distance <= clusterDistance;
    });
    
    if (nearbyStations.length > 1) {
      const centerLng = nearbyStations.reduce((sum, s) => sum + s.addressInfo.longitude, 0) / nearbyStations.length;
      const centerLat = nearbyStations.reduce((sum, s) => sum + s.addressInfo.latitude, 0) / nearbyStations.length;
      
      clusters.push({
        longitude: centerLng,
        latitude: centerLat,
        count: nearbyStations.length,
        stations: nearbyStations
      });
      
      nearbyStations.forEach(s => processed.add(s.id));
    }
  });
  
  const singleStations = withinBounds.filter(station => !processed.has(station.id));
  
  return {
    clusters,
    singleStations
  };
}
