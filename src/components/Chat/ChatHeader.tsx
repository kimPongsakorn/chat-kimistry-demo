"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSocket } from "@/hooks/useSocket";
import { UserListItem } from "@/types/user";
import { useEffect, useState } from "react";

interface ChatHeaderProps {
  user: UserListItem | null;
}

type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface ChatHeaderProps {
  user: UserListItem | null;
  socket?: any; // Socket instance from parent (optional, will use useSocket if not provided)
  isSocketConnected?: boolean; // Socket connection status from parent
}

export function ChatHeader({ user, socket: providedSocket, isSocketConnected: providedIsConnected }: ChatHeaderProps) {
  // Use provided socket or create new one (fallback)
  const { socket: fallbackSocket, isConnected: fallbackIsConnected } = useSocket({
    autoConnect: false, // Don't auto connect here, use provided socket or connect at page level
  });
  
  const socket = providedSocket || fallbackSocket;
  const isConnected = providedIsConnected ?? fallbackIsConnected;
  
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("disconnected");
  const [isConnecting, setIsConnecting] = useState(false);

  // Get online status for the selected user
  const { isUserOnline } = useOnlineStatus({ socket });
  const isSelectedUserOnline = user ? isUserOnline(user.id) : false;

  // Debug: log when component renders
  console.log("🟢 [ChatHeader] Rendered with user:", user?.name || "undefined", "Socket exists:", !!socket, "Is Connected:", isConnected);

  useEffect(() => {
    if (!socket || !user) {
      setSocketStatus("disconnected");
      setIsConnecting(false);
      return;
    }

    // ตรวจสอบสถานะเริ่มต้น
    if (socket.connected) {
      setSocketStatus("connected");
      setIsConnecting(false);
    } else {
      // ถ้ายังไม่ connected แสดงว่า connecting (ถ้ายังไม่เคยมี error)
      if (socketStatus !== "error") {
        setSocketStatus("connecting");
        setIsConnecting(true);
      }
    }

    const handleConnect = () => {
      setSocketStatus("connected");
      setIsConnecting(false);
    };

    const handleDisconnect = () => {
      setSocketStatus("disconnected");
      setIsConnecting(false);
    };

    const handleConnectError = () => {
      setSocketStatus("error");
      setIsConnecting(false);
    };

    // ฟัง event เมื่อเริ่มเชื่อมต่อ
    const handleReconnectAttempt = () => {
      setSocketStatus("connecting");
      setIsConnecting(true);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("reconnect_attempt", handleReconnectAttempt);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("reconnect_attempt", handleReconnectAttempt);
    };
  }, [socket, isConnected, user, socketStatus]);

  if (!user) {
    // แสดงสถานะ socket แม้ไม่มี user
    const getStatusIndicatorForNoUser = () => {
      const baseClasses = "h-4 w-4 rounded-full border-2 border-white shadow-md flex-shrink-0";
      if (socket?.connected) {
        return <div className={`${baseClasses} bg-green-500`} title="Socket เชื่อมต่อแล้ว" />;
      } else if (socket) {
        return <div className={`${baseClasses} bg-gray-400`} title="Socket ออฟไลน์" />;
      }
      return null;
    };

    return (
      <div className="flex h-16 items-center justify-center gap-2 border-b px-4">
        <span className="text-sm text-muted-foreground">
          เลือกผู้ใช้เพื่อเริ่มสนทนา
        </span>
        {getStatusIndicatorForNoUser()}
      </div>
    );
  }

  // กำหนดสีและ animation ตามสถานะ
  const getStatusIndicator = () => {
    // Debug: log status to console with emoji for visibility
    console.log("🔵 [ChatHeader] Socket Status:", socketStatus, "Socket exists:", !!socket, "Is Connected:", socket?.connected);
    
    // ทำให้วงกลมใหญ่ขึ้นและเห็นชัดเจน (h-4 w-4 = 16px)
    const baseClasses = "h-4 w-4 rounded-full border-2 border-white shadow-md flex-shrink-0";
    
    switch (socketStatus) {
      case "connecting":
        return (
          <div 
            className={`${baseClasses} bg-orange-500 animate-pulse`}
            title="กำลังเชื่อมต่อ"
            aria-label="กำลังเชื่อมต่อ"
          />
        );
      case "connected":
        return (
          <div 
            className={`${baseClasses} bg-green-500`}
            title="เชื่อมต่อแล้ว"
            aria-label="เชื่อมต่อแล้ว"
          />
        );
      case "error":
        return (
          <div 
            className={`${baseClasses} bg-red-500 animate-pulse-fast`}
            title="ไม่สามารถเชื่อมต่อได้"
            aria-label="ไม่สามารถเชื่อมต่อได้"
          />
        );
      case "disconnected":
      default:
        return (
          <div 
            className={`${baseClasses} bg-gray-400`}
            title="ออฟไลน์"
            aria-label="ออฟไลน์"
          />
        );
    }
  };

  return (
    <div className="flex h-16 items-center gap-3 border-b px-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.image} />
      </Avatar>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{user.name}</span>
          {/* Always show indicator for debugging */}
          <div className="flex items-center">
            {getStatusIndicator()}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {socketStatus === "connected" && isSelectedUserOnline
            ? "ออนไลน์"
            : socketStatus === "connected" && !isSelectedUserOnline
            ? "ออฟไลน์"
            : socketStatus === "connecting"
            ? "กำลังเชื่อมต่อ..."
            : socketStatus === "error"
            ? "ไม่สามารถเชื่อมต่อได้"
            : "ออฟไลน์"}
        </span>
      </div>
    </div>
  );
}

