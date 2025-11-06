"use client";

//
// This is where you would paste all the code
// from the `InboxPage.jsx` file we just created.
//
// I've added a placeholder here to show where it goes.
//

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Star,
  Check,
  MapPin,
  Languages,
  Award,
  MessageSquare,
  Clock,
  Briefcase,
  Users,
  Plus,
  List,
  Edit,
  Image as ImageIcon,
  MessageCircle,
  Calendar,
  Search,
  Gift,
  ChevronRight,
  ChevronDown,
  Paperclip,
  Send,
  MoreVertical,
  FileText,
  CheckCircle,
  X,
  Eye,
  RefreshCw,
} from "lucide-react";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// ... (Paste the entire InboxPage.jsx code here,
// starting from the mock data all the way to the end) ...

// --- Mock Data ---
const vendorUser = {
  id: "vendor_123",
  name: "DJ SpinMaster",
  avatarUrl: "https://placehold.co/128x128/ec4899/ffffff?text=DJ",
};
const vendorConversations = [
  {
    id: 1,
    user: {
      id: "client_456",
      name: "Adebayo P.",
      avatarUrl: "https://placehold.co/128x128/3b82f6/ffffff?text=A",
      isClient: true,
      profile: {
        location: "Lagos, Nigeria",
        memberSince: "Joined July 2024",
        isVerified: true,
        stats: { eventsHosted: 3, vendorsHired: 5 },
      },
    },
    lastMessage: "Yes please, send the quote!",
    time: "2h ago",
    unread: true,
  },
  {
    id: 2,
    user: {
      name: "Chioma E.",
      avatarUrl: "https://placehold.co/40x40/10b981/ffffff?text=C",
    },
    lastMessage: "Requesting a quote for our corporate...",
    time: "8h ago",
    unread: true,
  },
];
const vendorMessages = [
  {
    id: 1,
    senderId: "client_456",
    text: "Hi! Looking for a DJ for my 30th birthday on Dec 15th. Are you available?",
    time: "2:30 PM",
  },
  {
    id: 2,
    senderId: "vendor_123",
    text: "Hi Adebayo! Great to hear from you. Yes, I'm currently available on that date. What's the venue and expected number of guests?",
    time: "2:31 PM",
  },
  {
    id: 3,
    senderId: "client_456",
    text: "Awesome. It's at the Eko Hotel, and we're expecting about 150 guests. We need someone who can play Afrobeats and some classic 90s Hip Hop.",
    time: "2:33 PM",
  },
  {
    id: 4,
    senderId: "vendor_123",
    text: "That's my specialty! For a 150-guest event at Eko, my 'Standard' package would be perfect. It includes 6 hours of DJ service and dance floor lighting. Would you like me to send over an official quote?",
    time: "2:34 PM",
  },
  {
    id: 5,
    senderId: "client_456",
    type: "quote_request",
    text: "Yes please, send the quote!",
    gigTitle: "DJ for 30th Birthday Bash",
    time: "2:35 PM",
  },
];

