
import { toast } from "../components/ui/use-toast";
import { MAPBOX_API_KEY, hasMapboxApiKey } from "./mapbox";

export interface ChargingStation {
  id: number;
  uuid: string;
  addressInfo: {
    id: number;
    title: string;
    addressLine1: string;
    town: string;
    stateOrProvince: string;
    postcode: string;
    country: {
      id: number;
      isoCode: string;
      title: string;
    };
    latitude: number;
    longitude: number;
    contactTelephone1?: string;
    contactEmail?: string;
    accessComments?: string;
    relatedURL?: string;
    distance?: number;
  };
  operatorInfo?: {
    id?: number;
    name?: string;
    websiteURL?: string;
    phoneNumber?: string;
  };
  statusType?: {
    id: number;
    title: string;
    isOperational: boolean;
  };
  connections: Array<{
    id: number;
    connectionType: {
      id: number;
      title: string;
    };
    statusType?: {
      id: number;
      title: string;
      isOperational: boolean;
    };
    level: {
      id: number;
      title: string;
      comments: string;
    };
    powerKW: number;
    currentType?: {
      id: number;
      title: string;
    };
    quantity: number;
  }>;
  usageType?: {
    id: number;
    title: string;
  };
  mediaItems?: Array<{
    id: number;
    url: string;
    title?: string;
    isExternalUrl: boolean;
  }>;
  distance?: number; // Added for client-side distance calculation
  status?: 'available' | 'busy' | 'offline'; // Added for UI presentation
  usageCost?: string; // Added for price information
}

export interface SearchParams {
  latitude: number;
  longitude: number;
  distance?: number; // in kilometers
  maxResults?: number;
  countryCode?: string;
}

