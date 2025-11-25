export interface User {
  id: number;
  email: string;
  name: string;
  createdAt?: string;
}

export interface UserListItem {
  id?: number;
  name: string;
  image: string;
}

export interface Message {
  id: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    email: string;
    name: string;
  };
  readBy: Array<{
    userId: number;
    readAt: string;
  }>;
  isReadByMe: boolean;
  // Computed fields
  isSent?: boolean; // Computed from sender.id === currentUserId
}

export interface Participant {
  id: number;
  email: string;
  name: string;
}

export interface LastMessage {
  id: number;
  content: string;
  sender: {
    id: number;
    email: string;
    name: string;
  };
  createdAt: string;
}

export interface Conversation {
  id: number;
  isGroup: boolean;
  name?: string; // Optional name for group conversations
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  totalMessages: number;
  unreadCount: number;
  lastMessage: LastMessage | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ConversationsResponse {
  status: string;
  message: string;
  data: {
    data: Conversation[];
    meta: PaginationMeta;
  };
}

export interface Friend {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  conversationId: number | null;
}

export interface FriendsResponse {
  status: string;
  message: string;
  data: {
    data: Friend[];
    meta: PaginationMeta;
  };
}

export interface MessagesResponse {
  status: string;
  message: string;
  data: {
    items: Message[];
    nextCursor: number | null;
  };
}

