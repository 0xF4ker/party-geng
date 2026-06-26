import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Send, FileText, Loader2, Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateQuoteModal } from "./CreateQuoteModal";

const EMOJI_CATEGORIES = [
  { name: "Smileys", icon: "😀", list: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😋", "😜", "🤪", "🧐", "🤓", "😎", "🥳"] },
  { name: "Food", icon: "🍏", list: ["🍏", "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍍", "🍕", "🍔", "🍟", "🍿", "🍰", "🍩", "🍪", "🍻"] },
  { name: "Activities", icon: "🎉", list: ["🎉", "🎊", "🎈", "🎂", "🎆", "🎇", "✨", "⚽", "🏀", "🎮", "🎲", "🎸", "🎤", "🥁"] },
  { name: "Specials", icon: "🪩", list: ["🎛️", "🍹", "💃", "🎤", "🥳", "🪩", "🎟️", "✨", "👑", "🔥", "🍻", "🍕"] }
];
interface ChatInputProps {
  onSend: (text: string, files?: File[]) => void;
  disabled: boolean;
  isVendor: boolean;
  conversationId: string;
  otherUserId: string;
  onQuoteSent: () => void;
  isGroup?: boolean;
  onTyping?: () => void;
}
export const ChatInput = ({
  onSend,
  disabled,
  isVendor,
  conversationId,
  otherUserId,
  onQuoteSent,
  isGroup = false,
  onTyping,
}: ChatInputProps) => {
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCat, setActiveEmojiCat] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const lastTypingTime = useRef<number>(0);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    const now = Date.now();
    if (onTyping && now - lastTypingTime.current > 2000) {
      onTyping();
      lastTypingTime.current = now;
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() || selectedFiles.length > 0) {
        onSend(text, selectedFiles);
        setText("");
        setSelectedFiles([]);
        setShowEmojiPicker(false);
      }
    }
  };
  const handleSendClick = () => {
    if (text.trim() || selectedFiles.length > 0) {
      onSend(text, selectedFiles);
      setText("");
      setSelectedFiles([]);
      setShowEmojiPicker(false);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  const handleRemoveFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleEmojiClick = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };
  return (
    <>
      <div className="relative flex flex-col gap-2 rounded-xl bg-gray-50 p-2 shadow-inner border border-gray-100">
        {/* Selected Files Preview Bar */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-white border border-gray-100 shadow-xs max-h-32 overflow-y-auto">
            {selectedFiles.map((file, idx) => {
              const isImg = file.type.startsWith("image/");
              const url = isImg ? URL.createObjectURL(file) : null;
              return (
                <div key={idx} className="relative group h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                  {isImg && url ? (
                    <img src={url} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-1 text-[8px] text-gray-500 font-semibold truncate w-full text-center">
                      <FileText className="h-5 w-5 text-gray-400 mb-0.5" />
                      <span className="w-full truncate">{file.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute -top-1 -right-1 rounded-full bg-black/70 p-1 text-white opacity-100 hover:bg-black/90 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attachment Input & Button */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,text/*"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mb-2 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
            title="Attach Files"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Emoji Toggle Button */}
          <div className="relative mb-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn(
                "rounded-full p-2 transition-colors",
                showEmojiPicker
                  ? "bg-[var(--chat-light,#fdf2f8)] text-[var(--chat-primary,#f72585)]"
                  : "text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              )}
              title="Add Emoji"
            >
              <Smile className="h-5 w-5" />
            </button>

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-12 left-0 z-50 w-72 rounded-xl border border-gray-150 bg-white p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                {/* Category Header */}
                <div className="flex border-b border-gray-100 pb-2 mb-2 justify-between">
                  {EMOJI_CATEGORIES.map((cat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveEmojiCat(idx)}
                      className={cn(
                        "p-1.5 rounded-lg text-sm transition-all hover:bg-gray-50",
                        activeEmojiCat === idx && "bg-[var(--chat-light,#fdf2f8)] text-[var(--chat-primary,#f72585)] scale-110"
                      )}
                      title={cat.name}
                    >
                      {cat.icon}
                    </button>
                  ))}
                </div>
                {/* Emoji Grid */}
                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-1">
                  {EMOJI_CATEGORIES[activeEmojiCat]?.list.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="flex aspect-square items-center justify-center rounded-lg text-lg transition-transform hover:scale-120 hover:bg-gray-50 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400 text-center font-medium">
                  {EMOJI_CATEGORIES[activeEmojiCat]?.name === "Specials" 
                    ? "✨ PartyGeng Custom Emojis ✨" 
                    : EMOJI_CATEGORIES[activeEmojiCat]?.name}
                </div>
              </div>
            )}
          </div>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            disabled={disabled}
            className="max-h-[120px] flex-1 resize-none bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 disabled:opacity-50"
          />

          <div className="flex gap-2 pb-1">
            {/* Vendor Quote Button */}
            {isVendor && !isGroup && (
              <button
                type="button"
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
              disabled={disabled || (!text.trim() && selectedFiles.length === 0)}
              className={cn(
                "rounded-lg p-2 transition-all",
                text.trim() || selectedFiles.length > 0
                  ? "bg-[var(--chat-primary,#f72585)] text-white shadow-md hover:bg-[var(--chat-primary-hover,#b5179e)]"
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
