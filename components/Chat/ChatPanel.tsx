"use client";

import { UserListItem, Message } from "@/types/user";
import { UserList } from "./UserList";
import { MessageList } from "./MessageList";

interface ChatPanelProps {
  users: UserListItem[];
  messages: Message[];
  isBlurred?: boolean;
}

export function ChatPanel({
  users,
  messages,
  isBlurred = false,
}: ChatPanelProps) {
  return (
    <div
      className={`flex h-full flex-col overflow-y-auto p-6 ${
        isBlurred ? "blur-sm pointer-events-none" : ""
      }`}
    >
      <UserList users={users} />
      <MessageList messages={messages} />
    </div>
  );
}

