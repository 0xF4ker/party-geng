import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Star,
  Award,
  Clock,
  Calendar,
  ExternalLink,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { api } from "@/trpc/react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { useRouter } from "next/navigation";

type routerOutput = inferRouterOutputs<AppRouter>;
type conversationOutput = routerOutput["chat"]["getConversations"][number];

interface UserInfoSidebarProps {
  conversation: conversationOutput; // Replace with your strict TRPC type
  currentUserId: string;
  onClose?: () => void;
}

export const UserInfoSidebar = ({
  conversation,
  currentUserId,
  onClose,
}: UserInfoSidebarProps) => {
  const router = useRouter();
  // 1. Find the "Other" user
  const otherUser = conversation.participants.find(
    (p) => p.id !== currentUserId,
  );
  
  if (conversation.isGroup && conversation.clientEvent) {
    return (
      <div className="flex h-full flex-col bg-white">
        {onClose && (
          <div className="p-4 border-b lg:hidden">
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        )}
        <div className="flex flex-col items-center border-b border-gray-100 p-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200 text-3xl font-bold text-pink-600 shadow-inner">
            G
          </div>
          <h2 className="mt-4 text-center text-xl font-bold text-gray-900">
            {conversation.clientEvent.title}
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Event Group Chat
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <h4 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
            Participants ({conversation.participants.length})
          </h4>
          <ul className="space-y-3">
            {conversation.participants.map(p => (
              <li key={p.id} className="flex items-center gap-3">
                <Image
                  src={p.vendorProfile?.avatarUrl ?? p.clientProfile?.avatarUrl ?? "https://placehold.co/40x40"}
                  alt={p.username}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-800">{p.vendorProfile?.companyName ?? p.clientProfile?.name ?? p.username}</p>
                  <p className="text-sm text-gray-500">{p.id === conversation.groupAdminId ? "Admin" : "Member"}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const { data: orders } = api.order.getOrdersBetweenUsers.useQuery({
      userOneId: currentUserId,
      userTwoId: otherUser?.id ?? "",
  }, {
      enabled: !!otherUser?.id,
  });
  
  const activeOrders = orders?.filter(o => o.status === 'ACTIVE');

  if (!otherUser) return null;

  // 2. Extract Data with Fallbacks
  const vendorProfile = otherUser.vendorProfile;
  const clientProfile = otherUser.clientProfile;
  const isVendor = !!vendorProfile;

  // Safe extraction logic
  const displayName =
    vendorProfile?.companyName ??
    clientProfile?.name ??
    otherUser.username ??
    "Unknown";

  const avatarUrl = vendorProfile?.avatarUrl ?? clientProfile?.avatarUrl;
  const locationData = vendorProfile?.location ?? clientProfile?.location;
  const location = (locationData as unknown as { display_name: string } | null)?.display_name ?? "Nigeria";

  const joinedDate = otherUser.createdAt
    ? new Date(otherUser.createdAt)
    : new Date();

  return (
    <div className="flex h-full flex-col bg-white">
      {onClose && (
          <div className="p-4 border-b lg:hidden">
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-600"/>
              </button>
          </div>
      )}
      {/* --- Profile Header --- */}
      <div className="flex flex-col items-center border-b border-gray-100 p-8">
        <div className="group relative mb-4">
          {avatarUrl ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200 text-3xl font-bold text-pink-600 shadow-inner">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Online Status Indicator */}
          <div
            className="absolute right-1 bottom-1 h-5 w-5 rounded-full border-2 border-white bg-green-500"
            title="Online"
          />
        </div>

        <h2 className="text-center text-xl font-bold text-gray-900">
          {displayName}
        </h2>
        <p className="mt-1 text-sm font-medium text-gray-500">
          {isVendor ? "Event Vendor" : "Client"}
        </p>

        {/* Vendor Rating Badge */}
        {isVendor && vendorProfile?.rating && (
          <div className="mt-3 flex items-center gap-2 rounded-full border border-yellow-100 bg-yellow-50 px-3 py-1 text-sm font-semibold text-yellow-700">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{vendorProfile.rating.toFixed(1)}</span>
            <span className="text-yellow-300/50">|</span>
            <span className="text-xs tracking-wide text-yellow-600/80 uppercase">
              Top Rated
            </span>
          </div>
        )}
      </div>

      {/* --- Action Buttons --- */}
      <div className="p-6 pb-2">
        <Link
          href={`/${isVendor ? "v" : "c"}/${otherUser.username}`}
          target="_blank"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg active:scale-95"
        >
          View Full Profile <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      {/* --- Details List --- */}
      <div className="flex-1 overflow-y-auto p-6 pt-2">
        <div className="space-y-6">
          {/* Section: Key Details */}
          <div>
            <h4 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
              Details
            </h4>
            <ul className="space-y-4">
              <InfoItem
                icon={MapPin}
                label="Location"
                value={location}
                color="text-red-500"
              />
              <InfoItem
                icon={Calendar}
                label="Member Since"
                value={format(joinedDate, "MMMM yyyy")}
                color="text-blue-500"
              />
              {/* Verification Badge */}
              <InfoItem
                icon={ShieldCheck}
                label="Status"
                value="KYC Verified"
                color="text-green-600"
              />
            </ul>
          </div>
          
          {/* Active Orders */}
          {activeOrders && activeOrders.length > 0 && (
            <div>
              <div className="my-4 border-t border-gray-100" />
              <h4 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
                Active Orders
              </h4>
              <ul className="space-y-2">
                {activeOrders.map(order => (
                    <li key={order.id} className="p-2 -mx-2 rounded-md hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-sm">{order.quote.title}</p>
                                <p className="text-xs text-gray-500">₦{order.amount.toLocaleString()}</p>
                            </div>
                            <button onClick={() => router.push(`/orders/${order.id}`)} className="text-xs font-semibold text-pink-600 hover:underline">
                                Manage
                            </button>
                        </div>
                    </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section: Vendor Specifics */}
          {isVendor && vendorProfile && (
            <div>
              <div className="my-4 border-t border-gray-100" />
              <h4 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
                Performance
              </h4>
              <ul className="space-y-4">
                <InfoItem
                  icon={Clock}
                  label="Avg. Response"
                  value={vendorProfile.avgResponseTime ?? "< 1 hour"}
                  color="text-orange-500"
                />
                <InfoItem
                  icon={Award}
                  label="Vendor Level"
                  value={vendorProfile.level ?? "Rising Talent"}
                  color="text-purple-500"
                />
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Helper Component for List Items ---
const InfoItem = ({
  icon: Icon,
  label,
  value,
  color = "text-gray-400",
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  color?: string;
}) => (
  <li className="flex items-start gap-3">
    <div
      className={cn(
        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50",
        color,
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  </li>
);