// -- Client Data --
const clientUser = {
  id: "client_456",
  name: "Adebayo P.",
  avatarUrl: "https://placehold.co/128x128/3b82f6/ffffff?text=A",
};
const clientConversations = [
  {
    id: 1,
    user: {
      id: "vendor_123",
      name: "DJ SpinMaster",
      avatarUrl: "https://placehold.co/128x128/ec4899/ffffff?text=DJ",
      isVendor: true,
      profile: {
        level: "Level 2",
        rating: 4.9,
        reviews: 131,
        avgResponseTime: "1 Hour",
        onPartygengSince: "Sep 2023",
      },
    },
    lastMessage: "Here's the quote you requested!",
    time: "2h ago",
    unread: true,
  },
  {
    id: 2,
    user: {
      name: "SnapPro",
      avatarUrl: "https://placehold.co/40x40/8d99ae/ffffff?text=S",
    },
    lastMessage: "Just confirming, see you on the 10th!",
    time: "3d ago",
    unread: false,
  },
];
const clientMessages = [
  {
    id: 1,
    senderId: "client_456",
    text: "Hi! Looking for a DJ for my 30th birthday on Dec 15th. Are you available?",
    time: "2:30 PM",
  },
  {
    id: 2,
    senderId: "vendor_123",
    text: "Hi Adebayo! Great to hear from you. Yes, I'm currently available on that date. What's the venue and expected number of guests?",
    time: "2:31 PM",
  },
  {
    id: 3,
    senderId: "client_456",
    text: "Awesome. It's at the Eko Hotel, and we're expecting about 150 guests. We need someone who can play Afrobeats and some classic 90s Hip Hop.",
    time: "2:33 PM",
  },
  {
    id: 4,
    senderId: "vendor_123",
    text: "That's my specialty! For a 150-guest event at Eko, my 'Standard' package would be perfect. It includes 6 hours of DJ service and dance floor lighting. Would you like me to send over an official quote?",
    time: "2:34 PM",
  },
  {
    id: 5,
    senderId: "client_456",
    type: "quote_request",
    text: "Yes please, send the quote!",
    gigTitle: "DJ for 30th Birthday Bash",
    time: "2:35 PM",
  },
  {
    id: 6,
    senderId: "vendor_123",
    type: "quote",
    title: "Quote for 30th Birthday Bash",
    price: 250000,
    status: "Sent",
    time: "2:36 PM",
  },
];
// --- End Mock Data ---

