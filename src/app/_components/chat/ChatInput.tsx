import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Send, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateQuoteModal } from "./CreateQuoteModal";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  isVendor: boolean;
  conversationId: string;
  otherUserId: string;
  onQuoteSent: () => void;
  isGroup?: boolean;
}

export const ChatInput = ({
  onSend,
  disabled,
  isVendor,
  conversationId,
  otherUserId,
  onQuoteSent,
  isGroup = false,
}: ChatInputProps) => {
  const [text, setText] = useState("");
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit"; // Reset height
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`; // Grow up to 120px
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        onSend(text);
        setText("");
      }
    }
  };

  const handleSendClick = () => {
    if (text.trim()) {
      onSend(text);
      setText("");
    }
  };

  return (
    <>
      <div className="relative flex items-end gap-2 rounded-xl bg-gray-50 p-2 shadow-inner">
        {/* Attachment Button (Placeholder) */}
        <button className="mb-2 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600">
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          disabled={disabled}
          className="max-h-[120px] flex-1 resize-none bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 disabled:opacity-50"
        />

        <div className="flex gap-2 pb-1">
          {/* Vendor Quote Button - Disabled in Group Chats */}
          {isVendor && !isGroup && (
            <button
              onClick={() => setShowQuoteModal(true)}
              className="rounded-lg bg-blue-100 p-2 text-blue-600 transition-colors hover:bg-blue-200"
              title="Send Quote"
            >
              <FileText className="h-5 w-5" />
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSendClick}
            disabled={disabled || !text.trim()}
            className={cn(
              "rounded-lg p-2 transition-all",
              text.trim()
                ? "bg-pink-600 text-white shadow-md hover:bg-pink-700"
                : "bg-gray-200 text-gray-400",
            )}
          >
            {disabled ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Modal integration */}
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
