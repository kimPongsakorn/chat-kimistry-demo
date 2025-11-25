"use client";

import { getConversations } from "@/app/actions";
import { Conversation, ConversationsResponse, PaginationMeta } from "@/types/user";
import { useEffect, useState, useCallback } from "react";

export function useConversations(limit = 20) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchConversations = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = (await getConversations(pageNum, limit)) as ConversationsResponse | null;

      if (!response || response.status !== "success") {
        throw new Error(response?.message || "Failed to fetch conversations");
      }

      const { data: conversationsData, meta: paginationMeta } = response.data;

      if (append) {
        setConversations((prev) => [...prev, ...conversationsData]);
      } else {
        setConversations(conversationsData);
      }

      setMeta(paginationMeta);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      if (!append) {
        setConversations([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [limit]);

  const loadMore = useCallback(() => {
    if (meta?.hasNextPage && !isLoadingMore && !isLoading) {
      fetchConversations(page + 1, true);
    }
  }, [meta, page, isLoadingMore, isLoading, fetchConversations]);

  const refresh = useCallback(() => {
    fetchConversations(1, false);
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations(1, false);
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage: meta?.hasNextPage ?? false,
    loadMore,
    refresh,
  };
}