// --- Main Page Component ---
const InboxPage = () => {
  // All the inbox page logic goes here...
  const [userType, setUserType] = useState("client"); // 'client' or 'vendor'
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Dynamically set data based on userType
  const { currentUser, conversations, initialMessages, otherUser } =
    useMemo(() => {
      if (userType === "vendor") {
        return {
          currentUser: vendorUser,
          conversations: vendorConversations,
          initialMessages: vendorMessages,
          otherUser: vendorConversations[0]?.user, // The client
        };
      }
      // Default to client
      return {
        currentUser: clientUser,
        conversations: clientConversations,
        initialMessages: clientMessages,
        otherUser: clientConversations[0]?.user, // The vendor
      };
    }, [userType]);

  const [selectedConvo, setSelectedConvo] = useState(conversations[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");

  // Update messages when user type changes
  useEffect(() => {
    setMessages(userType === "vendor" ? vendorMessages : clientMessages);
    setSelectedConvo(
      userType === "vendor" ? vendorConversations[0] : clientConversations[0],
    );
  }, [
    userType,
    clientMessages,
    clientConversations,
    vendorMessages,
    vendorConversations,
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    const newMessage = {
      id: messages.length + 1,
      senderId: currentUser.id,
      text: message,
      time: "2:37 PM", // Mock time
    };
    setMessages([...messages, newMessage]);
    setMessage("");
  };

  const handleSendQuote = (quoteData: any) => {
    const newQuoteMessage = {
      id: messages.length + 1,
      senderId: currentUser.id,
      type: "quote",
      title: quoteData.title,
      price: quoteData.price,
      status: "Sent",
      time: "2:38 PM",
    };
    setMessages([...messages, newQuoteMessage]);
    setIsQuoteModalOpen(false);
  };

  return (
    // FIX: Add padding for the sticky header
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      {/* This div right here is the one you mentioned.
        It adds the padding for your sticky header.
        We need a separate Header component here just for the inbox.
      */}
      {/* FIX: This div now calculates its height to fill the viewport below the header */}
      <div className="flex h-[calc(100vh-122px)] border border-gray-200 bg-white text-gray-900 lg:h-[calc(100vh-127px)]">
        {/* --- 1. Conversation List Column --- */}
        <aside className="flex h-full w-full flex-col border-r border-gray-200 sm:w-1/3 lg:w-1/4">
          {/* ... conversation list ... */}
          <div className="flex-shrink-0 border-b border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <button className="flex items-center gap-1">
                <h2 className="text-xl font-bold">All Messages</h2>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search inbox..."
                className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 pr-3 pl-10 text-sm focus:outline-pink-500"
              />
            </div>
          </div>
          {/* List */}
          <div className="flex-grow overflow-y-auto">
            {conversations.map((convo) => (
              <ConversationItem
                key={convo.id}
                convo={convo}
                isSelected={selectedConvo?.id === convo.id}
                onClick={() => setSelectedConvo(convo)}
              />
            ))}
          </div>
        </aside>
        <main className="flex h-full w-full flex-col border-r border-gray-200 lg:w-1/2">
          {/* ... chat window ... */}
          {/* Chat Header */}
          <div className="flex-shrink-0 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedConvo?.user.name}
                </h3>
                <p className="text-xs font-medium text-green-600">Online</p>
              </div>
              <button className="rounded-full p-2 text-gray-400 hover:text-gray-700">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* NEW: Demo Toggle */}
          <div className="flex-shrink-0 border-b border-purple-200 bg-purple-50 p-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-semibold text-purple-800">
                Demo:
              </span>
              <button
                onClick={() => setUserType("vendor")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-all",
                  userType === "vendor"
                    ? "bg-pink-600 text-white shadow"
                    : "bg-white text-gray-700 hover:bg-gray-100",
                )}
              >
                View as Vendor
              </button>
              <button
                onClick={() => setUserType("client")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-all",
                  userType === "client"
                    ? "bg-pink-600 text-white shadow"
                    : "bg-white text-gray-700 hover:bg-gray-100",
                )}
              >
                View as Client
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-grow space-y-4 overflow-y-auto bg-gray-50 p-4">
            {messages.map((msg) => {
              if (msg.type === "quote") {
                return (
                  <QuoteBubble
                    key={msg.id}
                    msg={msg}
                    currentUser={currentUser}
                  />
                );
              }
              if (msg.type === "quote_request") {
                return (
                  <QuoteRequestBubble
                    key={msg.id}
                    msg={msg}
                    isMe={msg.senderId === currentUser.id}
                    // Only show button if user is a vendor and it's not their message
                    onSendQuoteClick={
                      userType === "vendor" && msg.senderId !== currentUser.id
                        ? () => setIsQuoteModalOpen(true)
                        : undefined
                    }
                  />
                );
              }
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  currentUser={currentUser}
                />
              );
            })}
          </div>

          {/* Chat Input */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-300 py-2 pr-24 pl-12 focus:outline-pink-500"
              />
              <button className="absolute top-3 left-3 text-gray-400 hover:text-gray-700">
                <Paperclip className="h-5 w-5" />
              </button>
              <button
                onClick={handleSend}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg bg-pink-600 p-2 text-white hover:bg-pink-700"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </main>
        <aside className="hidden h-full overflow-y-auto bg-gray-50 p-6 lg:block lg:w-1/4">
          {/* ... info sidebar ... */}
          {/* FIX: Show card based on who user is talking to */}
          {selectedConvo &&
            "isVendor" in selectedConvo.user &&
            selectedConvo.user.isVendor && (
              <VendorInfoCard
                profile={selectedConvo.user.profile}
                name={selectedConvo.user.name}
              />
            )}
          {selectedConvo &&
            "isClient" in selectedConvo.user &&
            selectedConvo.user.isClient && (
              <ClientInfoCard
                profile={selectedConvo.user.profile}
                name={selectedConvo.user.name}
              />
            )}
        </aside>

        {/* FIX: Conditionally show modal only for vendors */}
        {isQuoteModalOpen && userType === "vendor" && (
          <CreateQuoteModal
            onClose={() => setIsQuoteModalOpen(false)}
            onSend={handleSendQuote}
          />
        )}
      </div>
    </div>
  );
};

// ... (All the sub-components: ConversationItem, MessageBubble, etc.) ...
// --- Sub-Components ---

