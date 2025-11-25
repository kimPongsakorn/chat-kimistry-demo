export interface User {
  id: number;
  email: string;
  name: string;
  createdAt?: string;
}

export interface UserListItem {
  name: string;
  image: string;
}

export interface Message {
  image: string;
  sender: string;
  message: string;
}

