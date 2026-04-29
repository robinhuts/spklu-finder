
import React, { memo } from 'react';
import { ChargingStation } from '../utils/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Navigation, MapPin, Zap, Clock, CreditCard, Plug, Loader2, Route, Gauge } from 'lucide-react';
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
    operatorInfo,
    connections,
    distance,
    status,
    usageCost
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
      "w-full overflow-hidden border-slate-200/80 bg-white/95 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl dark:bg-slate-900/95", 
      isActive && "border-blue-400 shadow-xl bg-blue-50/60",
      isInRoute && "border-green-400 shadow-xl bg-green-50/60",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-start gap-2">
            {isInRoute && routeIndex !== undefined && (
              <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                {routeIndex + 1}
              </div>
            )}
            <div>
              <CardTitle className="line-clamp-1 text-lg font-semibold tracking-tight">{addressInfo.title}</CardTitle>
              <CardDescription className="mt-1 flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <span className="line-clamp-1">
                  {addressInfo.addressLine1}, {addressInfo.town}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={cn(
              "ml-auto", 
              status === 'available' ? "border-green-200 bg-green-50 text-green-700" : 
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
      
      <CardContent className="pb-4">
        <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-slate-50 p-3 text-slate-600">
            <div className="flex items-center text-xs text-muted-foreground">
              <Zap className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
              Konektor
            </div>
            <p className="mt-1 font-semibold text-foreground">{connections.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-slate-600">
            <div className="flex items-center text-xs text-muted-foreground">
              <Gauge className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
              Daya Maks.
            </div>
            <p className="mt-1 font-semibold text-foreground">{highestPower || '-'} kW</p>
          </div>
          <div className="col-span-2 flex items-center text-muted-foreground">
            <Clock className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
            <span>24 Jam</span>
          </div>
          <div className="col-span-2 flex items-center text-muted-foreground">
            <CreditCard className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
            <span>Biaya: {usageCost || "Tidak ada informasi"}</span>
          </div>
          {distance !== undefined && (
            <div className="col-span-2 flex items-center text-muted-foreground">
              <Navigation className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
              <span>{formatDistance(distance)}</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">INFORMASI KONEKTOR</h4>
          <div className="space-y-2">
            {connections.slice(0, 3).map((connection, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between rounded-xl bg-secondary/80 p-2.5 text-sm"
              >
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <Plug className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="font-medium">{connection.connectionType.title}</span>
                  </div>
                  {connection.currentType && (
                    <div className="text-xs text-muted-foreground ml-6">
                      {connection.currentType.title}
                      {connection.quantity > 1 && ` (${connection.quantity}x)`}
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {connection.powerKW} kW
                </Badge>
              </div>
            ))}
            {connections.length > 3 && (
              <div className="text-xs text-center text-muted-foreground">
                +{connections.length - 3} konektor lainnya
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex-col gap-2">
        <Button 
          className={cn(
            "h-11 w-full rounded-xl font-semibold transition-all duration-200",
            isInRoute 
              ? "bg-green-500 hover:bg-green-600" 
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
        
        {operatorInfo?.websiteURL && (
          <Button variant="outline" size="sm" className="w-full text-xs" asChild>
            
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(StationCard);
