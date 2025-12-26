"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  Plus,
  Search,
  Folder,
  Briefcase,
  Pencil,
  Trash2,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- 1. STRICT TYPE INFERENCE ---
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;

// Extract the exact shape of a Category from the 'getAll' query
type CategoryItem = RouterOutputs["category"]["getAll"][number];

// Extract the exact shape of a Service (which is nested inside Category)
type ServiceItem = CategoryItem["services"][number];

export default function CategoryManagementPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  // --- QUERIES ---
  const {
    data: categories,
    isLoading,
    refetch,
  } = api.category.getAll.useQuery();

  // Derived state
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const filteredCategories = categories?.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="relative flex h-[calc(100vh-8rem)] flex-col gap-6 md:flex-row">
      {/* --- LEFT COLUMN: CATEGORIES --- */}
      <div
        className={`w-full flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-all md:flex md:w-1/3 ${selectedCategoryId ? "hidden" : "flex"} `}
      >
        <div className="border-b border-gray-100 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Categories</h2>
            <CategoryModal onSuccess={refetch} />
          </div>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Filter..."
              className="border-gray-200 bg-gray-50 pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-pink-600" />
            </div>
          ) : (
            filteredCategories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition-all ${
                  selectedCategoryId === cat.id
                    ? "bg-pink-50 text-pink-700 ring-1 ring-pink-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Folder
                    className={`h-4 w-4 ${selectedCategoryId === cat.id ? "fill-pink-200" : ""}`}
                  />
                  <span className="font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {cat.services.length}
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 ${selectedCategoryId === cat.id ? "text-pink-400" : "text-gray-300"}`}
                  />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* --- RIGHT COLUMN: SERVICES --- */}
      <div
        className={`w-full flex-col rounded-2xl border border-gray-100 bg-white shadow-sm md:flex md:flex-1 ${selectedCategoryId ? "flex" : "hidden"} `}
      >
        {selectedCategory ? (
          <>
            <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-1 -ml-2 text-gray-500 md:hidden"
                  onClick={() => setSelectedCategoryId(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
                      {selectedCategory.name}
                    </h2>
                    <CategoryModal
                      category={selectedCategory}
                      onSuccess={refetch}
                      isEdit
                    />
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-gray-500 sm:text-sm">
                    /{selectedCategory.slug ?? "no-slug"}
                  </p>
                </div>

                <div className="flex gap-1 sm:gap-2">
                  <DeleteCategoryButton
                    categoryId={selectedCategory.id}
                    categoryName={selectedCategory.name}
                    onSuccess={() => {
                      setSelectedCategoryId(null);
                      void refetch();
                    }}
                  />
                  <ServiceModal
                    categoryId={selectedCategory.id}
                    onSuccess={refetch}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <h3 className="mb-4 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Services in {selectedCategory.name}
              </h3>

              {selectedCategory.services.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                  <Briefcase className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-gray-500">No services yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {selectedCategory.services.map((service) => (
                    <div
                      key={service.id}
                      className="group flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-all hover:border-pink-200 hover:bg-pink-50/10 hover:shadow-sm sm:p-4"
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="truncate font-medium text-gray-900">
                          {service.name}
                        </h4>
                        <p className="truncate text-xs text-gray-500">
                          /{service.slug ?? "no-slug"} •{" "}
                          <span className="text-pink-600">
                            {service._count.vendors} Vendors
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <ServiceModal
                          categoryId={selectedCategory.id}
                          service={service}
                          onSuccess={refetch}
                          isEdit
                        />
                        <DeleteServiceButton
                          serviceId={service.id}
                          serviceName={service.name}
                          onSuccess={refetch}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-gray-400">
            <div className="mb-4 rounded-full bg-gray-50 p-4">
              <Folder className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Select a Category
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-gray-500">
              Click on a category from the list to view and manage its services.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (Modals) ---

// Correctly typed props
interface CategoryModalProps {
  category?: CategoryItem;
  onSuccess: () => void;
  isEdit?: boolean;
}

function CategoryModal({ category, onSuccess, isEdit }: CategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");

  const mutation = api.category.upsertCategory.useMutation({
    onSuccess: () => {
      setOpen(false);
      if (!isEdit) {
        setName("");
        setSlug("");
      }
      toast.success(isEdit ? "Category updated" : "Category created");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-pink-600" />
        </Button>
      ) : (
        <Button
          size="sm"
          className="h-8 bg-pink-600 text-xs hover:bg-pink-700 sm:text-sm"
          onClick={() => setOpen(true)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> New
        </Button>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Photography"
            />
          </div>
          <div className="space-y-2">
            <Label>Slug (Optional)</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Auto-generated if empty"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate({ id: category?.id, name, slug })}
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Correctly typed props
interface ServiceModalProps {
  categoryId: number;
  service?: ServiceItem;
  onSuccess: () => void;
  isEdit?: boolean;
}

function ServiceModal({
  categoryId,
  service,
  onSuccess,
  isEdit,
}: ServiceModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(service?.name ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");

  const mutation = api.category.upsertService.useMutation({
    onSuccess: () => {
      setOpen(false);
      if (!isEdit) {
        setName("");
        setSlug("");
      }
      toast.success(isEdit ? "Service updated" : "Service created");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-blue-600" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-pink-200 text-xs text-pink-600 hover:bg-pink-50 sm:text-sm"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 sm:mr-1" />{" "}
          <span className="hidden sm:inline">Add Service</span>
        </Button>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Service" : "New Service"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wedding Photographer"
            />
          </div>
          <div className="space-y-2">
            <Label>Slug (Optional)</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Auto-generated if empty"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              mutation.mutate({ id: service?.id, categoryId, name, slug })
            }
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryButton({
  categoryId,
  categoryName,
  onSuccess,
}: {
  categoryId: number;
  categoryName: string;
  onSuccess: () => void;
}) {
  const mutation = api.category.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success(`Category "${categoryName}" deleted`);
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = () => {
    if (confirm(`Delete category "${categoryName}"? This cannot be undone.`)) {
      mutation.mutate({ id: categoryId });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={mutation.isPending}
      className="h-8 w-8 text-gray-400 hover:text-red-600"
    >
      {mutation.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}

function DeleteServiceButton({
  serviceId,
  serviceName,
  onSuccess,
}: {
  serviceId: number;
  serviceName: string;
  onSuccess: () => void;
}) {
  const mutation = api.category.deleteService.useMutation({
    onSuccess: () => {
      toast.success(`Service "${serviceName}" deleted`);
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = () => {
    if (confirm(`Delete service "${serviceName}"?`)) {
      mutation.mutate({ id: serviceId });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={mutation.isPending}
      className="h-8 w-8 text-gray-400 hover:text-red-600"
    >
      {mutation.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
