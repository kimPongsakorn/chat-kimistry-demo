"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { UserListItem } from "@/types/user";

interface UserListProps {
  users: UserListItem[];
  isBlurred?: boolean;
}

export function UserList({ users, isBlurred = false }: UserListProps) {
  return (
    <div className="flex snap-x snap-mandatory flex-nowrap gap-4 overflow-x-auto pb-8 pt-4">
      {users.map((userItem, index) => (
        <div
          key={index}
          className="snap-start flex shrink-0 w-[100px] flex-col items-center justify-center"
        >
          <Avatar>
            <AvatarImage src={userItem.image} />
          </Avatar>
          <Label className="mt-2 w-full text-center text-sm font-medium">
            {userItem.name}
          </Label>
        </div>
      ))}
    </div>
  );
}

