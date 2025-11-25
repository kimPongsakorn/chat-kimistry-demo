"use client";

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

interface UseConversationSocketOptions {
  socket: Socket | null;
  conversationId: number | null;
  onJoinSuccess?: (data: any) => void;
  onLeaveSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Custom hook for managing conversation room join/leave
 * 
 * @example
 * ```tsx
 * const { isJoined } = useConversationSocket({
 *   socket,
 *   conversationId: 5,
 *   onJoinSuccess: (data) => console.log('Joined:', data),
 *   onLeaveSuccess: (data) => console.log('Left:', data),
 * });
 * ```
 */
export function useConversationSocket(options: UseConversationSocketOptions) {
  const { socket, conversationId, onJoinSuccess, onLeaveSuccess, onError } = options;
  const currentConversationIdRef = useRef<number | null>(null);
  const isJoinedRef = useRef(false);

  useEffect(() => {
    if (!socket || !socket.connected) {
      return;
    }

    // If conversationId changed, leave old room first
    if (currentConversationIdRef.current !== null && 
        currentConversationIdRef.current !== conversationId) {
      // Leave previous conversation
      socket.emit("conversation:leave", {
        conversationId: currentConversationIdRef.current,
      });
      isJoinedRef.current = false;
    }

    // If no conversation selected, don't join
    if (!conversationId) {
      currentConversationIdRef.current = null;
      isJoinedRef.current = false;
      return;
    }

    // If already joined this conversation, don't join again
    if (currentConversationIdRef.current === conversationId && isJoinedRef.current) {
      return;
    }

    // Join new conversation
    currentConversationIdRef.current = conversationId;
    socket.emit("conversation:join", {
      conversationId,
    });

    // Setup event listeners for join/leave responses
    const handleJoinSuccess = (data: any) => {
      // Only handle if it's for the current conversation
      if (data?.data?.conversationId === conversationId) {
        console.log("✅ Joined conversation:", data);
        isJoinedRef.current = true;
        onJoinSuccess?.(data);
      }
    };

    const handleLeaveSuccess = (data: any) => {
      // Only handle if it's for the current conversation
      if (data?.data?.conversationId === conversationId) {
        console.log("✅ Left conversation:", data);
        isJoinedRef.current = false;
        onLeaveSuccess?.(data);
      }
    };

    const handleError = (error: any) => {
      // Check if error is related to conversation join/leave
      if (error?.error?.code === "JOIN_CONVERSATION_ERROR" || 
          error?.error?.code === "LEAVE_CONVERSATION_ERROR") {
        console.error("❌ Conversation error:", error);
        onError?.(error);
      }
    };

    socket.on("conversation:join:ok", handleJoinSuccess);
    socket.on("conversation:leave:ok", handleLeaveSuccess);
    socket.on("error", handleError);

    // Cleanup on unmount or when conversationId changes
    return () => {
      socket.off("conversation:join:ok", handleJoinSuccess);
      socket.off("conversation:leave:ok", handleLeaveSuccess);
      socket.off("error", handleError);

      // Leave conversation when component unmounts or conversation changes
      if (currentConversationIdRef.current !== null && socket.connected) {
        socket.emit("conversation:leave", {
          conversationId: currentConversationIdRef.current,
        });
        isJoinedRef.current = false;
      }
    };
  }, [socket, conversationId, onJoinSuccess, onLeaveSuccess, onError]);

  return {
    isJoined: isJoinedRef.current,
  };
}

