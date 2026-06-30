"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  Key,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function AdminCoordinatorKeysPage() {
  const utils = api.useUtils();
  const [generating, setGenerating] = useState(false);

  // Queries
  const { data: keys, isLoading, refetch } = api.coordinator.getKeys.useQuery();

  // Mutations
  const generateKeyMutation = api.coordinator.generateKey.useMutation({
    onSuccess: (data) => {
      toast.success(`Key generated successfully: ${data.key}`);
      void refetch();
      setGenerating(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate key");
      setGenerating(false);
    },
  });

  const deleteKeyMutation = api.coordinator.deleteKey.useMutation({
    onSuccess: () => {
      toast.success("Access key deleted successfully");
      void refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete key");
    },
  });

  const handleGenerate = () => {
    setGenerating(true);
    generateKeyMutation.mutate({});
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this access key?")) {
      deleteKeyMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Coordinator Access Keys
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate and manage single-use invitation keys allowing coordinator signups.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void refetch()}
            className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-xl bg-pink-650 hover:bg-pink-700 px-4 py-2.5 text-sm font-bold text-white transition shadow-sm disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Generate Key
          </button>
        </div>
      </div>

      {/* Keys List */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        ) : keys && keys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Access Key</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Used By</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50/50 transition">
                    <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-gray-400" />
                        {k.key}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {k.isUsed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Used
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          <Clock className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                      {k.usedBy ? (
                        <div>
                          <p className="font-semibold text-gray-800">
                            @{k.usedBy.username}
                          </p>
                          <p className="text-xs text-gray-400">{k.usedBy.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {new Date(k.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {!k.isUsed ? (
                        <button
                          onClick={() => handleDelete(k.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete Key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 pr-2">Used</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <Key className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-lg">No invitation keys found</p>
            <p className="text-sm mt-1">
              Click &quot;Generate Key&quot; to create a new access code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
