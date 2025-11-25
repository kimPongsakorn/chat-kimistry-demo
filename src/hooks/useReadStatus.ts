"use client";

import { useEffect } from "react";
import { Socket } from "socket.io-client";

interface UseReadStatusOptions {
  socket: Socket | null;
  conversationId: number | null;
  currentUserId?: number;
  onReadUpdate?: (data: {
    userId: number;
    conversationId: number;
    lastReadMessageId: number;
    lastReadAt: string;
  }) => void;
}

/**
 * Custom hook for managing read status
 * 
 * @example
 * ```tsx
 * const { markAsRead } = useReadStatus({
 *   socket,
 *   conversationId: 5,
 *   currentUserId: 1,
 *   onReadUpdate: (data) => {
 *     console.log('Read update:', data);
 *   },
 * });
 * 
 * // Mark conversation as read
 * markAsRead();
 * ```
 */
export function useReadStatus(options: UseReadStatusOptions) {
  const { socket, conversationId, currentUserId, onReadUpdate } = options;

  // Listen for read status updates from other users
  useEffect(() => {
    if (!socket || !socket.connected || !conversationId) {
      return;
    }

    const handleReadUpdate = (data: {
      userId: number;
      conversationId: number;
      lastReadMessageId: number;
      lastReadAt: string;
    }) => {
      // Only handle read updates for the current conversation
      if (data.conversationId !== conversationId) {
        return;
      }

      // Don't process read updates from current user (we already know)
      if (data.userId === currentUserId) {
        return;
      }

      console.log("📖 Read status update:", data);
      onReadUpdate?.(data);
    };

    socket.on("conversation:read:update", handleReadUpdate);

    return () => {
      socket.off("conversation:read:update", handleReadUpdate);
    };
  }, [socket, conversationId, currentUserId, onReadUpdate]);

  // Function to mark conversation as read
  const markAsRead = () => {
    if (!socket || !socket.connected || !conversationId) {
      return;
    }

    socket.emit("conversation:read", {
      conversationId,
    });
  };

  return {
    markAsRead,
  };
}

