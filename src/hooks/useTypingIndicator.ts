"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

interface UseTypingIndicatorOptions {
  socket: Socket | null;
  conversationId: number | null;
  currentUserId?: number;
}

interface TypingUser {
  userId: number;
  isTyping: boolean;
}

/**
 * Custom hook for managing typing indicator
 * 
 * @example
 * ```tsx
 * const { typingUsers, setIsTyping } = useTypingIndicator({
 *   socket,
 *   conversationId: 5,
 *   currentUserId: 1,
 * });
 * 
 * // When user starts typing
 * setIsTyping(true);
 * 
 * // When user stops typing
 * setIsTyping(false);
 * ```
 */
export function useTypingIndicator(options: UseTypingIndicatorOptions) {
  const { socket, conversationId, currentUserId } = options;
  const [typingUsers, setTypingUsers] = useState<Map<number, boolean>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Listen for typing updates from other users
  useEffect(() => {
    if (!socket || !socket.connected || !conversationId) {
      return;
    }

    const handleTypingUpdate = (data: {
      conversationId: number;
      userId: number;
      isTyping: boolean;
    }) => {
      // Only handle typing updates for the current conversation
      if (data.conversationId !== conversationId) {
        return;
      }

      // Don't show typing indicator for current user
      if (data.userId === currentUserId) {
        return;
      }

      console.log("⌨️ Typing update:", data);

      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        if (data.isTyping) {
          newMap.set(data.userId, true);
        } else {
          newMap.delete(data.userId);
        }
        return newMap;
      });

      // Auto-clear typing indicator after 3 seconds if user stops typing
      if (data.isTyping) {
        const timeoutId = setTimeout(() => {
          setTypingUsers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(data.userId);
            return newMap;
          });
        }, 3000);

        return () => clearTimeout(timeoutId);
      }
    };

    socket.on("conversation:typing:update", handleTypingUpdate);

    return () => {
      socket.off("conversation:typing:update", handleTypingUpdate);
    };
  }, [socket, conversationId, currentUserId]);

  // Function to set typing status (with debounce)
  const setIsTyping = (isTyping: boolean) => {
    if (!socket || !socket.connected || !conversationId) {
      return;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // If starting to type, emit immediately
    if (isTyping && !isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("conversation:typing", {
        conversationId,
        isTyping: true,
      });
    }

    // If stopping typing, debounce for 1 second
    if (!isTyping && isTypingRef.current) {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socket.emit("conversation:typing", {
          conversationId,
          isTyping: false,
        });
      }, 1000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Send stop typing when component unmounts
      if (isTypingRef.current && socket?.connected && conversationId) {
        socket.emit("conversation:typing", {
          conversationId,
          isTyping: false,
        });
      }
    };
  }, [socket, conversationId]);

  // Get list of users who are currently typing
  const typingUserIds = Array.from(typingUsers.keys());

  return {
    typingUsers: typingUserIds,
    isTyping: typingUserIds.length > 0,
    setIsTyping,
  };
}

