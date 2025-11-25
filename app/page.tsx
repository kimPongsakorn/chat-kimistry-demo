"use client";

import { ChatPanel } from "@/components/Chat/ChatPanel";
import { ContentPanel } from "@/components/Chat/ContentPanel";
import { HeaderPanel } from "@/components/Header/HeaderPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useFriends } from "@/hooks/useFriends";
import { Conversation, Friend, UserListItem } from "@/types/user";
import { useMemo, useState } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const {
    conversations,
    isLoading: isLoadingConversations,
    isLoadingMore,
    hasNextPage,
    loadMore,
    refresh: refreshConversations,
  } = useConversations();
  const {
    friends,
    isLoading: isLoadingFriends,
    isLoadingMore: isLoadingMoreFriends,
    hasNextPage: hasNextPageFriends,
    loadMore: loadMoreFriends,
  } = useFriends();
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  // Calculate conversationId from selected user or conversation
  const conversationId = useMemo(() => {
    if (selectedConversation) {
      return selectedConversation.id;
    }
    if (selectedUser) {
      const friend = friends.find((f) => f.id === selectedUser.id);
      return friend?.conversationId || null;
    }
    return null;
  }, [selectedUser, selectedConversation, friends]);

  // Convert friends to UserListItem format
  const friendsAsUserList = useMemo<UserListItem[]>(() => {
    return friends.map((friend: Friend) => ({
      id: friend.id,
      name: friend.name,
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`,
    }));
  }, [friends]);

  const handleUserSelect = (userItem: UserListItem) => {
    setSelectedUser(userItem);
    setSelectedConversation(null); // Clear conversation selection when selecting user

    // If the selected friend has a conversationId, find and select that conversation
    const friend = friends.find((f) => f.id === userItem.id);
    if (friend?.conversationId) {
      const conversation = conversations.find(
        (c) => c.id === friend.conversationId
      );
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSelectedUser(null); // Clear user selection when selecting conversation

    // Convert conversation to UserListItem for ContentPanel
    if (conversation.isGroup) {
      // For group conversations, create a UserListItem with group name
      setSelectedUser({
        id: conversation.id,
        name: `Group (${conversation.participants.length})`,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=group-${conversation.id}`,
      });
    } else if (conversation.participants.length > 0) {
      // For 1-on-1 conversations, use the other participant
      const otherParticipant = conversation.participants.find(
        (p) => p.id !== user?.id
      ) || conversation.participants[0];

      setSelectedUser({
        id: otherParticipant.id,
        name: otherParticipant.name,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant.name}`,
      });
    }
  };

  const handleMessageSent = () => {
    // TODO: Fetch new messages from API
    // For now, just refresh the messages
    // In production, this would call an API to get updated messages
    // Also refresh conversations to update lastMessage
    refreshConversations();
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-8">
      <ResizablePanelGroup
        direction="vertical"
        className="h-full w-full rounded-lg border"
      >
        {/* Header Panel */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <HeaderPanel user={user} isLoading={isLoading} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Bottom Section: Left and Right Panels */}
        <ResizablePanel defaultSize={80} minSize={60}>
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            {/* Left Panel: User List */}
            <ResizablePanel defaultSize={25} minSize={20}>
              <ChatPanel
                users={friendsAsUserList}
                conversations={conversations}
                currentUserId={user?.id}
                isBlurred={!user}
                selectedUserId={selectedUser?.id}
                selectedConversationId={selectedConversation?.id}
                isLoadingConversations={isLoadingConversations}
                isLoadingMore={isLoadingMore}
                hasNextPage={hasNextPage}
                isLoadingMoreFriends={isLoadingMoreFriends}
                hasNextPageFriends={hasNextPageFriends}
                onUserSelect={handleUserSelect}
                onConversationSelect={handleConversationSelect}
                onLoadMore={loadMore}
                onLoadMoreFriends={loadMoreFriends}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel: Content */}
            <ResizablePanel defaultSize={75} minSize={50}>
              <ContentPanel
                isBlurred={!user}
                selectedUser={selectedUser}
                currentUserId={user?.id}
                conversationId={conversationId}
                onMessageSent={handleMessageSent}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
