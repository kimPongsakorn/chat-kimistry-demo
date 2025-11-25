"use client";

import { getFriends } from "@/app/actions";
import { Friend, FriendsResponse, PaginationMeta } from "@/types/user";
import { useEffect, useState, useCallback } from "react";

export function useFriends(limit = 20) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchFriends = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = (await getFriends(pageNum, limit)) as FriendsResponse | null;

      if (!response || response.status !== "success") {
        throw new Error(response?.message || "Failed to fetch friends");
      }

      const { data: friendsData, meta: paginationMeta } = response.data;

      if (append) {
        setFriends((prev) => [...prev, ...friendsData]);
      } else {
        setFriends(friendsData);
      }

      setMeta(paginationMeta);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      if (!append) {
        setFriends([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [limit]);

  const loadMore = useCallback(() => {
    if (meta?.hasNextPage && !isLoadingMore && !isLoading) {
      fetchFriends(page + 1, true);
    }
  }, [meta, page, isLoadingMore, isLoading, fetchFriends]);

  const refresh = useCallback(() => {
    fetchFriends(1, false);
  }, [fetchFriends]);

  useEffect(() => {
    fetchFriends(1, false);
  }, [fetchFriends]);

  return {
    friends,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage: meta?.hasNextPage ?? false,
    loadMore,
    refresh,
  };
}