const ConversationItem = ({
  convo,
  isSelected,
  onClick,
}: {
  convo: any;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full space-x-3 border-b border-gray-100 p-4 text-left hover:bg-gray-50",
      isSelected && "bg-pink-50",
    )}
  >
    <img
      src={convo.user.avatarUrl}
      alt={convo.user.name}
      className="h-12 w-12 flex-shrink-0 rounded-full"
    />
    <div className="flex-grow overflow-hidden">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800">{convo.user.name}</h4>
        <span className="flex-shrink-0 text-xs text-gray-400">
          {convo.time}
        </span>
      </div>
      <p className="truncate text-sm text-gray-500">{convo.lastMessage}</p>
    </div>
    {convo.unread && (
      <div className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-pink-600"></div>
    )}
  </button>
);

const MessageBubble = ({
  msg,
  currentUser,
}: {
  msg: any;
  currentUser: any;
}) => {
  const isMe = msg.senderId === currentUser.id;
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
        <p className="text-sm">{msg.text}</p>
        <span
          className={cn(
            "mt-1 block text-right text-xs",
            isMe ? "text-pink-100" : "text-gray-400",
          )}
        >
          {msg.time}
        </span>
      </div>
    </div>
  );
};

// FIX: Updated QuoteRequestBubble to handle onSendQuoteClick prop
const QuoteRequestBubble = ({
  msg,
  isMe,
  onSendQuoteClick,
}: {
  msg: any;
  isMe: boolean;
  onSendQuoteClick?: () => void;
}) => {
  return (
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-xs rounded-lg border p-4",
          isMe ? "border-pink-200 bg-pink-50" : "border-gray-200 bg-white",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h5 className="font-semibold text-gray-800">Quote Request</h5>
            <p className="text-sm text-gray-600">{msg.gigTitle}</p>
          </div>
        </div>
        <p className="my-3 border-t border-b border-gray-100 py-3 text-sm text-gray-700 italic">
          "{msg.text}"
        </p>

        {/* FIX: Only show button if onSendQuoteClick is provided */}
        {onSendQuoteClick && (
          <button
            onClick={onSendQuoteClick}
            className="mt-1 w-full rounded-md bg-pink-600 py-2 text-center text-sm font-semibold text-white hover:bg-pink-700"
          >
            Send Quote
          </button>
        )}
        {isMe && (
          <p className="mt-2 text-center text-xs text-gray-500">
            You sent a quote request.
          </p>
        )}
      </div>
    </div>
  );
};

