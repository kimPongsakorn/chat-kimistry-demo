"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Message } from "@/types/user";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isSent = message.isSent ?? false;
  const senderName = message.sender?.name || "Unknown";
  const senderImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`;

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isSent ? "justify-end" : "justify-start"
      )}
    >
      {!isSent && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={senderImage} alt={senderName} />
        </Avatar>
      )}
      <div
        className={cn(
          "flex max-w-[70%] flex-col gap-1 rounded-lg px-4 py-2",
          isSent
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {!isSent && (
          <span className="text-xs font-semibold">{senderName}</span>
        )}
        <p className="text-sm">{message.content}</p>
        {message.createdAt && (
          <span className="text-xs opacity-70">
            {new Date(message.createdAt).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {isSent && message.isReadByMe && (
          <span className="text-xs opacity-70">✓ อ่านแล้ว</span>
        )}
      </div>
      {isSent && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={senderImage} alt={senderName} />
        </Avatar>
      )}
    </div>
  );
}

