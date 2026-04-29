
import React, { memo } from 'react';
import { ChargingStation } from '../utils/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Navigation, MapPin, Zap, Plug, Loader2, Route, Gauge } from 'lucide-react';
import { formatDistance } from '../utils/distance';
import { cn } from '@/lib/utils';

interface StationCardProps {
  station: ChargingStation;
  onDirectionsClick: (station: ChargingStation) => void;
  className?: string;
  isLoadingDirections?: boolean;
  isActive?: boolean;
  isInRoute?: boolean;
  routeIndex?: number;
}

const StationCard: React.FC<StationCardProps> = ({
  station,
  onDirectionsClick,
  className,
  isLoadingDirections = false,
  isActive = false,
  isInRoute = false,
  routeIndex
}) => {
  const {
    addressInfo,
    connections,
    distance,
    status
  } = station;
  
  const statusColors = {
    'available': 'bg-station-available',
    'busy': 'bg-station-busy',
    'offline': 'bg-station-offline'
  };
  
  const statusLabels = {
    'available': 'Tersedia',
    'busy': 'Sibuk',
    'offline': 'Tidak Beroperasi'
  };
  
  const highestPower = connections.reduce((max, conn) => Math.max(max, conn.powerKW || 0), 0);
  
  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDirectionsClick(station);
  };

  return (
    <Card className={cn(
      "w-full overflow-hidden rounded-2xl border-slate-200/80 bg-white/95 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-lg dark:bg-slate-900/95", 
      isActive && "border-blue-300 bg-blue-50/70 shadow-md",
      isInRoute && "border-emerald-300 bg-emerald-50/70 shadow-md",
      className
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            {isInRoute && routeIndex !== undefined && (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                {routeIndex + 1}
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="line-clamp-1 text-base font-semibold tracking-tight">{addressInfo.title}</CardTitle>
              <CardDescription className="mt-1 flex items-center text-xs">
                <MapPin className="mr-1 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="line-clamp-1">
                  {addressInfo.addressLine1}, {addressInfo.town}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            <Badge variant="outline" className={cn(
              "h-7 rounded-full px-2 text-[11px]", 
              status === 'available' ? "border-emerald-200 bg-emerald-50 text-emerald-700" : 
              status === 'busy' ? "border-amber-200 bg-amber-50 text-amber-700" : 
              "border-gray-200 bg-gray-50 text-gray-700"
            )}>
              <span className={cn("mr-1.5 h-2 w-2 rounded-full", statusColors[status || 'available'])}></span>
              {statusLabels[status || 'available']}
            </Badge>
            
            {isInRoute && (
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                <Route className="h-3 w-3 mr-1" />
                Bagian dari Rute
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
            <div className="flex items-center text-[11px] text-muted-foreground">
              <Zap className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
              Konektor
            </div>
            <p className="mt-0.5 font-semibold text-foreground">{connections.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
            <div className="flex items-center text-[11px] text-muted-foreground">
              <Gauge className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
              Daya
            </div>
            <p className="mt-0.5 font-semibold text-foreground">{highestPower || '-'} kW</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
            <div className="flex items-center text-[11px] text-muted-foreground">
              <Navigation className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
              Jarak
            </div>
            <p className="mt-0.5 font-semibold text-foreground">
              {distance !== undefined ? formatDistance(distance) : '-'}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Konektor</h4>
            {connections.length > 2 && (
              <span className="text-[11px] text-muted-foreground">+{connections.length - 2} lainnya</span>
            )}
          </div>
          <div className="space-y-1.5">
            {connections.slice(0, 2).map((connection, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center">
                    <Plug className="mr-2 h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                    <span className="line-clamp-1 font-medium">{connection.connectionType.title}</span>
                  </div>
                  {connection.currentType && (
                    <div className="ml-5 line-clamp-1 text-[11px] text-muted-foreground">
                      {connection.currentType.title}
                      {connection.quantity > 1 && ` (${connection.quantity}x)`}
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="ml-2 flex-shrink-0 rounded-full border-blue-100 bg-blue-50 text-[11px] text-blue-700">
                  {connection.powerKW || '-'} kW
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-4 pb-4 pt-0">
        <Button 
          className={cn(
            "h-10 w-full rounded-xl text-sm font-semibold transition-all duration-200",
            isInRoute 
              ? "bg-emerald-500 hover:bg-emerald-600" 
              : "bg-blue-500 hover:bg-blue-600"
          )}
          onClick={handleDirectionsClick}
          disabled={isLoadingDirections}
        >
          {isLoadingDirections ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menghitung Rute...
            </>
          ) : isInRoute ? (
            <>
              <Route className="h-4 w-4 mr-2" />
              {routeIndex !== undefined ? `Bagian ${routeIndex + 1} dari Rute` : 'Dalam Rute'}
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Petunjuk Arah
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(StationCard);
