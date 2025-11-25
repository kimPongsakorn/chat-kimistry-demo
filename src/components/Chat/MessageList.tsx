"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Message } from "@/types/user";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex snap-y snap-mandatory flex-col gap-4 overflow-y-auto pb-4 pt-8">
      {messages.map((msg, index) => (
        <div key={index} className="flex items-center justify-start gap-2">
          <div>
            <Avatar>
              <AvatarImage src={msg.image} />
            </Avatar>
          </div>
          <div className="flex flex-col items-start justify-start">
            <Label className="text-sm font-medium">{msg.sender}</Label>
            <Label className="text-sm font-medium">{msg.message}</Label>
          </div>
        </div>
      ))}
    </div>
  );
}

