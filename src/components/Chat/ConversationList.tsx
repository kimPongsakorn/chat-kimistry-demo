"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Conversation } from "@/types/user";
import { useEffect, useRef } from "react";

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId?: number;
  selectedConversationId?: number | null;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  onConversationSelect?: (conversation: Conversation) => void;
  onLoadMore?: () => void;
  isBlurred?: boolean;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "เมื่อสักครู่";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} นาทีที่แล้ว`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ชั่วโมงที่แล้ว`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} วันที่แล้ว`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} สัปดาห์ที่แล้ว`;
  }

  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getOtherParticipant(
  conversation: Conversation,
  currentUserId?: number
): { id: number; name: string; email: string } | null {
  if (conversation.isGroup) {
    // For groups, return the first participant or a group name
    return conversation.participants[0] || null;
  }

  // For 1-on-1 chats, return the other participant
  const otherParticipant = conversation.participants.find(
    (p) => p.id !== currentUserId
  );
  return otherParticipant || conversation.participants[0] || null;
}

export function ConversationList({
  conversations,
  currentUserId,
  selectedConversationId,
  isLoading = false,
  isLoadingMore = false,
  hasNextPage = false,
  onConversationSelect,
  onLoadMore,
  isBlurred = false,
}: ConversationListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isLoadingMore, onLoadMore]);

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <span className="text-sm text-muted-foreground">
          ยังไม่มีข้อความ
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedConversationId;
        const otherParticipant = getOtherParticipant(conversation, currentUserId);
        
        // Get display name for group or 1-on-1 conversation
        let displayName: string;
        if (conversation.isGroup) {
          // For groups, use name field if available, otherwise show participant names
          if (conversation.name) {
            displayName = conversation.name;
          } else {
            // Show participant names (excluding current user)
            const otherParticipants = conversation.participants
              .filter((p) => p.id !== currentUserId)
              .map((p) => p.name);
            
            if (otherParticipants.length > 0) {
              // Show up to 2 names, then add count if more
              if (otherParticipants.length <= 2) {
                displayName = otherParticipants.join(", ");
              } else {
                displayName = `${otherParticipants.slice(0, 2).join(", ")} +${otherParticipants.length - 2}`;
              }
            } else {
              // If no other participants (shouldn't happen), show group count
              displayName = `Group (${conversation.participants.length})`;
            }
          }
        } else {
          // For 1-on-1, show the other participant's name
          displayName = otherParticipant?.name || "Unknown";
        }

        return (
          <div
            key={conversation.id}
            onClick={() => !isBlurred && onConversationSelect?.(conversation)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
              "hover:bg-accent",
              isSelected && "bg-accent",
              isBlurred && "cursor-not-allowed opacity-50"
            )}
          >
            {/* Avatar */}
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant?.name || "user"}`}
                alt={displayName}
              />
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className={cn(
                    "text-sm font-semibold truncate",
                    isSelected && "text-primary"
                  )}
                >
                  {displayName}
                </span>
                {/* Show timestamp from lastMessage or updatedAt */}
                <span className="text-xs text-muted-foreground shrink-0">
                  {conversation.lastMessage
                    ? formatRelativeTime(conversation.lastMessage.createdAt)
                    : formatRelativeTime(conversation.updatedAt)}
                </span>
              </div>
              {conversation.lastMessage && (
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage.content}
                </p>
              )}
            </div>

            {/* Badge for unread count */}
            {conversation.unreadCount > 0 && (
              <Badge
                variant="default"
                className="shrink-0 h-6 min-w-6 flex items-center justify-center px-1.5"
              >
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </Badge>
            )}
          </div>
        );
      })}

      {/* Load more trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="h-4 flex items-center justify-center">
          {isLoadingMore && (
            <span className="text-xs text-muted-foreground">กำลังโหลด...</span>
          )}
        </div>
      )}
    </div>
  );
}

