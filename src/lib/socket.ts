"use client";

import { getBaseApiUrl } from "@/lib/api";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Get or create socket instance
 * @param serverUrl - Socket server URL (optional, will use BASE_API from env if not provided)
 * @param accessToken - Access token for authentication (optional)
 * @returns Socket instance
 */
export function getSocket(serverUrl?: string, accessToken?: string): Socket {
  // If socket exists, is connected, and token hasn't changed, return it
  // If token changed, we need to recreate the connection
  const currentToken = (socket?.auth as any)?.token;
  if (socket?.connected && currentToken === accessToken) {
    return socket;
  }

  // Get server URL from environment or use provided URL
  let url: string;
  try {
    url = serverUrl || getBaseApiUrl();
  } catch {
    url = serverUrl || process.env.NEXT_PUBLIC_SOCKET_URL || "";
  }

  if (!url) {
    throw new Error("Socket server URL is required. Set NEXT_PUBLIC_SOCKET_URL or NEXT_PUBLIC_BASE_API in .env.local");
  }

  // If socket exists but token changed, disconnect and recreate
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // Create socket with auth token if provided
  const socketOptions: any = {
    transports: ["websocket", "polling"], // Try websocket first, fallback to polling
    autoConnect: false, // Don't connect automatically, wait for explicit connect()
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    // Suppress WebSocket connection warnings (these are normal - socket.io will fallback to polling)
    upgrade: true, // Allow upgrade from polling to websocket
    rememberUpgrade: false, // Don't remember failed websocket attempts
  };

  // Add auth token if provided
  if (accessToken) {
    socketOptions.auth = {
      token: accessToken,
    };
    socketOptions.extraHeaders = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  socket = io(url, socketOptions);

  return socket;
}

/**
 * Disconnect and cleanup socket instance
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

