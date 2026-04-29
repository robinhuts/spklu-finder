
import React, { useRef } from 'react';
import { ChargingStation } from '../utils/api';
import StationCard from './StationCard';
import { ChevronUp, ChevronDown, Loader2, MapPin, Route } from 'lucide-react';
import { Button } from './ui/button';
import { useVirtualizer } from '@tanstack/react-virtual';
import { compareIds } from '../lib/utils';

interface StationListProps {
  stations: ChargingStation[];
  isLoading: boolean;
  onStationSelect: (station: ChargingStation) => void;
  onDirectionsClick: (station: ChargingStation) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  isLoadingDirections?: boolean;
  selectedStops?: ChargingStation[];
  isRoutePlanActive?: boolean;
}

const StationList: React.FC<StationListProps> = ({
  stations,
  isLoading,
  onStationSelect,
  onDirectionsClick,
  expanded,
  onToggleExpand,
  isLoadingDirections = false,
  selectedStops = [],
  isRoutePlanActive = false
}) => {
  // Reference for the scrollable parent element
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Get the active station (the one we're getting directions for)
  const getActiveStationId = () => {
    // For simplicity, we'll assume the active station is the one that directions are being loaded for
    // In a real app, you'd track this state more explicitly
    return isLoadingDirections && stations && stations.length > 0 ? stations[0]?.id : null;
  };
  
  // Check if a station is in the route
  const isStationInRoute = (stationId: string | number) => {
    return selectedStops.some(stop => compareIds(stop.id, stationId));
  };
  
  // Get the index of a station in the route
  const getStationRouteIndex = (stationId: string | number) => {
    return selectedStops.findIndex(stop => compareIds(stop.id, stationId));
  };
  
  // Add debug logging to help troubleshoot
  console.log("StationList render:", {
    stationsLength: stations?.length || 0,
    isLoading,
    selectedStopsLength: selectedStops?.length || 0
  });
  
  // Make sure stations is always an array to prevent issues
  const safeStations = Array.isArray(stations) ? stations : [];
  const availableStations = safeStations.filter(station => station.status === 'available').length;
  const nearestStationDistance = safeStations[0]?.distance;
  
  // Create the virtualizer
  const rowVirtualizer = useVirtualizer({
    count: safeStations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320, // Approximate height of each station card in pixels
    overscan: 5, // Number of items to render before/after the visible area
  });

  return (
    <div className="p-4 pt-3 md:p-5 md:pt-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              Stasiun Pengisian Terdekat
            </h2>
            {isRoutePlanActive && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <Route className="mr-1 h-3.5 w-3.5" />
                Mode Rute
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {safeStations.length > 0
              ? `${safeStations.length} stasiun ditemukan · ${availableStations} tersedia${nearestStationDistance !== undefined ? ` · terdekat ${nearestStationDistance.toFixed(1)} km` : ''}`
              : 'Cari lokasi atau gunakan lokasi saat ini untuk mulai.'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0 rounded-full px-3 text-muted-foreground hover:text-foreground"
          onClick={onToggleExpand}
        >
          {expanded ? (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              <span className="text-sm">Ciutkan</span>
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              <span className="text-sm">Perluas</span>
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Memuat stasiun pengisian...</p>
        </div>
      ) : safeStations.length === 0 ? (
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mt-4">Tidak ada stasiun pengisian ditemukan.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Coba ubah lokasi Anda atau perluas area pencarian.
          </p>
        </div>
      ) : (
        <div 
          ref={parentRef} 
          className={expanded ? "h-[60vh] overflow-auto pr-1" : "h-[252px] overflow-auto pr-1"}
          style={{ position: 'relative' }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const station = safeStations[virtualRow.index];
              
              // Extra validation to ensure station has all required properties
              if (!station || !station.id || !station.addressInfo) {
                console.warn("Invalid station data:", station);
                return null;
              }
              
              const isInRoute = isStationInRoute(station.id);
              const routeIndex = isInRoute ? getStationRouteIndex(station.id) : undefined;
              
              return (
                <div
                  key={String(station.id)}
                  onClick={() => onStationSelect(station)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    padding: '8px 8px 8px 0',
                  }}
                >
                  <StationCard 
                    station={station} 
                    onDirectionsClick={onDirectionsClick} 
                    isLoadingDirections={isLoadingDirections && compareIds(station.id, getActiveStationId())}
                    isActive={compareIds(station.id, getActiveStationId())}
                    isInRoute={isInRoute}
                    routeIndex={routeIndex}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StationList;
