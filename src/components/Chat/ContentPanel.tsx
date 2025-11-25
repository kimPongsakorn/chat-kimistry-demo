"use client";

import { sendMessage } from "@/actions/actions";
import { useMessages } from "@/hooks/useMessages";
import { UserListItem } from "@/types/user";
import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

interface ContentPanelProps {
  isBlurred?: boolean;
  selectedUser: UserListItem | null;
  currentUserId?: number;
  conversationId: number | null;
  onMessageSent?: () => void;
}

export function ContentPanel({
  isBlurred = false,
  selectedUser,
  currentUserId,
  conversationId,
  onMessageSent,
}: ContentPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const previousMessagesLengthRef = useRef(0);

  const {
    messages,
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    refresh,
  } = useMessages(conversationId, currentUserId);

  // Auto-scroll to bottom when new messages arrive (but not when loading older messages)
  useEffect(() => {
    if (shouldScrollToBottom && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, shouldScrollToBottom]);

  // Track if we should scroll to bottom (only when messages increase, not when loading older)
  useEffect(() => {
    if (messages.length > previousMessagesLengthRef.current) {
      setShouldScrollToBottom(true);
    }
    previousMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Infinite scroll for loading older messages (scroll up)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // When scrolling near the top, load more messages
      if (container.scrollTop < 100 && hasNextPage && !isLoadingMore && !isLoading) {
        const previousScrollHeight = container.scrollHeight;
        loadMore();
        // After loading, maintain scroll position
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
          }
        }, 0);
      }
      // Track if user is at bottom to decide if we should auto-scroll
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setShouldScrollToBottom(isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isLoadingMore, isLoading, loadMore]);

  const handleSendMessage = async (messageText: string) => {
    if (!conversationId || !currentUserId || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(conversationId, messageText);
      // Refresh messages to get the new message
      refresh();
      onMessageSent?.();
    } catch (error) {
      console.error("Failed to send message:", error);
      alert(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={`flex h-full flex-col ${
        isBlurred ? "blur-sm pointer-events-none" : ""
      }`}
    >
      {/* Header */}
      <ChatHeader user={selectedUser} />

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
      >
        <div className="flex flex-col gap-4">
          {/* Loading indicator for older messages */}
          {isLoadingMore && (
            <div className="flex justify-center py-2">
              <span className="text-xs text-muted-foreground">กำลังโหลดข้อความเก่า...</span>
            </div>
          )}
          
          {/* Load more trigger (invisible) */}
          {hasNextPage && <div ref={messagesTopRef} />}

          {isLoading && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-muted-foreground">กำลังโหลดข้อความ...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-muted-foreground">
                {selectedUser
                  ? "ยังไม่มีข้อความ เริ่มสนทนากันเลย!"
                  : "เลือกผู้ใช้เพื่อเริ่มสนทนา"}
              </span>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={!conversationId || isBlurred || isSending}
      />
    </div>
  );
}

