"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

interface UseOnlineStatusOptions {
  socket: Socket | null;
}

/**
 * Custom hook for managing user online/offline status
 * 
 * @example
 * ```tsx
 * const { isUserOnline } = useOnlineStatus({ socket });
 * 
 * // Check if user is online
 * const isOnline = isUserOnline(userId);
 * ```
 */
export function useOnlineStatus(options: UseOnlineStatusOptions) {
  const { socket } = options;
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!socket || !socket.connected) {
      return;
    }

    const handleUserOnline = (data: { userId: number }) => {
      console.log("🟢 User online:", data.userId);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(data.userId);
        return newSet;
      });
    };

    const handleUserOffline = (data: { userId: number }) => {
      console.log("🔴 User offline:", data.userId);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);

    return () => {
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
    };
  }, [socket]);

  const isUserOnline = (userId: number | undefined): boolean => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  };

  return {
    isUserOnline,
    onlineUsers: Array.from(onlineUsers),
  };
}

