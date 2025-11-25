"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  socket?: Socket | null;
  conversationId?: number | null;
  currentUserId?: number;
}

export function MessageInput({ 
  onSend, 
  disabled = false,
  socket,
  conversationId,
  currentUserId,
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  // Use typing indicator hook
  const { setIsTyping } = useTypingIndicator({
    socket: socket || null,
    conversationId: conversationId || null,
    currentUserId,
  });

  // Handle typing indicator
  useEffect(() => {
    if (message.trim().length > 0) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [message, setIsTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      setIsTyping(false); // Stop typing when sending
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t p-4"
    >
      <Input
        type="text"
        placeholder="พิมพ์ข้อความ..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
        className="rounded-full"
      />
      <Button
        type="submit"
        disabled={disabled || !message.trim()}
        size="icon"
        className="rounded-full"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

