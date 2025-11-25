"use client";

import { createConversation } from "@/actions/actions";
import { ChatPanel } from "@/components/Chat/ChatPanel";
import { ContentPanel } from "@/components/Chat/ContentPanel";
import { HeaderPanel } from "@/components/shared/Header/HeaderPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useFriends } from "@/hooks/useFriends";
import { Conversation, Friend, UserListItem } from "@/types/user";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const { user, isLoading, refresh: refreshAuth } = useAuth();
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
    refresh: refreshFriends,
  } = useFriends();
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<number | null>(null);

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

  const handleUserSelect = async (userItem: UserListItem) => {
    setSelectedUser(userItem);
    setSelectedConversation(null); // Clear conversation selection when selecting user

    // Find the friend
    const friend = friends.find((f) => f.id === userItem.id);
    
    // If the friend has a conversationId, find and select that conversation
    if (friend?.conversationId) {
      const conversation = conversations.find(
        (c) => c.id === friend.conversationId
      );
      if (conversation) {
        setSelectedConversation(conversation);
      }
    } else if (friend && user?.id) {
      // If conversationId is null, create a new conversation
      setIsCreatingConversation(true);
      try {
        const participantIds = [user.id, friend.id];
        const result = await createConversation(participantIds);
        
        if (result?.status === 'success' && result?.data) {
          const createdConversationId = result.data.id;
          setPendingConversationId(createdConversationId);
          
          // Refresh friends and conversations to get updated data
          await Promise.all([
            refreshFriends(),
            refreshConversations(),
          ]);
          
          toast.success("สร้างห้องแชทสำเร็จ");
        }
      } catch (error) {
        console.error("Failed to create conversation:", error);
        toast.error(
          error instanceof Error 
            ? error.message 
            : "เกิดข้อผิดพลาดในการสร้างห้องแชท"
        );
      } finally {
        setIsCreatingConversation(false);
      }
    }
  };

  // Watch for the newly created conversation to appear in the list
  useEffect(() => {
    if (pendingConversationId) {
      const newConversation = conversations.find(
        (c) => c.id === pendingConversationId
      );
      
      if (newConversation) {
        setSelectedConversation(newConversation);
        setPendingConversationId(null);
      }
    }
  }, [conversations, pendingConversationId]);

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

  const handleLoginSuccess = () => {
    // Refresh auth first, then refresh friends and conversations
    refreshAuth();
    // Wait a bit for cookies to be set, then refresh data
    setTimeout(() => {
      refreshFriends();
      refreshConversations();
    }, 100);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-8">
      <ResizablePanelGroup
        direction="vertical"
        className="h-full w-full rounded-lg border"
      >
        {/* Header Panel */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <HeaderPanel 
            user={user} 
            isLoading={isLoading} 
            onLoginSuccess={handleLoginSuccess}
            onLogoutSuccess={refreshAuth}
          />
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
                isCreatingConversation={isCreatingConversation}
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
