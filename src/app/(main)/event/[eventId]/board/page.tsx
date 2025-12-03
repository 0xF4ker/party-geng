"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { AppRouter } from "@/server/api/root";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useUiStore } from "@/stores/ui";
import { BoardPostType } from "@prisma/client";
import {createId} from "@paralleldrive/cuid2";
const api = createTRPCReact<AppRouter>();

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type Post = EventDetails["boardPosts"][number];

// --- Constants ---

const NOTE_COLORS = [
  { bg: "bg-yellow-100", text: "text-yellow-900", border: "border-yellow-200" },
  { bg: "bg-rose-100", text: "text-rose-900", border: "border-rose-200" },
  {
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    border: "border-emerald-200",
  },
  { bg: "bg-sky-100", text: "text-sky-900", border: "border-sky-200" },
  { bg: "bg-violet-100", text: "text-violet-900", border: "border-violet-200" },
];

// --- Sub-Components ---

const ModernPin = () => (
  <div className="pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2 transform">
    <div className="h-3 w-3 rounded-full border border-slate-600 bg-slate-800 shadow-sm"></div>
  </div>
);

const DeleteButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="absolute top-2 right-2 z-30 cursor-pointer rounded-full bg-white/80 p-1.5 text-slate-400 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
    title="Delete"
  >
    <svg
      className="h-3 w-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
);

// Draggable Wrapper
const DraggableItem = ({
  post,
  onUpdatePosition,
  children,
  zIndex,
  onFocus,
}: {
  post: Post;
  onUpdatePosition: (id: string, x: number, y: number, zIndex: number) => void;
  children: React.ReactNode;
  zIndex: number;
  onFocus: () => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({
    x: post.x,
    y: post.y,
  });
  const dragOffset = useRef({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  // Sync with remote updates if we aren't dragging
  useEffect(() => {
    if (!isDragging) {
      setPos({ x: post.x, y: post.y });
    }
  }, [post.x, post.y, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only left click
    if (e.button !== 0) return;

    onFocus(); // Bring to front
    setIsDragging(true);

    const rect = nodeRef.current!.getBoundingClientRect();

    // Calculate offset relative to the item
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !nodeRef.current) return;

      const parentRect =
        nodeRef.current.offsetParent?.getBoundingClientRect() ?? {
          left: 0,
          top: 0,
        };

      // Calculate new position relative to parent
      let newX = e.clientX - parentRect.left - dragOffset.current.x;
      let newY = e.clientY - parentRect.top - dragOffset.current.y;

      // Basic bounds checking (optional, keeping it loose for now)
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      setPos({ x: newX, y: newY });
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onUpdatePosition(post.id, pos.x, pos.y, zIndex);
    }
  }, [isDragging, onUpdatePosition, post.id, pos.x, pos.y, zIndex]);

  // Global listeners for drag interactions
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={nodeRef}
      onMouseDown={handleMouseDown}
      style={{
        left: pos.x,
        top: pos.y,
        zIndex: isDragging ? 9999 : zIndex, // Pop to top on drag
        position: "absolute",
      }}
      className={`cursor-move touch-none select-none ${
        isDragging ? "scale-105 opacity-90" : ""
      } transition-transform duration-75`}
    >
      {children}
    </div>
  );
};

const NoteCard = ({
  post,
  userId,
  deletePost,
}: {
  post: Post;
  userId: string;
  deletePost: (id: string) => void;
}) => {
  const color = NOTE_COLORS[post.colorIndex % NOTE_COLORS.length];
  const isCurrentUser = post.authorId === userId;
  const rotation = post.rotation;

  return (
    <div
      className={`group relative w-64 ${color.bg} ${color.text} min-h-[160px] rounded-lg border p-5 pt-7 shadow-sm hover:shadow-2xl ${color.border} transition-shadow duration-300`}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "top center",
      }}
    >
      <ModernPin />
      {isCurrentUser && <DeleteButton onClick={() => deletePost(post.id)} />}

      <div className="font-handwriting pointer-events-none mb-4 text-lg font-medium leading-relaxed">
        {post.content}
      </div>

      <div className="pointer-events-none mt-auto flex items-center justify-between border-t border-black/5 pt-3">
        <div className="flex items-center gap-1.5">
          <div
            className={`h-2 w-2 rounded-full ${
              isCurrentUser ? "bg-indigo-500" : "bg-slate-400"
            }`}
          ></div>
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
            {post.authorName}
          </span>
        </div>
      </div>
    </div>
  );
};

