"use client";

import { Conversation, UserListItem } from "@/types/user";
import { ConversationList } from "./ConversationList";
import { UserList } from "./UserList";

interface ChatPanelProps {
  users: UserListItem[];
  conversations: Conversation[];
  currentUserId?: number;
  isBlurred?: boolean;
  selectedUserId?: number | null;
  selectedConversationId?: number | null;
  isLoadingConversations?: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  isLoadingMoreFriends?: boolean;
  hasNextPageFriends?: boolean;
  isCreatingConversation?: boolean;
  onUserSelect?: (user: UserListItem) => void;
  onConversationSelect?: (conversation: Conversation) => void;
  onLoadMore?: () => void;
  onLoadMoreFriends?: () => void;
}

export function ChatPanel({
  users,
  conversations,
  currentUserId,
  isBlurred = false,
  selectedUserId,
  selectedConversationId,
  isLoadingConversations = false,
  isLoadingMore = false,
  hasNextPage = false,
  isLoadingMoreFriends = false,
  hasNextPageFriends = false,
  isCreatingConversation = false,
  onUserSelect,
  onConversationSelect,
  onLoadMore,
  onLoadMoreFriends,
}: ChatPanelProps) {
  return (
    <div
      className={`flex h-full flex-col ${
        isBlurred ? "blur-sm pointer-events-none" : ""
      }`}
    >
      {/* UserList - Top Section */}
      <div className="shrink-0 p-6 pb-4">
        <UserList
          users={users}
          isBlurred={isBlurred || isCreatingConversation}
          selectedUserId={selectedUserId}
          isLoadingMore={isLoadingMoreFriends}
          hasNextPage={hasNextPageFriends}
          onUserSelect={onUserSelect}
          onLoadMore={onLoadMoreFriends}
        />
        {isCreatingConversation && (
          <div className="mt-2 text-center">
            <span className="text-xs text-muted-foreground">กำลังสร้างห้องแชท...</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t mx-6" />

      {/* ConversationList - Bottom Section (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 pt-4">
        <ConversationList
          conversations={conversations}
          currentUserId={currentUserId}
          selectedConversationId={selectedConversationId}
          isLoading={isLoadingConversations}
          isLoadingMore={isLoadingMore}
          hasNextPage={hasNextPage}
          onConversationSelect={onConversationSelect}
          onLoadMore={onLoadMore}
          isBlurred={isBlurred}
        />
      </div>
    </div>
  );
}

