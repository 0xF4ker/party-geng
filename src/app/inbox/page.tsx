"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Star,
  MapPin,
  Award,
  Clock,
  Calendar,
  Search,
  ChevronDown,
  Paperclip,
  Send,
  MoreVertical,
  FileText,
  CheckCircle,
  X,
  Eye,
  Loader2,
  ArrowLeft,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import { supabase, type RealtimeMessage } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type routerOutput = inferRouterOutputs<AppRouter>;
type conversation = routerOutput["chat"]["getConversations"][number];
type message = routerOutput["chat"]["getMessages"]["messages"][number];

interface QuoteFormData {
  title: string;
  price: number;
  eventDate: string;
  includes: string;
}

// --- Main Page Component ---
const InboxPage = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<
    conversation | undefined
  >(undefined);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [], refetch: refetchConversations } =
    api.chat.getConversations.useQuery(undefined, {
      refetchInterval: 30000, // Refetch every 30 seconds as fallback
    });

  // Fetch messages for selected conversation
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = api.chat.getMessages.useQuery(
    { conversationId: selectedConversation?.id ?? "", limit: 50 },
    { enabled: !!selectedConversation?.id },
  );

  const messages = messagesData?.messages ?? [];

  // Send message mutation
  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      void refetchMessages();
      void refetchConversations();
    },
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const channel = supabase
      .channel(`conversation:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${selectedConversation.id}`,
        },
        (payload) => {
          console.log("New message received:", payload);
          // Refetch messages to get the full message with relations
          void refetchMessages();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id, refetchMessages]);

  // Realtime subscription for conversation updates
  useEffect(() => {
    const channel = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Conversation",
        },
        () => {
          void refetchConversations();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refetchConversations]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select first conversation by default
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      text: messageText,
    });
  };

  const handleSelectConversation = (convo: conversation) => {
    setSelectedConversation(convo);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((convo) => {
    const otherUser = convo.participants.find((p) => p.id !== user?.id);
    const displayName =
      otherUser?.vendorProfile?.companyName ??
      otherUser?.clientProfile?.name ??
      otherUser?.username ??
      "";
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get other user in conversation
  const getOtherUser = (convo: conversation) => {
    return convo.participants.find((p) => p.id !== user?.id);
  };

  const isVendor =
    user?.vendorProfile !== null && user?.vendorProfile !== undefined;

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="flex h-[calc(100vh-122px)] border-t border-gray-200 bg-white text-gray-900 lg:h-[calc(100vh-127px)]">
        {/* === 1. Conversation List Column === */}
        <aside
          className={cn(
            "flex h-full w-full flex-col border-r border-gray-200 sm:w-1/3 lg:w-1/4",
            showMobileChat && "hidden sm:flex",
          )}
        >
          {/* Header */}
          <div className="shrink-0 border-b border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold">Messages</h2>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 pr-3 pl-10 text-sm focus:outline-pink-500"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="grow overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <p className="text-sm text-gray-500">
                  {searchQuery ? "No conversations found" : "No messages yet"}
                </p>
              </div>
            ) : (
              filteredConversations.map((convo) => (
                <ConversationItem
                  key={convo.id}
                  conversation={convo}
                  isSelected={selectedConversation?.id === convo.id}
                  onClick={() => handleSelectConversation(convo)}
                  currentUserId={user.id}
                />
              ))
            )}
          </div>
        </aside>

        {/* === 2. Chat Window === */}
        <main
          className={cn(
            "flex h-full w-full flex-col border-r border-gray-200 lg:w-1/2",
            !showMobileChat && "hidden sm:flex",
          )}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <ChatHeader
                conversation={selectedConversation}
                currentUserId={user.id}
                onBack={handleBackToList}
              />

              {/* Messages */}
              <div className="grow space-y-4 overflow-y-auto bg-gray-50 p-4">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="text-sm text-gray-500">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    if (msg.quote) {
                      return (
                        <QuoteBubble
                          key={msg.id}
                          message={msg}
                          currentUserId={user.id}
                          conversationId={selectedConversation.id}
                          onQuoteUpdate={() => {
                            void refetchMessages();
                            void refetchConversations();
                          }}
                        />
                      );
                    }
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        currentUserId={user.id}
                      />
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <ChatInput
                value={messageText}
                onChange={setMessageText}
                onSend={handleSendMessage}
                disabled={sendMessageMutation.isPending}
                isVendor={isVendor}
                conversationId={selectedConversation.id}
                otherUserId={getOtherUser(selectedConversation)?.id ?? ""}
                onQuoteSent={() => {
                  void refetchMessages();
                  void refetchConversations();
                }}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">
                Select a conversation to start messaging
              </p>
            </div>
          )}
        </main>

        {/* === 3. Info Sidebar === */}
        <aside className="hidden h-full overflow-y-auto bg-gray-50 p-6 lg:block lg:w-1/4">
          {selectedConversation && (
            <UserInfoSidebar
              conversation={selectedConversation}
              currentUserId={user.id}
            />
          )}
        </aside>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const ConversationItem = ({
  conversation,
  isSelected,
  onClick,
  currentUserId,
}: {
  conversation: conversation;
  isSelected: boolean;
  onClick: () => void;
  currentUserId: string;
}) => {
  const otherUser = conversation.participants.find(
    (p) => p.id !== currentUserId,
  );
  const displayName =
    otherUser?.vendorProfile?.companyName ??
    otherUser?.clientProfile?.name ??
    otherUser?.username ??
    "Unknown User";
  const avatarUrl =
    otherUser?.vendorProfile?.avatarUrl ?? otherUser?.clientProfile?.avatarUrl;
  const lastMessage = conversation.messages[0];
  const hasUnread = false; // TODO: Implement unread logic

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full space-x-3 border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50",
        isSelected && "bg-pink-50",
      )}
    >
      <div className="relative h-12 w-12 shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            className="h-12 w-12 rounded-full object-cover"
            width={48}
            height={48}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 font-semibold text-pink-600">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        {hasUnread && (
          <div className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-pink-600"></div>
        )}
      </div>
      <div className="min-w-0 grow">
        <div className="flex items-center justify-between">
          <h4 className="truncate font-semibold text-gray-800">
            {displayName}
          </h4>
          {lastMessage && (
            <span className="shrink-0 text-xs text-gray-400">
              {formatDistanceToNow(new Date(lastMessage.createdAt), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
        <p className="truncate text-sm text-gray-500">
          {lastMessage?.text ?? "No messages yet"}
        </p>
      </div>
    </button>
  );
};

const ChatHeader = ({
  conversation,
  currentUserId,
  onBack,
}: {
  conversation: conversation;
  currentUserId: string;
  onBack: () => void;
}) => {
  const otherUser = conversation.participants.find(
    (p) => p.id !== currentUserId,
  );
  const displayName =
    otherUser?.vendorProfile?.companyName ??
    otherUser?.clientProfile?.name ??
    otherUser?.username ??
    "Unknown User";
  const avatarUrl =
    otherUser?.vendorProfile?.avatarUrl ?? otherUser?.clientProfile?.avatarUrl;

  return (
    <div className="shrink-0 border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-full p-2 hover:bg-gray-100 sm:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              className="h-10 w-10 rounded-full object-cover"
              width={40}
              height={40}
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 font-semibold text-pink-600">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">{displayName}</h3>
            <p className="text-xs font-medium text-green-600">Online</p>
          </div>
        </div>
        <button className="rounded-full p-2 text-gray-400 hover:text-gray-700">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const MessageBubble = ({
  message,
  currentUserId,
}: {
  message: message;
  currentUserId: string;
}) => {
  const isMe = message.senderId === currentUserId;

  return (
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-xs rounded-lg p-3 lg:max-w-md",
          isMe
            ? "rounded-br-none bg-pink-600 text-white"
            : "rounded-bl-none border border-gray-200 bg-white text-gray-800",
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <span
          className={cn(
            "mt-1 block text-right text-xs",
            isMe ? "text-pink-100" : "text-gray-400",
          )}
        >
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
};

const QuoteBubble = ({
  message,
  currentUserId,
  conversationId,
  onQuoteUpdate,
}: {
  message: message;
  currentUserId: string;
  conversationId: string;
  onQuoteUpdate: () => void;
}) => {
  const isMe = message.senderId === currentUserId;
  const quote = message.quote;

  const updateQuoteStatus = api.quote.updateStatus.useMutation({
    onSuccess: () => {
      onQuoteUpdate();
    },
  });

  if (!quote) return null;

  const handleAccept = () => {
    updateQuoteStatus.mutate({ id: quote.id, status: "ACCEPTED" });
  };

  const handleReject = () => {
    updateQuoteStatus.mutate({ id: quote.id, status: "REJECTED" });
  };

  const handleRequestRevision = () => {
    updateQuoteStatus.mutate({ id: quote.id, status: "REVISION_REQUESTED" });
  };

  const getStatusColor = () => {
    switch (quote.status) {
      case "ACCEPTED":
        return "bg-green-50 border-green-200";
      case "REJECTED":
        return "bg-red-50 border-red-200";
      case "REVISION_REQUESTED":
        return "bg-yellow-50 border-yellow-200";
      default:
        return isMe ? "bg-pink-50 border-pink-200" : "bg-white border-gray-200";
    }
  };

  return (
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-xs rounded-lg border p-4", getStatusColor())}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              quote.status === "ACCEPTED"
                ? "bg-green-100"
                : quote.status === "REJECTED"
                  ? "bg-red-100"
                  : isMe
                    ? "bg-pink-100"
                    : "bg-blue-100",
            )}
          >
            <FileText
              className={cn(
                "h-5 w-5",
                quote.status === "ACCEPTED"
                  ? "text-green-600"
                  : quote.status === "REJECTED"
                    ? "text-red-600"
                    : isMe
                      ? "text-pink-600"
                      : "text-blue-600",
              )}
            />
          </div>
          <div className="min-w-0">
            <h5 className="truncate font-semibold text-gray-800">
              {quote.title}
            </h5>
            <p className="text-sm font-bold text-gray-900">
              ₦{quote.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quote Details */}
        <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-600">
            <strong>Event Date:</strong>{" "}
            {new Date(quote.eventDate).toLocaleDateString()}
          </p>
          <div className="text-sm text-gray-600">
            <strong>Includes:</strong>
            <ul className="mt-1 ml-4 list-disc">
              {quote.includes.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Status Badge */}
        {quote.status !== "PENDING" && (
          <div className="mt-3 rounded-md bg-white/50 p-2 text-center">
            <span
              className={cn(
                "text-sm font-semibold",
                quote.status === "ACCEPTED"
                  ? "text-green-700"
                  : quote.status === "REJECTED"
                    ? "text-red-700"
                    : "text-yellow-700",
              )}
            >
              {quote.status === "ACCEPTED"
                ? "✓ Accepted"
                : quote.status === "REJECTED"
                  ? "✗ Rejected"
                  : "⟳ Revision Requested"}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {quote.status === "PENDING" && (
          <>
            {isMe ? (
              <p className="mt-3 text-center text-xs text-gray-600">
                Quote sent. Waiting for response...
              </p>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleRequestRevision}
                  disabled={updateQuoteStatus.isPending}
                  className="w-full rounded-md bg-gray-200 py-2 text-center text-sm font-semibold text-gray-800 hover:bg-gray-300 disabled:opacity-50"
                >
                  Request Revision
                </button>
                <button
                  onClick={handleAccept}
                  disabled={updateQuoteStatus.isPending}
                  className="w-full rounded-md bg-pink-600 py-2 text-center text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
                >
                  {updateQuoteStatus.isPending ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Accept Quote"
                  )}
                </button>
              </div>
            )}
          </>
        )}

        <span className="mt-2 block text-right text-xs text-gray-400">
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
};

const ChatInput = ({
  value,
  onChange,
  onSend,
  disabled,
  isVendor,
  conversationId,
  otherUserId,
  onQuoteSent,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isVendor: boolean;
  conversationId: string;
  otherUserId: string;
  onQuoteSent: () => void;
}) => {
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  return (
    <>
      <div className="shrink-0 border-t border-gray-200 p-4">
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Type your message..."
            rows={2}
            disabled={disabled}
            className="w-full resize-none rounded-lg border border-gray-300 py-2 pr-24 pl-12 focus:outline-pink-500 disabled:opacity-50"
          />
          <button className="absolute top-3 left-3 text-gray-400 hover:text-gray-700">
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="absolute top-1/2 right-3 flex -translate-y-1/2 gap-2">
            {isVendor && (
              <button
                onClick={() => setShowQuoteModal(true)}
                className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                title="Send Quote"
              >
                <FileText className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onSend}
              disabled={disabled || !value.trim()}
              className="rounded-lg bg-pink-600 p-2 text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {disabled ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {showQuoteModal && (
        <CreateQuoteModal
          conversationId={conversationId}
          clientId={otherUserId}
          onClose={() => setShowQuoteModal(false)}
          onSuccess={() => {
            setShowQuoteModal(false);
            onQuoteSent();
          }}
        />
      )}
    </>
  );
};

const CreateQuoteModal = ({
  conversationId,
  clientId,
  onClose,
  onSuccess,
}: {
  conversationId: string;
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState<QuoteFormData>({
    title: "",
    price: 0,
    eventDate: "",
    includes: "",
  });

  // Get vendor's gigs for selection
  const { data: gigs = [] } = api.gig.getMyGigs.useQuery({ status: "ACTIVE" });

  const [selectedGigId, setSelectedGigId] = useState("");

  const createQuote = api.quote.create.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGigId) {
      alert("Please select a service");
      return;
    }

    const includesArray = formData.includes
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    createQuote.mutate({
      gigId: selectedGigId,
      clientId,
      conversationId,
      title: formData.title,
      price: formData.price,
      eventDate: new Date(formData.eventDate),
      includes: includesArray,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-xl font-semibold">Create a Quote</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label
              htmlFor="gigSelect"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Select Service
            </label>
            <select
              id="gigSelect"
              value={selectedGigId}
              onChange={(e) => {
                setSelectedGigId(e.target.value);
                const gig = gigs.find((g) => g.id === e.target.value);
                if (gig) {
                  setFormData({
                    title: gig.title,
                    price: gig.basePrice,
                    eventDate: "",
                    includes: gig.basePriceIncludes.join("\n"),
                  });
                }
              }}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
              required
            >
              <option value="">-- Select a service --</option>
              {gigs.map((gig) => (
                <option key={gig.id} value={gig.id}>
                  {gig.title} - ₦{gig.basePrice.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="quoteTitle"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Quote Title
            </label>
            <input
              type="text"
              id="quoteTitle"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="quotePrice"
                className="mb-1 block text-sm font-semibold text-gray-700"
              >
                Price (₦)
              </label>
              <input
                type="number"
                id="quotePrice"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value),
                  })
                }
                className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="eventDate"
                className="mb-1 block text-sm font-semibold text-gray-700"
              >
                Event Date
              </label>
              <input
                type="date"
                id="eventDate"
                value={formData.eventDate}
                onChange={(e) =>
                  setFormData({ ...formData, eventDate: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="quoteIncludes"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              What&apos;s Included (one per line)
            </label>
            <textarea
              id="quoteIncludes"
              rows={4}
              value={formData.includes}
              onChange={(e) =>
                setFormData({ ...formData, includes: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
              placeholder="- 6 hours of DJ service&#10;- Dance floor lighting&#10;- Wireless microphone"
              required
            ></textarea>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createQuote.isPending}
            className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {createQuote.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Send Quote"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserInfoSidebar = ({
  conversation,
  currentUserId,
}: {
  conversation: conversation;
  currentUserId: string;
}) => {
  const otherUser = conversation.participants.find(
    (p) => p.id !== currentUserId,
  );
  const displayName =
    otherUser?.vendorProfile?.companyName ??
    otherUser?.clientProfile?.name ??
    otherUser?.username ??
    "Unknown User";
  const avatarUrl =
    otherUser?.vendorProfile?.avatarUrl ?? otherUser?.clientProfile?.avatarUrl;
  const isVendor = !!otherUser?.vendorProfile;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            className="h-20 w-20 rounded-full object-cover"
            width={80}
            height={80}
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 text-2xl font-semibold text-pink-600">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <h3 className="mt-4 text-lg font-semibold text-gray-800">
          {displayName}
        </h3>

        {isVendor && otherUser?.vendorProfile && (
          <div className="mt-2 flex items-center gap-1.5">
            <Star className="h-5 w-5 fill-current text-yellow-400" />
            <span className="font-bold text-yellow-500">
              {otherUser.vendorProfile.rating}
            </span>
            <span className="mx-1 text-gray-300">|</span>
            <Award className="h-5 w-5 text-pink-500" />
            <span className="text-sm font-semibold text-gray-700">
              {otherUser.vendorProfile.level}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 border-t pt-6">
        <Link
          href={`/${isVendor ? "v" : "c"}/${otherUser?.username}`}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-pink-100 py-2.5 font-bold text-pink-700 transition-colors hover:bg-pink-200"
        >
          <Eye className="h-5 w-5" />
          View Profile
        </Link>
      </div>

      {isVendor && otherUser?.vendorProfile && (
        <div className="mt-6 border-t pt-6">
          <div className="flex flex-col space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <Clock className="h-5 w-5 shrink-0 text-gray-500" />
              <span>
                Avg. response:{" "}
                <strong>
                  {otherUser.vendorProfile.avgResponseTime ?? "N/A"}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {!isVendor && otherUser?.clientProfile && (
        <div className="mt-6 border-t pt-6">
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="h-5 w-5 shrink-0 text-gray-500" />
            <span>
              From{" "}
              <strong>{otherUser.clientProfile.location ?? "Nigeria"}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxPage;
