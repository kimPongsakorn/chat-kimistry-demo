"use client";

import { getMessages } from "@/actions/actions";
import { Message, MessagesResponse } from "@/types/user";
import { useCallback, useEffect, useRef, useState } from "react";

export function useMessages(conversationId: number | null, currentUserId?: number, limit = 20) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const previousConversationIdRef = useRef<number | null>(null);

  const fetchMessages = useCallback(
    async (convId: number | null, cursor: number | null = null, append = false) => {
      if (!convId) {
        setMessages([]);
        setNextCursor(null);
        setIsLoading(false);
        return;
      }

      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const response = (await (getMessages as (convId: number, limit: number, cursor?: number | null) => Promise<MessagesResponse | null>)(convId, limit, cursor)) as MessagesResponse | null;

        if (!response || response.status !== "success") {
          throw new Error(response?.message || "Failed to fetch messages");
        }

        const { items: messagesData, nextCursor: newNextCursor } = response.data;

        // Add isSent field based on sender.id === currentUserId
        const messagesWithIsSent = messagesData.map((msg) => ({
          ...msg,
          isSent: msg.sender.id === currentUserId,
        }));

        if (append) {
          // When loading older messages, prepend them (oldest first)
          setMessages((prev) => [...messagesWithIsSent, ...prev]);
        } else {
          // When loading initial messages, set them directly (newest first from API)
          // Reverse to show newest at bottom
          setMessages(messagesWithIsSent.reverse());
        }

        setNextCursor(newNextCursor);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        if (!append) {
          setMessages([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [limit, currentUserId]
  );

  const loadMore = useCallback(() => {
    if (nextCursor && conversationId && !isLoadingMore && !isLoading) {
      fetchMessages(conversationId, nextCursor, true);
    }
  }, [nextCursor, conversationId, isLoadingMore, isLoading, fetchMessages]);

  const refresh = useCallback(() => {
    if (conversationId) {
      fetchMessages(conversationId, null, false);
    }
  }, [conversationId, fetchMessages]);

  // Auto-load messages when conversationId changes
  useEffect(() => {
    // If conversationId changed, clear messages and fetch new ones
    if (conversationId !== previousConversationIdRef.current) {
      if (conversationId) {
        // Clear messages immediately when switching conversations
        setMessages([]);
        setNextCursor(null);
        fetchMessages(conversationId, null, false);
      } else {
        // Clear messages when conversationId is null
        setMessages([]);
        setNextCursor(null);
      }
      previousConversationIdRef.current = conversationId;
    }
  }, [conversationId, fetchMessages]);

  return {
    messages,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage: nextCursor !== null,
    loadMore,
    refresh,
  };
}