const ImageCard = ({
  post,
  userId,
  deletePost,
}: {
  post: Post;
  userId: string;
  deletePost: (id: string) => void;
}) => {
  const isCurrentUser = post.authorId === userId;
  const rotation = post.rotation;

  return (
    <div
      className="group relative w-64 rounded-lg border border-slate-200 bg-white p-2 pb-4 shadow-sm transition-shadow duration-300 hover:shadow-2xl"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <ModernPin />
      {isCurrentUser && <DeleteButton onClick={() => deletePost(post.id)} />}

      <div className="pointer-events-none aspect-auto overflow-hidden rounded bg-slate-100">
        <img
          src={post.content}
          alt="Shared content"
          className="h-auto w-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = `https://placehold.co/400x300/f1f5f9/94a3b8?text=Image+Error`;
          }}
        />
      </div>

      <div className="pointer-events-none mt-3 flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {post.authorName}
        </span>
        {isCurrentUser && (
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
        )}
      </div>
    </div>
  );
};

const InputStation = ({
  onPost,
  isPosting,
  user,
}: {
  onPost: (post: {
    type: "note" | "image";
    content: string;
    colorIdx: number;
  }) => void;
  isPosting: boolean;
  user: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"note" | "image">("note");
  const [content, setContent] = useState("");
  const [colorIdx, setColorIdx] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPost({ type, content, colorIdx });
    setContent("");
    if (type === "note") setColorIdx((prev) => (prev + 1) % NOTE_COLORS.length);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="pointer-events-auto mb-8 flex transform items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-slate-50 hover:shadow-xl active:scale-95"
      >
        <span className="text-xl leading-none">＋</span>
        <span>Add Pin</span>
      </button>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-4 pointer-events-auto relative mx-auto mb-8 w-full max-w-xl rounded-2xl border border-white/40 bg-white/90 p-1 shadow-xl ring-1 ring-black/5 backdrop-blur-xl duration-300">
      {/* Close Button */}
      <button
        onClick={() => setIsOpen(false)}
        className="absolute top-3 right-3 z-20 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="Close input"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div className="mb-3 flex gap-1 rounded-xl bg-slate-100/50 p-1 pr-10">
        <button
          onClick={() => setType("note")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
            type === "note"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:bg-white/50"
          }`}
        >
          Note
        </button>
        <button
          onClick={() => setType("image")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
            type === "image"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:bg-white/50"
          }`}
        >
          Image
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pb-4">
        <div className="group relative">
          {type === "note" ? (
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your thought here..."
              className="h-20 w-full resize-none border-none bg-transparent text-lg font-medium text-slate-700 placeholder:text-slate-400 focus:ring-0"
            />
          ) : (
            <input
              autoFocus
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste image URL..."
              className="h-12 w-full border-none bg-transparent text-slate-700 placeholder:text-slate-400 focus:ring-0"
            />
          )}

          {type === "note" && (
            <div className="mt-2 flex gap-1.5">
              {NOTE_COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setColorIdx(i)}
                  className={`h-4 w-4 rounded-full border transition-transform ${c.bg} ${c.border} ${
                    colorIdx === i
                      ? "scale-125 ring-2 ring-slate-200 ring-offset-1"
                      : "hover:scale-110"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
            {user ? `Posting as ${user}` : "Connecting..."}
          </div>
          <button
            type="submit"
            disabled={!content.trim() || isPosting}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPosting ? "Saving..." : "Pin to Board"}
            {!isPosting && <span className="text-slate-400">↵</span>}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Main Component ---

export default function EventCollaborativeBoard() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const utils = api.useUtils();
  const { headerHeight } = useUiStore();

  const { data: event, isLoading } = api.event.getById.useQuery({
    id: eventId,
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [focusMap, setFocusMap] = useState<Record<string, number>>({});
  
  useEffect(() => {
    if (event) {
      setPosts(event.boardPosts);
    }
  }, [event]);

  useEffect(() => {
    const channel = supabase
      .channel(`board-posts:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "BoardPost", filter: `eventId=eq.${eventId}` },
        (payload) => {
           utils.event.getById.invalidate({ id: eventId });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, utils]);


  const addPostMutation = api.event.addBoardPost.useMutation({
    onMutate: async (newPost) => {
      setIsPosting(true);
      await utils.event.getById.cancel({ id: eventId });
      const previousEvent = utils.event.getById.getData({ id: eventId });
      if (previousEvent && user) {
        const tempId = createId();
        const optimisticPost: Post = {
          id: tempId,
          authorId: user.id,
          authorName: user.username,
          createdAt: new Date(),
          author: user,
          ...newPost,
        };
        utils.event.getById.setData({ id: eventId }, {
          ...previousEvent,
          boardPosts: [...previousEvent.boardPosts, optimisticPost],
        });
      }
      return { previousEvent };
    },
    onSuccess: () => utils.event.getById.invalidate({ id: eventId }),
    onError: (err, newPost, context) => {
      if (context?.previousEvent) {
        utils.event.getById.setData({ id: eventId }, context.previousEvent);
      }
    },
    onSettled: () => setIsPosting(false),
  });

  const updatePositionMutation = api.event.updateBoardPostPosition.useMutation({
    onMutate: async (updatedPost) => {
      await utils.event.getById.cancel({ id: eventId });
      const previousEvent = utils.event.getById.getData({ id: eventId });
      if (previousEvent) {
        utils.event.getById.setData({ id: eventId }, {
          ...previousEvent,
          boardPosts: previousEvent.boardPosts.map(p => p.id === updatedPost.id ? {...p, ...updatedPost} : p),
        });
      }
      return { previousEvent };
    },
    onError: (err, newPost, context) => {
      if (context?.previousEvent) {
        utils.event.getById.setData({ id: eventId }, context.previousEvent);
      }
    },
    onSettled: () => {
      utils.event.getById.invalidate({ id: eventId });
    }
  });

  const deletePostMutation = api.event.deleteBoardPost.useMutation({
    onMutate: async (deletedPost) => {
      await utils.event.getById.cancel({ id: eventId });
      const previousEvent = utils.event.getById.getData({ id: eventId });
      if (previousEvent) {
        utils.event.getById.setData({ id: eventId }, {
          ...previousEvent,
          boardPosts: previousEvent.boardPosts.filter(p => p.id !== deletedPost.id),
        });
      }
      return { previousEvent };
    },
    onError: (err, newPost, context) => {
      if (context?.previousEvent) {
        utils.event.getById.setData({ id: eventId }, context.previousEvent);
      }
    },
    onSettled: () => {
      utils.event.getById.invalidate({ id: eventId });
    }
  });

  const handlePost = async ({
    type,
    content,
    colorIdx,
  }: {
    type: "note" | "image";
    content: string;
    colorIdx: number;
  }) => {
    if (!user) return;
    const randomX = Math.random() * 400 + 100;
    const randomY = Math.random() * 300 + 200;

    addPostMutation.mutate({
      eventId,
      type: type === "note" ? BoardPostType.NOTE : BoardPostType.IMAGE,
      content,
      colorIndex: colorIdx,
      x: randomX,
      y: randomY,
      zIndex: 1,
      rotation: Math.random() * 6 - 3,
    });
  };

  const handleUpdatePosition = useCallback(
    async (id: string, x: number, y: number, zIndex: number) => {
      updatePositionMutation.mutate({ id, x, y, zIndex });
    },
    [updatePositionMutation],
  );

  const deletePost = useCallback(
    async (id: string) => {
      deletePostMutation.mutate({ id });
    },
    [deletePostMutation],
  );

  const handleFocus = (id: string) => {
    setFocusMap((prev) => ({
      ...prev,
      [id]: (Math.max(...Object.values(prev), 0) || 10) + 1,
    }));
  };

  const boardSize = useMemo(() => {
    if (posts.length === 0) {
      return { width: "100%", height: "100%" };
    }
    const maxX = Math.max(0, ...posts.map((p) => p.x));
    const maxY = Math.max(0, ...posts.map((p) => p.y));

    const width = maxX + 400;
    const height = maxY + 400;

    return {
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [posts]);


  if (isLoading || !event) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900"
      style={{ paddingTop: headerHeight }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="p-6">
        <div className="pointer-events-auto flex flex-col items-center">
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-800 drop-shadow-sm">
            {event.title} - Collaborative Board
          </h2>
          <InputStation
            onPost={handlePost}
            isPosting={isPosting}
            user={user?.username ?? "Anonymous"}
          />
        </div>
      </div>

      <div className="relative flex-grow overflow-auto">
        {posts.length > 0 ? (
          <div className="relative" style={boardSize}>
            {posts.map((post) => (
              <DraggableItem
                key={post.id}
                post={post}
                onUpdatePosition={handleUpdatePosition}
                zIndex={focusMap[post.id] || post.zIndex || 1}
                onFocus={() => handleFocus(post.id)}
              >
                {post.type === "NOTE" ? (
                  <NoteCard
                    post={post}
                    userId={user?.id ?? ""}
                    deletePost={deletePost}
                  />
                ) : (
                  <ImageCard
                    post={post}
                    userId={user?.id ?? ""}
                    deletePost={deletePost}
                  />
                )}
              </DraggableItem>
            ))}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center opacity-30">
              <span className="mb-4 block text-6xl">📌</span>
              <p className="font-handwriting text-2xl">Pin something here!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}