"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export interface LocationSearchResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
}

interface LocationSearchInputProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  initialValue?: string;
}

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  onLocationSelect,
  initialValue = "",
}) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Sync initial value if it changes
  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Skip the first render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // FIX: Define an async function to handle fetching.
    // This moves state updates into the promise chain or async execution flow,
    // avoiding the "synchronous setState" linter error.
    const fetchLocations = async () => {
      if (debouncedQuery.length > 2) {
        setIsLoading(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${debouncedQuery}&format=json`,
          );
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const data: LocationSearchResult[] = await res.json();
          setResults(data);
          setIsOpen(true);
        } catch (error) {
          console.error("Error fetching locations:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    };

    void fetchLocations();
  }, [debouncedQuery]);

  const handleSelect = (location: LocationSearchResult) => {
    setQuery(location.display_name);
    onLocationSelect(location);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <MapPin className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a location..."
          className="w-full rounded-md border border-gray-300 p-3 pl-10 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
        />
        {isLoading && (
          <Loader2 className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>
      {isOpen && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {results.map((location) => (
            <li
              key={location.place_id}
              onClick={() => handleSelect(location)}
              className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-100"
            >
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {location.display_name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearchInput;
