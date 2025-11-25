"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { UserListItem } from "@/types/user";

interface ChatHeaderProps {
  user: UserListItem | null;
}

export function ChatHeader({ user }: ChatHeaderProps) {
  if (!user) {
    return (
      <div className="flex h-16 items-center justify-center border-b px-4">
        <span className="text-sm text-muted-foreground">
          เลือกผู้ใช้เพื่อเริ่มสนทนา
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center gap-3 border-b px-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.image} />
      </Avatar>
      <div className="flex flex-col">
        <span className="font-semibold">{user.name}</span>
        <span className="text-xs text-muted-foreground">ออนไลน์</span>
      </div>
    </div>
  );
}

