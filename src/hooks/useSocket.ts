"use client";

import { getAccessToken, refreshToken } from "@/actions/actions";
import { getSocket } from "@/lib/socket";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

interface UseSocketOptions {
  serverUrl?: string;
  autoConnect?: boolean;
  accessToken?: string; // Optional: pass token directly, otherwise will fetch from server
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onConnectionSuccess?: (data: any) => void; // Callback for connection:success event
}

/**
 * Custom hook for managing socket.io connection
 * 
 * @example
 * ```tsx
 * const { socket, isConnected, connect, disconnect } = useSocket({
 *   autoConnect: true,
 *   onConnect: () => console.log('Connected'),
 *   onDisconnect: () => console.log('Disconnected'),
 * });
 * 
 * useEffect(() => {
 *   if (socket) {
 *     socket.on('message', (data) => {
 *       console.log('Received:', data);
 *     });
 *     
 *     return () => {
 *       socket.off('message');
 *     };
 *   }
 * }, [socket]);
 * ```
 */
export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = false, onConnect, onDisconnect, onError, onConnectionSuccess, serverUrl, accessToken: providedToken } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(providedToken || null);
  const socketRef = useRef<Socket | null>(null);
  const eventListenersRef = useRef<{ cleanup: () => void } | null>(null);

  // Helper function to setup event listeners
  const setupEventListeners = (socket: Socket) => {
    // Cleanup old listeners if they exist
    if (eventListenersRef.current) {
      eventListenersRef.current.cleanup();
    }

    const handleConnect = () => {
      setIsConnected(true);
      onConnect?.();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      onDisconnect?.();
    };

    const handleConnectError = async (error: any) => {
      console.error("Socket connection error:", error);
      
      // Check if error is due to authentication (401 or unauthorized)
      const isAuthError = error?.data?.status === 401 || 
                         error?.message?.includes("unauthorized") ||
                         error?.message?.includes("401");
      
      if (isAuthError) {
        try {
          console.log("Token expired, attempting to refresh...");
          // Try to refresh token
          await refreshToken();
          
          // Get new token and reconnect
          const newToken = await getAccessToken();
          if (newToken) {
            // Disconnect old socket
            socket.disconnect();
            
            // Create new socket with new token
            const newSocket = getSocket(serverUrl, newToken);
            socketRef.current = newSocket;
            
            // Setup event listeners for new socket
            setupEventListeners(newSocket);
            
            // Reconnect with new token
            if (autoConnect) {
              newSocket.connect();
            }
            
            // Update access token state
            setAccessToken(newToken);
          } else {
            // No token available, user needs to login again
            onError?.(new Error("Authentication failed. Please login again."));
          }
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
          onError?.(refreshError instanceof Error ? refreshError : new Error("Failed to refresh token"));
        }
      } else {
        // Not an auth error, just pass it through
        onError?.(error);
      }
    };

    const handleConnectionSuccess = (data: any) => {
      console.log("✅ Connection success:", data);
      onConnectionSuccess?.(data);
    };

    const handleError = (error: any) => {
      console.error("Socket error event:", error);
      // error format: { success: false, error: { code, type, message, timestamp } }
      const errorMessage = error?.error?.message || error?.message || "Unknown socket error";
      onError?.(new Error(errorMessage));
    };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      socket.on("connection:success", handleConnectionSuccess);
      socket.on("error", handleError);
      
      // Suppress WebSocket upgrade warnings (these are normal)
      socket.on("upgrade", () => {
        console.log("✅ Socket upgraded to WebSocket");
      });
      
      socket.on("upgradeError", (error) => {
        // This is normal - socket.io will fallback to polling
        console.log("ℹ️ WebSocket upgrade failed, using polling:", error.message);
      });

    // Store cleanup function
    eventListenersRef.current = {
      cleanup: () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("connect_error", handleConnectError);
        socket.off("connection:success", handleConnectionSuccess);
        socket.off("error", handleError);
      },
    };
  };

  // Fetch access token from server if not provided
  useEffect(() => {
    if (!providedToken) {
      getAccessToken().then((token) => {
        setAccessToken(token);
      }).catch((error) => {
        console.error("Failed to get access token:", error);
      });
    }
  }, [providedToken]);

  // Initialize socket
  useEffect(() => {
    // Wait for access token if autoConnect is enabled
    if (autoConnect && !providedToken && accessToken === null) {
      return;
    }

    try {
      const token = providedToken || accessToken || undefined;
      const socket = getSocket(serverUrl, token);
      socketRef.current = socket;

      // Setup event listeners
      setupEventListeners(socket);

      // Auto connect if enabled
      if (autoConnect && !socket.connected) {
        socket.connect();
      }

      return () => {
        // Cleanup: remove event listeners but don't disconnect
        // (socket instance is shared, so we only disconnect on unmount if needed)
        if (eventListenersRef.current) {
          eventListenersRef.current.cleanup();
          eventListenersRef.current = null;
        }
      };
    } catch (error) {
      console.error("Failed to initialize socket:", error);
      onError?.(error instanceof Error ? error : new Error("Failed to initialize socket"));
    }
  }, [autoConnect, onConnect, onDisconnect, onError, serverUrl, providedToken, accessToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only disconnect if this is the last component using the socket
      // In most cases, you might want to keep the connection alive
      // Uncomment the line below if you want to disconnect on unmount
      // disconnectSocket();
    };
  }, []);

  const connect = () => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
  };
}