export async function searchLocation(query: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (!hasMapboxApiKey()) {
      toast({
        title: "Konfigurasi Mapbox belum tersedia",
        description: "Tambahkan VITE_MAPBOX_API_KEY untuk mencari lokasi.",
        variant: "destructive"
      });
      return null;
    }

    const searchQuery = encodeURIComponent(`${query},Indonesia`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchQuery}.json?country=id&limit=1&access_token=${MAPBOX_API_KEY}`;
    
    console.log("Searching location with Mapbox:", searchQuery);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to search location');
    }
    
    const data = await response.json();
    console.log("Mapbox Geocoding results:", data);
    
    if (data && data.features && data.features.length > 0) {
      const firstResult = data.features[0];
      const [longitude, latitude] = firstResult.center;
      
      return {
        latitude,
        longitude
      };
    }
    
    toast({
      title: "Lokasi tidak ditemukan",
      description: "Tidak dapat menemukan lokasi yang dicari",
      variant: "destructive"
    });
    
    return null;
  } catch (error) {
    console.error('Error searching location:', error);
    toast({
      title: "Error",
      description: "Gagal mencari lokasi. Silakan coba lagi.",
      variant: "destructive"
    });
    return null;
  }
}

const BASE_URL = 'https://api.openchargemap.io/v3';
const API_KEY = 'd7609f7a-6dca-4bd4-a531-ce798439da2c';

export async function fetchNearbyStations(params: SearchParams): Promise<ChargingStation[]> {
  try {
    const { latitude, longitude, distance = 50, maxResults = 10 } = params;
    
    console.log("Fetching stations with params:", { latitude, longitude, distance, maxResults });
    
    const queryParams = new URLSearchParams({
      output: 'json',
      countrycode: 'ID',
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      distance: distance.toString(),
      distanceunit: 'KM',
      maxresults: maxResults.toString(),
      key: API_KEY || ''
    });

    const url = `${BASE_URL}/poi/?${queryParams.toString()}`;
    console.log("Fetching from URL:", url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stations: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Received raw data:", data);
    
    if (!data || !Array.isArray(data)) {
      console.error("Invalid response format:", data);
      return [];
    }

    const processedData = data
      .filter(station => {
        // Basic validation checks
        const isValid = station &&
          typeof station === 'object' &&
          'ID' in station &&
          'AddressInfo' in station &&
          station.AddressInfo &&
          typeof station.AddressInfo === 'object' &&
          'Latitude' in station.AddressInfo &&
          'Longitude' in station.AddressInfo;

        if (!isValid) {
          console.warn('Skipping invalid station:', station);
          return false;
        }
        return true;
      })
      .map(station => {
        const status: 'available' | 'busy' | 'offline' = 
          station.StatusType?.IsOperational ? 'available' : 'offline';

        return {
          id: station.ID,
          uuid: station.UUID,
          addressInfo: {
            id: station.AddressInfo.ID,
            title: station.AddressInfo.Title,
            addressLine1: station.AddressInfo.AddressLine1,
            town: station.AddressInfo.Town,
            stateOrProvince: station.AddressInfo.StateOrProvince,
            postcode: station.AddressInfo.Postcode,
            country: {
              id: station.AddressInfo.Country.ID,
              isoCode: station.AddressInfo.Country.ISOCode,
              title: station.AddressInfo.Country.Title
            },
            latitude: station.AddressInfo.Latitude,
            longitude: station.AddressInfo.Longitude,
            distance: station.AddressInfo.Distance,
            contactTelephone1: station.AddressInfo.ContactTelephone1,
            contactEmail: station.AddressInfo.ContactEmail,
            accessComments: station.AddressInfo.AccessComments,
            relatedURL: station.AddressInfo.RelatedURL
          },
          operatorInfo: station.OperatorInfo ? {
            id: station.OperatorInfo.ID,
            name: station.OperatorInfo.Title,
            websiteURL: station.OperatorInfo.WebsiteURL,
            phoneNumber: station.OperatorInfo.PhonePrimaryContact
          } : undefined,
          statusType: station.StatusType ? {
            id: station.StatusType.ID,
            title: station.StatusType.Title,
            isOperational: station.StatusType.IsOperational
          } : undefined,
          connections: Array.isArray(station.Connections) ? station.Connections.map(conn => ({
            id: conn.ID,
            connectionType: {
              id: conn.ConnectionType.ID,
              title: conn.ConnectionType.Title
            },
            statusType: conn.StatusType ? {
              id: conn.StatusType.ID,
              title: conn.StatusType.Title,
              isOperational: conn.StatusType.IsOperational
            } : undefined,
            level: {
              id: conn.Level.ID,
              title: conn.Level.Title,
              comments: conn.Level.Comments
            },
            powerKW: conn.PowerKW,
            currentType: conn.CurrentType ? {
              id: conn.CurrentType.ID,
              title: conn.CurrentType.Title
            } : undefined,
            quantity: conn.Quantity
          })) : [],
          usageType: station.UsageType ? {
            id: station.UsageType.ID,
            title: station.UsageType.Title
          } : undefined,
          distance: station.AddressInfo.Distance,
          status,
          usageCost: station.UsageCost || 'Tidak ada informasi'
        };
      });

    console.log("Processed stations:", processedData.length);
    return processedData;
  } catch (error) {
    console.error('Error fetching charging stations:', error);
    toast({
      title: "Error",
      description: "Gagal memuat stasiun pengisian. Silakan coba lagi nanti.",
      variant: "destructive"
    });
    return [];
  }
}

function determineStationStatus(station: ChargingStation): 'available' | 'busy' | 'offline' {
  if (!station.statusType) return 'available';
  
  if (!station.statusType.isOperational) {
    return 'offline';
  }
  
  // This is a simplification - in reality we would need real-time data
  // For demo purposes, we'll randomly assign some stations as busy
  const randomValue = Math.random();
  if (randomValue < 0.2) {
    return 'busy';
  }
  
  return 'available';
}

export async function searchStations(
  query: string, 
  params: SearchParams
): Promise<ChargingStation[]> {
  try {
    // First, try to find the location coordinates using Mapbox
    const location = await searchLocation(query);
    
    if (location) {
      // If location is found, search for stations near that location
      const stations = await fetchNearbyStations({
        ...params,
        latitude: location.latitude,
        longitude: location.longitude,
        distance: 25, // 15km radius
        maxResults: 15 // Increased from 10 to 100
      });
      
      // Ensure the stations have the correct distance calculation from the searched location
      const stationsWithDistance = stations.map(station => ({
        ...station,
        distance: station.distance || 
                (station.addressInfo ? calculateDistance(
                  { latitude: location.latitude, longitude: location.longitude },
                  { latitude: station.addressInfo.latitude, longitude: station.addressInfo.longitude }
                ) : 0)
      }));
      
      // Sort by distance
      stationsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      if (stationsWithDistance.length > 0) {
        toast({
          title: "Stasiun ditemukan",
          description: `${stationsWithDistance.length} stasiun ditemukan di sekitar lokasi yang dicari.`,
        });
      } else {
        toast({
          title: "Tidak ada stasiun",
          description: "Tidak ada stasiun pengisian di sekitar lokasi yang dicari.",
        });
      }
      
      return stationsWithDistance;
    }
    
    // If no location found, fall back to the original search logic
    const results = await fetchNearbyStations({
      ...params,
      maxResults: 100 // Increased from default to 100
    });
    
    // Calculate distance for these results too
    return results.map(station => ({
      ...station,
      distance: station.distance || 
              (station.addressInfo ? calculateDistance(
                { latitude: params.latitude, longitude: params.longitude },
                { latitude: station.addressInfo.latitude, longitude: station.addressInfo.longitude }
              ) : 0)
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  } catch (error) {
    console.error('Error searching stations:', error);
    toast({
      title: "Error",
      description: "Gagal mencari stasiun. Silakan coba lagi.",
      variant: "destructive"
    });
    return [];
  }
}

// Import the calculateDistance function from distance.ts
import { calculateDistance } from './distance';
