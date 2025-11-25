import { Message, UserListItem } from "@/types/user";

export const mockUsers: UserListItem[] = [
  {
    id: 1,
    name: "John Doe",
    image: "https://github.com/shadcn.png",
  },
  {
    id: 2,
    name: "Jane Doe",
    image: "https://github.com/shadcn.png",
  },
  {
    id: 3,
    name: "Jim Doe",
    image: "https://github.com/shadcn.png",
  },
  {
    id: 4,
    name: "Jill Doe",
    image: "https://github.com/shadcn.png",
  },
  {
    id: 5,
    name: "Jack Doe",
    image: "https://github.com/shadcn.png",
  },
];

// Mock messages - สำหรับ demo เท่านั้น
// ใน production จะดึงจาก API
export const mockMessages: Message[] = [
  {
    id: 1,
    content: "Hello, how are you?",
    createdAt: new Date().toISOString(),
    sender: {
      id: 1,
      email: "john@example.com",
      name: "John Doe",
    },
    readBy: [],
    isReadByMe: false,
    isSent: false,
  },
  {
    id: 2,
    content: "I'm fine, thank you!",
    createdAt: new Date().toISOString(),
    sender: {
      id: 0, // current user
      email: "me@example.com",
      name: "You",
    },
    readBy: [],
    isReadByMe: true,
    isSent: true,
  },
  {
    id: 3,
    content: "What are you doing?",
    createdAt: new Date().toISOString(),
    sender: {
      id: 2,
      email: "jane@example.com",
      name: "Jane Doe",
    },
    readBy: [],
    isReadByMe: false,
    isSent: false,
  },
  {
    id: 4,
    content: "I'm doing nothing, you?",
    createdAt: new Date().toISOString(),
    sender: {
      id: 0, // current user
      email: "me@example.com",
      name: "You",
    },
    readBy: [],
    isReadByMe: true,
    isSent: true,
  },
];

