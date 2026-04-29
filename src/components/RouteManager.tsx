
import React, { useState } from 'react';
import { ChargingStation } from '../utils/api';
import { X, MapPin, Route, Trash2, Clock, Navigation, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { formatDistance } from '../utils/distance';
import { formatDuration } from '../utils/directions';
import { cn } from '@/lib/utils';

interface RouteManagerProps {
  selectedStops: ChargingStation[];
  onRemoveStop: (stopId: string | number) => void;
  onClearRoute: () => void;
  onStartRoute: () => void;
  isRouteActive: boolean;
  totalDistance?: number;
  totalDuration?: number;
  isLoading?: boolean;
}

const RouteManager: React.FC<RouteManagerProps> = ({
  selectedStops,
  onRemoveStop,
  onClearRoute,
  onStartRoute,
  isRouteActive,
  totalDistance,
  totalDuration,
  isLoading = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (selectedStops.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "absolute right-4 top-20 z-20 w-[calc(100vw-2rem)] max-w-[22rem] overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-xl shadow-slate-950/15 backdrop-blur-xl transition-all duration-300 sm:w-80",
      expanded && "left-4 right-4 max-w-none sm:left-auto sm:max-w-[22rem]"
    )}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Route className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight">Mode Rute</h3>
            <p className="text-xs text-muted-foreground">{selectedStops.length} tujuan dipilih</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="rounded-full border-blue-100 bg-blue-50 text-xs text-blue-700">
            {selectedStops.length}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 rounded-full p-0" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="p-3">
        {!expanded ? (
          <div className="space-y-3">
            <p className="text-xs leading-5 text-muted-foreground">
              Pilih minimal 2 stasiun dari daftar, lalu mulai rute.
            </p>
            <Button
              variant="default"
              size="sm"
              className="h-9 w-full rounded-xl bg-blue-500 text-xs font-semibold hover:bg-blue-600"
              onClick={onStartRoute}
              disabled={selectedStops.length < 2 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Navigation className="mr-1.5 h-3.5 w-3.5" />
                  Mulai Rute
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
          <ScrollArea className="max-h-56 pr-2">
            <div className="space-y-2">
              {selectedStops.map((stop, index) => (
                <div 
                  key={String(stop.id)}
                  className="relative flex items-start rounded-2xl border border-slate-100 bg-slate-50/80 p-3"
                >
                  <div className="mr-2 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 pr-5">
                    <p className="line-clamp-1 text-sm font-medium">{stop.addressInfo.title}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {stop.addressInfo.addressLine1}, {stop.addressInfo.town}
                    </p>
                    {stop.distance !== undefined && (
                      <div className="mt-1 flex items-center">
                        <MapPin className="mr-1 h-3 w-3 text-blue-400" />
                        <span className="text-xs text-muted-foreground">{formatDistance(stop.distance)}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1.5 top-1.5 h-6 w-6 rounded-full p-0"
                    onClick={() => onRemoveStop(stop.id)}
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-3 border-t border-slate-100 pt-3">
            {(totalDistance || totalDuration) && (
              <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-blue-700">
                  <div className="mb-0.5 flex items-center text-[11px] text-blue-500">
                    <Navigation className="mr-1 h-3.5 w-3.5" />
                    Jarak
                  </div>
                  <span>{totalDistance ? `${(totalDistance/1000).toFixed(1)} km` : 'Jarak tidak diketahui'}</span>
                </div>
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-blue-700">
                  <div className="mb-0.5 flex items-center text-[11px] text-blue-500">
                    <Clock className="mr-1 h-3.5 w-3.5" />
                    Waktu
                  </div>
                  <span>{totalDuration ? formatDuration(totalDuration) : 'Waktu tidak diketahui'}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 rounded-xl text-xs"
                onClick={onClearRoute}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Hapus
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-9 flex-1 rounded-xl bg-blue-500 text-xs font-semibold hover:bg-blue-600"
                onClick={onStartRoute}
                disabled={selectedStops.length < 2 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Navigation className="h-3.5 w-3.5 mr-1.5" />
                    Mulai
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
        )}
      </div>
    </div>
  );
};

export default RouteManager;