const QuoteBubble = ({ msg, currentUser }: { msg: any; currentUser: any }) => {
  const isMe = msg.senderId === currentUser.id;

  const handleAccept = () => {
    alert("Quote Accepted! (Mock)");
    // In a real app, you'd navigate to a payment page or update the order status
  };

  const handleRevise = () => {
    alert("Requesting Revision... (Mock)");
    // In a real app, you'd send a message back to the vendor
  };

  return (
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-xs rounded-lg border p-4",
          isMe
            ? "border-pink-200 bg-white" // Vendor's sent quote
            : "border-green-200 bg-white", // Client receiving a quote
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
              isMe ? "bg-pink-100" : "bg-green-100",
            )}
          >
            <FileText
              className={cn(
                "h-5 w-5",
                isMe ? "text-pink-600" : "text-green-600",
              )}
            />
          </div>
          <div>
            <h5 className="font-semibold text-gray-800">{msg.title}</h5>
            <p className="text-sm font-bold text-gray-900">
              ₦{msg.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* FIX: Show different buttons for client */}
        {isMe ? (
          <button className="mt-3 w-full rounded-md bg-gray-100 py-2 text-center text-sm font-semibold text-gray-700">
            Quote Sent
          </button>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleRevise}
              className="w-full rounded-md bg-gray-200 py-2 text-center text-sm font-semibold text-gray-800 hover:bg-gray-300"
            >
              Request Revision
            </button>
            <button
              onClick={handleAccept}
              className="w-full rounded-md bg-pink-600 py-2 text-center text-sm font-semibold text-white hover:bg-pink-700"
            >
              Accept Quote
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Info Cards ---

const VendorInfoCard = ({ profile, name }: { profile: any; name: string }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col items-center">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">About {name}</h3>
      <div className="mt-1 flex items-center gap-1.5">
        <Star className="h-5 w-5 fill-current text-yellow-400" />
        <span className="font-bold text-yellow-500">{profile.rating}</span>
        <span className="text-sm text-gray-500">({profile.reviews})</span>
        <span className="mx-1 text-gray-300">|</span>
        <Award className="h-5 w-5 text-pink-500" />
        <span className="text-sm font-semibold text-gray-700">
          {profile.level}
        </span>
      </div>
    </div>

    <div className="mt-6 border-t pt-6">
      <button className="flex w-full items-center justify-center gap-2 rounded-md bg-pink-100 py-2.5 font-bold text-pink-700 transition-colors hover:bg-pink-200">
        <Eye className="h-5 w-5" />
        View Profile
      </button>
    </div>

    <div className="mt-6 border-t pt-6">
      <div className="flex flex-col space-y-3">
        <div className="flex items-start gap-3 text-sm">
          <Clock className="h-5 w-5 flex-shrink-0 text-gray-500" />
          <span>
            Avg. response time: <strong>{profile.avgResponseTime}</strong>
          </span>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Calendar className="h-5 w-5 flex-shrink-0 text-gray-500" />
          <span>
            On Partygeng since: <strong>{profile.onPartygengSince}</strong>
          </span>
        </div>
      </div>
    </div>
  </div>
);

// RE-ADDED: ClientInfoCard
const ClientInfoCard = ({ profile, name }: { profile: any; name: string }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col items-center">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">About {name}</h3>
      {profile.isVerified && (
        <div className="mt-1 mb-4 flex items-center gap-2 rounded-md bg-green-50 p-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-semibold text-green-700">
            Verified Client
          </span>
        </div>
      )}
    </div>

    <div className="mt-6 border-t pt-6">
      <div className="flex items-center justify-around text-center">
        <div>
          <p className="text-2xl font-bold">{profile.stats.eventsHosted}</p>
          <p className="text-sm text-gray-500">Events Hosted</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{profile.stats.vendorsHired}</p>
          <p className="text-sm text-gray-500">Hires Made</p>
        </div>
      </div>
    </div>

    <div className="mt-6 border-t pt-6">
      <div className="flex flex-col space-y-3">
        <div className="flex items-start gap-3 text-sm">
          <MapPin className="h-5 w-5 flex-shrink-0 text-gray-500" />
          <span>
            From <strong>{profile.location}</strong>
          </span>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <Calendar className="h-5 w-5 flex-shrink-0 text-gray-500" />
          <span>{profile.memberSince}</span>
        </div>
      </div>
    </div>
  </div>
);

// RE-ADDED: CreateQuoteModal
const CreateQuoteModal = ({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (data: any) => void;
}) => {
  const [title, setTitle] = useState("DJ for 30th Birthday Bash");
  const [price, setPrice] = useState("250000");
  const [date, setDate] = useState("2025-12-15");
  const [includes, setIncludes] = useState(
    "- 6 hours of DJ service\n- Dance floor lighting\n- Wireless microphone",
  );

  const handleSubmit = () => {
    onSend({
      title,
      price: Number(price),
      date,
      includes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="m-4 w-full max-w-lg rounded-lg bg-white shadow-xl">
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
        <div className="space-y-4 p-6">
          <div>
            <label
              htmlFor="quoteTitle"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Service Title
            </label>
            <input
              type="text"
              id="quoteTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="quoteIncludes"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              What's Included
            </label>
            <textarea
              id="quoteIncludes"
              rows={4}
              value={includes}
              onChange={(e) => setIncludes(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-200 bg-gray-50 p-4">
          <button
            onClick={onClose}
            className="mr-2 rounded-md px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
          >
            Send Quote
          </button>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
