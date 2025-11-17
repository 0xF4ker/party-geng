"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { api } from "@/trpc/react";

// --- Types ---
type RouterOutput = inferRouterOutputs<AppRouter>;
type searchItems = RouterOutput["category"]["getSearchList"];

type SearchItem = NonNullable<searchItems>[number];

interface GlobalSearchProps {
  items: SearchItem[];
  className?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ items, className }) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const router = useRouter();

  const { data: popularServices, isLoading: isLoadingPopular } =
    api.category.getPopularServices.useQuery();

  const handleSelect = (currentValue: string) => {
    setOpen(false);
    const selectedItem = items.find(
      (item) => item.value?.toLowerCase() === currentValue.toLowerCase(),
    );
    if (selectedItem) {
      if (selectedItem.type === "category") {
        router.push(`/categories/${selectedItem.value}`);
      } else if (selectedItem.type === "service" && selectedItem.categorySlug) {
        router.push(
          `/categories/${selectedItem.categorySlug}/${selectedItem.value}`,
        );
      }
    }
  };

  // Close dialog on escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-muted-foreground",
            className,
          )}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Search for services...</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0">
        <Command>
          <CommandInput
            placeholder="Search for a service..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList className="max-h-[50vh]">
            <CommandEmpty>No service found.</CommandEmpty>

            {inputValue.length === 0 ? (
              <CommandGroup heading="Popular Searches">
                {isLoadingPopular && <CommandItem disabled>Loading...</CommandItem>}
                {popularServices?.map((service) => (
                  <CommandItem
                    key={service.value}
                    value={service.value ?? ""}
                    onSelect={() => handleSelect(service.value ?? "")}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {service.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandGroup heading="Results">
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value ?? ""}
                    onSelect={() => handleSelect(item.value ?? "")}
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
