/**
 * ตัวอย่างการใช้งาน Socket.io Client
 * 
 * 1. ใช้ใน Component:
 * 
 * ```tsx
 * "use client";
 * 
 * import { useSocket } from "@/hooks/useSocket";
 * import { useEffect } from "react";
 * 
 * export function ChatComponent() {
 *   const { socket, isConnected, connect, disconnect } = useSocket({
 *     autoConnect: true, // เชื่อมต่ออัตโนมัติเมื่อ component mount
 *     onConnect: () => {
 *       console.log("Socket connected");
 *     },
 *     onDisconnect: () => {
 *       console.log("Socket disconnected");
 *     },
 *   });
 * 
 *   useEffect(() => {
 *     if (socket) {
 *       // ฟัง event 'message'
 *       socket.on("message", (data) => {
 *         console.log("Received message:", data);
 *       });
 * 
 *       // ฟัง event 'newMessage'
 *       socket.on("newMessage", (message) => {
 *         console.log("New message:", message);
 *       });
 * 
 *       // Cleanup: ลบ event listeners เมื่อ component unmount
 *       return () => {
 *         socket.off("message");
 *         socket.off("newMessage");
 *       };
 *     }
 *   }, [socket]);
 * 
 *   const sendMessage = () => {
 *     if (socket && isConnected) {
 *       socket.emit("sendMessage", {
 *         conversationId: 1,
 *         content: "Hello!",
 *       });
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
 *       <button onClick={sendMessage}>Send Message</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * 2. ใช้กับ Authentication Token:
 * 
 * ```tsx
 * import { useSocket } from "@/hooks/useSocket";
 * import { useAuth } from "@/hooks/useAuth";
 * 
 * export function AuthenticatedChat() {
 *   const { user } = useAuth();
 *   const { socket, isConnected } = useSocket({
 *     autoConnect: !!user, // เชื่อมต่อเมื่อมี user
 *   });
 * 
 *   // Note: ถ้าต้องการส่ง token ไปกับ socket connection
 *   // ต้องแก้ไข useSocket hook ให้รับ token และส่งไปยัง getSocket()
 * }
 * ```
 * 
 * 3. ใช้ getSocket โดยตรง (สำหรับ advanced use cases):
 * 
 * ```tsx
 * import { getSocket, disconnectSocket } from "@/lib/socket";
 * 
 * const socket = getSocket(undefined, accessToken);
 * socket.connect();
 * 
 * socket.on("connect", () => {
 *   console.log("Connected");
 * });
 * 
 * // เมื่อต้องการ disconnect
 * disconnectSocket();
 * ```
 */

