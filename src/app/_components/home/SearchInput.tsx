import React, { useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { popularSearches } from "@/app/local/categoryv2";

interface SearchInputProps {
  placeholder: string;
  isFocused: boolean;
  setIsFocused: (isFocused: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  results: string[];
  onClear: () => void;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder,
  isFocused,
  setIsFocused,
  query,
  setQuery,
  results,
  onClear,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setIsFocused(false);
    // Here you would typically trigger the search
    console.log("Searching for:", suggestion);
  };

  return (
    <div
      className={cn(
        "relative w-full",
        className,
        isFocused ? "z-50" : "z-auto", // Elevate search when focused
      )}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from closing overlay
    >
      <div className="relative flex w-full">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={cn(
            "w-full border border-gray-300 px-4 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none",
            query.length > 0 ? "rounded-l-md" : "rounded-l-md", // Adjust rounding if clear button is visible
          )}
          onFocus={() => setIsFocused(true)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {/* Clear Button */}
        {query.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center justify-center border border-l-0 border-gray-300 bg-white px-3 text-gray-500 hover:text-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <button
          className={cn(
            "bg-pink-500 px-4 py-2 font-bold text-white hover:bg-pink-600",
            query.length > 0 ? "rounded-r-md" : "rounded-none rounded-r-md",
          )}
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* --- Suggestions Dropdown --- */}
      {isFocused && (query.length > 0 || popularSearches.length > 0) && (
        <div className="absolute top-full right-0 left-0 mt-2 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {results.length > 0 && (
            <ul className="py-2">
              {results.map((result) => (
                <li
                  key={result}
                  onClick={() => handleSelectSuggestion(result)}
                  className="flex cursor-pointer items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <Search className="h-4 w-4 text-gray-400" />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: result.replace(
                        new RegExp(`(${query})`, "gi"),
                        "<strong>$1</strong>",
                      ),
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          {/* Popular Searches */}
          {results.length === 0 && query.length === 0 && (
            <div className="py-2">
              <h4 className="px-4 py-2 text-sm font-semibold text-gray-500">
                Popular
              </h4>
              <ul>
                {popularSearches.map((term) => (
                  <li
                    key={term}
                    onClick={() => handleSelectSuggestion(term)}
                    className="flex cursor-pointer items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
