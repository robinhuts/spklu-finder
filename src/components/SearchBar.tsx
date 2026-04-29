
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, LocateFixed, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { searchLocation } from '@/utils/api';
import { debounce } from '@/lib/utils';
import { MAPBOX_API_KEY, hasMapboxApiKey } from '@/utils/mapbox';

interface GeocodingSuggestion {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLocationSearch?: (location: { latitude: number; longitude: number }) => void;
  isLoading: boolean;
  className?: string;
  onGetUserLocation: () => void;
  isLocating: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onLocationSearch,
  isLoading, 
  className,
  onGetUserLocation,
  isLocating
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [geocodingSuggestions, setGeocodingSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      onSearch('');
      return;
    }
    
    // Try to search for a location first
    setIsSearchingLocation(true);
    try {
      const locationResult = await searchLocation(query);
      if (locationResult) {
        console.log("Location found:", locationResult);
        onLocationSearch?.(locationResult);
      } else {
        // If no location found, fall back to station search
        onSearch(query);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      // Fall back to station search on error
      onSearch(query);
    } finally {
      setIsSearchingLocation(false);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setGeocodingSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Use debounced function for fetching suggestions
  const debouncedFetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 3) {
        setGeocodingSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        if (!hasMapboxApiKey()) {
          return;
        }

        const encodedQuery = encodeURIComponent(`${searchQuery}`);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?country=id&types=place,locality,neighborhood,address&limit=5&access_token=${MAPBOX_API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to get suggestions');
        }
        
        const data = await response.json();
        if (data.features) {
          setGeocodingSuggestions(data.features);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setGeocodingSuggestions([]);
      }
    }, 300),
    []
  );

  // Fetch geocoding suggestions as user types
  useEffect(() => {
    if (query.trim()) {
      debouncedFetchSuggestions(query);
    } else {
      setGeocodingSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, debouncedFetchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle suggestion selection
  const handleSuggestionClick = async (suggestion: GeocodingSuggestion) => {
    setQuery(suggestion.place_name);
    setShowSuggestions(false);
    
    const [longitude, latitude] = suggestion.center;
    onLocationSearch?.({ latitude, longitude });
  };

  return (
    <form 
      className={cn(
        "relative flex items-center w-full transition-all duration-300",
        isMobile ? "max-w-[calc(100vw-32px)]" : "max-w-3xl",
        isFocused ? "scale-[1.02]" : "scale-100",
        className
      )}
      onSubmit={handleSubmit}
    >
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Cari lokasi atau SPKLU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className={cn(
            "h-12 rounded-full border-white/40 bg-white/95 pl-11 pr-10 text-sm shadow-xl shadow-slate-950/10 backdrop-blur-xl transition-all duration-200 placeholder:text-muted-foreground/75 dark:bg-gray-900/95 dark:border-gray-700",
            isFocused ? "shadow-2xl border-blue-300 ring-4 ring-blue-500/10 dark:border-blue-700" : ""
          )}
          onFocus={() => {
            setIsFocused(true);
            if (geocodingSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading || isSearchingLocation}
        />
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
        
        {/* Geocoding Suggestions Dropdown */}
        {showSuggestions && geocodingSuggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/60 bg-white/95 p-2 shadow-2xl shadow-slate-950/15 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-800/95"
          >
            {geocodingSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="cursor-pointer rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-blue-50 dark:hover:bg-gray-700"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="font-medium">{suggestion.text}</div>
                <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {suggestion.place_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="ml-2 h-12 w-12 rounded-full border-white/40 bg-white/95 shadow-xl shadow-slate-950/10 backdrop-blur-xl hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-900/95"
        onClick={onGetUserLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        ) : (
          <LocateFixed className="h-4 w-4 text-blue-500" />
        )}
        <span className="sr-only">Use current location</span>
      </Button>
      <Button 
        type="submit" 
        className={cn(
          "ml-2 h-12 rounded-full bg-blue-500 text-sm font-semibold shadow-xl shadow-blue-950/20 transition-colors hover:bg-blue-600",
          isMobile ? "px-3" : "px-5"
        )}
        disabled={isLoading || isSearchingLocation}
      >
        {isLoading || isSearchingLocation ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Search className="mr-1.5 h-4 w-4" />
            {!isMobile && "Cari"}
          </>
        )}
      </Button>
    </form>
  );
};

export default SearchBar;
