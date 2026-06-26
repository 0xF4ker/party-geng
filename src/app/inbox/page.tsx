"use client";
import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Loader2,
  ArrowLeft,
  MoreVertical,
  Info,
  KanbanSquare,
  EyeOff,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import {
  useChatRealtime,
  type MessageWithStatus,
} from "@/hooks/useChatRealtime";
import { ConversationList } from "@/app/_components/chat/ConversationList";
import {
  TextMessageBubble,
  QuoteMessageBubble,
} from "@/app/_components/chat/MessageBubbles";
import {
  EventInvitationMessageBubble,
  type MessageWithInvitation,
} from "@/app/_components/chat/EventInvitationMessageBubble";
import { ChatInput } from "@/app/_components/chat/ChatInput";
import { UserInfoSidebar } from "@/app/_components/chat/UserInfoSidebar";
import { usePresence } from "@/hooks/usePresence";
import { useUpload } from "@/hooks/useUpload";
import {
  ConversationListSkeleton,
  ChatMessagesSkeleton,
} from "@/app/_components/chat/ChatSkeletons";
import { useUiStore } from "@/stores/ui";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createId } from "@paralleldrive/cuid2";
import { ChatSettingsModal } from "@/app/_components/chat/ChatSettingsModal";
import { normalizeDate } from "@/lib/dateUtils";
type routerOutput = inferRouterOutputs<AppRouter>;
type conversationOutput = routerOutput["chat"]["getConversations"][number];
const InboxPageContent = () => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();
  const { data: settings } = api.chat.getSettings.useQuery();
  const { upload } = useUpload();
  const { onlineUsers } = usePresence(user?.id, settings?.statusOverride);

  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversation");
  const { headerHeight } = useUiStore();
  const [selectedConvo, setSelectedConvo] = useState<conversationOutput>();
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const hasAutoSelectedRef = useRef(false);

  const shouldBlockScreenshots = selectedConvo?.participants.some(
    (p) => p.user.chatSettings?.blockScreenshots === true
  ) ?? false;

  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    if (!shouldBlockScreenshots) {
      setIsBlurred(false);
      return;
    }
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    
    const handleVisibility = () => {
      if (document.hidden) setIsBlurred(true);
      else setIsBlurred(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [shouldBlockScreenshots]);

  const activeColor = settings?.chatThemeColor ?? "pink";
  const themeVars = useMemo(() => {
    const colors: Record<string, { primary: string; hover: string; light: string }> = {
      pink: { primary: "#f72585", hover: "#b5179e", light: "#fdf2f8" },
      purple: { primary: "#7209b7", hover: "#560bad", light: "#faf5ff" },
      blue: { primary: "#0077b6", hover: "#0096c7", light: "#f0f9ff" },
      indigo: { primary: "#3f51b5", hover: "#303f9f", light: "#f5f6fa" },
      green: { primary: "#10b981", hover: "#059669", light: "#ecfdf5" },
      orange: { primary: "#f97316", hover: "#ea580c", light: "#fff7ed" },
    };
    const c = colors[activeColor] || { primary: "#f72585", hover: "#b5179e", light: "#fdf2f8" };
    return {
      "--chat-primary": c.primary,
      "--chat-primary-hover": c.hover,
      "--chat-light": c.light,
    } as React.CSSProperties;
  }, [activeColor]);

  const getSelectedUserStatus = () => {
    if (!selectedConvo || selectedConvo.isGroup || !user) return undefined;
    const other = selectedConvo.participants.find(p => p.userId !== user.id);
    return other ? (onlineUsers[other.userId] ?? "OFFLINE") : "OFFLINE";
  };
  const { mutate: markConversationAsRead } =
    api.chat.markConversationAsRead.useMutation({
      onMutate: async ({ conversationId }) => {
        await utils.chat.getConversations.cancel();
        await utils.chat.getUnreadConversationCount.cancel();
        const previousConversations = utils.chat.getConversations.getData();
        const previousUnreadCount =
          utils.chat.getUnreadConversationCount.getData();
        utils.chat.getConversations.setData(undefined, (old) => {
          if (!old) return old;
          return old.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c,
          );
        });
        utils.chat.getUnreadConversationCount.setData(undefined, (old) =>
          (old ?? 0) > 0 ? old! - 1 : 0,
        );
        return { previousConversations, previousUnreadCount };
      },
      onError: (err, newTodo, context) => {
        utils.chat.getConversations.setData(
          undefined,
          context?.previousConversations,
        );
        utils.chat.getUnreadConversationCount.setData(
          undefined,
          context?.previousUnreadCount,
        );
      },
      onSettled: () => {
        void utils.chat.getConversations.invalidate();
        void utils.chat.getUnreadConversationCount.invalidate();
      },
    });
  const {
    data: conversations = [],
    isLoading: isConvosLoading,
    isFetching: isConvosFetching,
    refetch: refetchConvos,
  } = api.chat.getConversations.useQuery(undefined, { refetchInterval: false });
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    isFetching: isMessagesFetching,
    refetch: refetchMessages,
  } = api.chat.getMessages.useQuery(
    { conversationId: selectedConvo?.id ?? "", limit: 50 },
    { enabled: !!selectedConvo?.id },
  );
  useEffect(() => {
    if (!conversationIdFromUrl || conversations.length === 0) {
      return;
    }
    if (hasAutoSelectedRef.current) {
      return;
    }
    const convoToSelect = conversations.find(
      (c) => c.id === conversationIdFromUrl,
    );
    if (convoToSelect) {
      if (selectedConvo?.id !== convoToSelect.id) {
        setTimeout(() => {
          setSelectedConvo(convoToSelect);
          setShowMobileChat(true);
          hasAutoSelectedRef.current = true;
        }, 0);
      }
    }
  }, [conversationIdFromUrl, conversations]);
  useEffect(() => {
    if (selectedConvo?.id) {
      markConversationAsRead({ conversationId: selectedConvo.id });
    }
  }, [selectedConvo?.id, markConversationAsRead]);
  const {
    messages,
    addOptimisticMessage,
    removeOptimisticMessage,
    updateOptimisticStatus,
    sendTypingEvent,
    typingUsers,
  } = useChatRealtime(selectedConvo?.id, messagesData?.messages ?? []);
  const sendMessage = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      void refetchConvos();
    },
  });
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);
  const handleSend = async (text: string, files?: File[] | string, retryTempId?: string) => {
    if (!selectedConvo || !user) return;
    const actualFiles = Array.isArray(files) ? files : undefined;
    const actualRetryTempId = typeof files === "string" ? files : retryTempId;
    const tempId = actualRetryTempId ?? createId();
    
    const localUrls = actualFiles ? actualFiles.map(file => URL.createObjectURL(file)) : [];

    const optimisticMsg: MessageWithStatus = {
      id: tempId,
      tempId: tempId,
      text: text,
      senderId: user.id,
      conversationId: selectedConvo.id,
      createdAt: new Date(),
      status: "sending",
      quote: null,
      eventInvitation: null,
      attachmentUrls: localUrls,
      starredBy: [],
      sender: {
        id: user.id,
        username: user.username,
        clientProfile: null,
        vendorProfile: null,
      },
      isDeletedForEveryone: false,
    };
    if (actualRetryTempId) {
      updateOptimisticStatus(actualRetryTempId, "sending");
    } else {
      addOptimisticMessage(optimisticMsg);
    }

    // Optimistically update conversations list in cache
    const previewText = text.trim() 
      ? text 
      : (localUrls.length > 0 ? "📎 Sent an attachment" : "");

    utils.chat.getConversations.setData(undefined, (oldConvos) => {
      if (!oldConvos) return [];
      return oldConvos.map((c) => {
        if (c.id === selectedConvo.id) {
          return {
            ...c,
            updatedAt: new Date(),
            messages: [
              {
                id: tempId,
                text: previewText,
                createdAt: new Date(),
                senderId: user.id,
                isDeletedForEveryone: false,
              },
            ],
          };
        }
        return c;
      });
    });

    let uploadedUrls: string[] = [];
    if (actualFiles && actualFiles.length > 0) {
      try {
        const uploadPromises = actualFiles.map(file => upload(file, "board-images"));
        const results = await Promise.all(uploadPromises);
        uploadedUrls = results.filter((url): url is string => !!url);
        if (uploadedUrls.length !== actualFiles.length) {
          throw new Error("Failed to upload all attachments");
        }
      } catch (err) {
        console.error("Upload failed:", err);
        updateOptimisticStatus(tempId, "error");
        return;
      }
    }

    sendMessage.mutate(
      { conversationId: selectedConvo.id, text, attachmentUrls: uploadedUrls },
      {
        onSuccess: (sentMessage) => {
          removeOptimisticMessage(tempId);
          if (sentMessage) {
            addOptimisticMessage({
              ...sentMessage,
              status: "sent",
            });
            // Update cache with real message details
            utils.chat.getConversations.setData(undefined, (oldConvos) => {
              if (!oldConvos) return [];
              return oldConvos.map((c) => {
                if (c.id === selectedConvo.id) {
                  return {
                    ...c,
                    updatedAt: new Date(sentMessage.createdAt),
                    messages: [
                      {
                        id: sentMessage.id,
                        text: sentMessage.text,
                        createdAt: sentMessage.createdAt,
                        senderId: sentMessage.senderId,
                        isDeletedForEveryone: sentMessage.isDeletedForEveryone,
                      },
                    ],
                  };
                }
                return c;
              });
            });
          }
        },
        onError: (error) => {
          console.error("Failed to send:", error);
          updateOptimisticStatus(tempId, "error");
        },
      },
    );
  };
  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    const names = typingUsers.map(userId => {
        const p = selectedConvo?.participants.find(p => p.userId === userId);
        return p?.user.username ?? "Someone";
    });
    
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return "Several people are typing...";
  };
  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-pink-600" />
      </div>
    );
  const isVendor = !!user.vendorProfile;
  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900"
      style={{ paddingTop: headerHeight, ...themeVars }}
    >
      <ChatSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <div
        className="flex border-t border-gray-200 bg-white text-gray-900"
        style={{ height: `calc(100vh - ${headerHeight}px)` }}
      >
        {/* Left Sidebar: Conversation List */}
        <aside
          className={`w-full border-r sm:w-1/3 lg:w-1/4 ${showMobileChat ? "hidden sm:flex" : "flex"}`}
        >
          {isConvosLoading || (isConvosFetching && conversations.length === 0) ? (
            <ConversationListSkeleton />
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedConvo?.id}
              onSelect={(c) => {
                setSelectedConvo(c);
                setShowMobileChat(true);
              }}
              currentUserId={user.id}
              onOpenSettings={() => setShowSettings(true)}
              onlineUsers={onlineUsers}
            />
          )}
        </aside>
        {/* Middle: Chat Area */}
        <main
          className={`flex flex-1 flex-col bg-[#efeae2] relative overflow-hidden ${!showMobileChat ? "hidden sm:flex" : "flex"}`}
          style={{
            filter: isBlurred ? "blur(16px)" : "none",
            userSelect: shouldBlockScreenshots ? "none" : "auto",
            transition: "filter 0.3s ease",
          }}
        >
          {isBlurred && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md text-white p-6 text-center select-none animate-in fade-in duration-300">
              <EyeOff className="h-12 w-12 text-pink-500 mb-4 animate-bounce" />
              <h4 className="text-lg font-bold">Screenshots Blocked for Privacy</h4>
              <p className="text-sm text-gray-300 mt-2 max-w-xs">
                The other chat participant has enabled screenshot protection. Please switch back to this tab to resume chatting.
              </p>
            </div>
          )}
          {selectedConvo ? (
            <>
              {/* Header */}
              <div className="z-10 flex items-center justify-between border-b bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="sm:hidden"
                  >
                    <ArrowLeft />
                  </button>
                  <h3 className="font-bold text-gray-800">
                    {selectedConvo.isGroup
                      ? (selectedConvo.clientEvent?.title ?? "Group Chat")
                      : selectedConvo.participants.find(
                          (p) => p.user.id !== user.id,
                        )?.user.username}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConvo.clientEventId && (
                    <Link href={`/event/${selectedConvo.clientEventId}/board`}>
                      <Button variant="ghost" size="icon">
                        <KanbanSquare className="h-5 w-5 text-gray-500" />
                      </Button>
                    </Link>
                  )}
                  <button
                    onClick={() => setShowInfoSidebar(true)}
                    className="lg:hidden"
                  >
                    <Info className="text-gray-400" />
                  </button>
                  <div className="hidden lg:block">
                    <MoreVertical className="text-gray-400" />
                  </div>
                </div>
              </div>
              {/* Messages Window */}
              {isMessagesLoading || (isMessagesFetching && messages.length === 0) ? (
                <ChatMessagesSkeleton />
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {(() => {
                    let shownUnreadDivider = false;
                    return messages.map((msg) => {
                      const isUnread =
                        messagesData?.firstUnreadTimestamp &&
                        new Date(msg.createdAt) >=
                          new Date(messagesData.firstUnreadTimestamp) &&
                        msg.senderId !== user.id;
                      let showDivider = false;
                      if (isUnread && !shownUnreadDivider) {
                        showDivider = true;
                        shownUnreadDivider = true;
                      }
                      let isRead = false;
                      if (msg.senderId === user.id && selectedConvo) {
                          const otherParticipants = selectedConvo.participants.filter(p => p.userId !== user.id);
                          const messageDate = normalizeDate(msg.createdAt);
                          isRead = otherParticipants.length > 0 && otherParticipants.every(p => {
                              return p.lastReadAt && new Date(p.lastReadAt) >= messageDate;
                          });
                      }
                      return (
                        <React.Fragment key={msg.id || msg.tempId}>
                          {showDivider && (
                            <div className="relative my-4 text-center">
                              <hr className="border-gray-300" />
                              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#efeae2] px-2 text-xs font-bold text-gray-500 uppercase">
                                New Messages
                              </span>
                            </div>
                          )}
                          {msg.eventInvitation ? (
                            <EventInvitationMessageBubble
                              message={msg as MessageWithInvitation}
                              isMe={msg.senderId === user.id}
                              onUpdate={() => refetchMessages()}
                            />
                          ) : msg.quote ? (
                            <QuoteMessageBubble
                              message={msg}
                              isMe={msg.senderId === user.id}
                              _onUpdate={() => refetchMessages()}
                            />
                          ) : (
                            <TextMessageBubble
                              message={msg}
                              isMe={msg.senderId === user.id}
                              onRetry={() => handleSend(msg.text, msg.tempId)}
                              onUpdate={() => refetchMessages()}
                              isGroupAdmin={selectedConvo.groupAdminId === user.id}
                              isRead={isRead}
                            />
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                  <div ref={scrollRef} />
                </div>
              )}
              {/* Input */}
              <div className="bg-white p-4">
                {typingUsers.length > 0 && (
                    <div className="text-xs text-gray-500 italic mb-2 ml-2 animate-pulse">
                        {getTypingText()}
                    </div>
                )}
                <ChatInput
                  onSend={handleSend}
                  isVendor={isVendor}
                  conversationId={selectedConvo.id}
                  otherUserId={
                    selectedConvo.participants.find(
                      (p) => p.user.id !== user.id,
                    )?.user.id ?? ""
                  }
                  disabled={sendMessage.isPending}
                  onQuoteSent={() => {
                    void refetchMessages();
                    void refetchConvos();
                  }}
                  isGroup={selectedConvo.isGroup}
                  onTyping={sendTypingEvent}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-gray-50 text-gray-400">
              Select a conversation to start chatting
            </div>
          )}
        </main>
        {/* Right: Info Sidebar (Only on large screens) */}
        <aside className="hidden w-1/4 overflow-y-auto border-l bg-white lg:block">
          {selectedConvo && (
            <UserInfoSidebar
              conversation={selectedConvo}
              currentUserId={user.id}
              onlineStatus={getSelectedUserStatus()}
            />
          )}
        </aside>
        {/* Mobile Info Sidebar */}
        {showInfoSidebar && selectedConvo && (
          <div
            className="absolute inset-0 z-20 bg-black/30 lg:hidden"
            onClick={() => setShowInfoSidebar(false)}
            style={{ top: headerHeight }}
          >
            <div
              className="absolute top-0 right-0 h-full w-4/5 max-w-sm bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <UserInfoSidebar
                conversation={selectedConvo}
                currentUserId={user.id}
                onClose={() => setShowInfoSidebar(false)}
                onlineStatus={getSelectedUserStatus()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const InboxPage = dynamic(() => Promise.resolve(InboxPageContent), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-pink-600" />
    </div>
  ),
});
export default InboxPage;