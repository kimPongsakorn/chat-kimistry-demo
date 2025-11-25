"use client";

import { logout } from "@/actions/actions";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user";

interface UserInfoProps {
  user: User;
}

export function UserInfo({ user }: UserInfoProps) {
  async function handleLogout() {
    await logout();
  }

  return (
    <>
      <div className="flex flex-col gap-2 rounded-lg bg-muted/60 border border-border/50 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground min-w-[40px]">
            Id:
          </span>
          <span className="text-sm font-semibold text-foreground">
            {user.id}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground min-w-[40px]">
            Name:
          </span>
          <span className="text-sm font-semibold text-foreground">
            {user.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground min-w-[40px]">
            Email:
          </span>
          <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">
            {user.email}
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={handleLogout}
        className="bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 rounded-full px-6 transition-all hover:shadow-sm"
      >
        Logout
      </Button>
    </>
  );
}
