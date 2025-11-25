"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useState } from "react";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
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

