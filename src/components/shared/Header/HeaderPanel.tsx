"use client";

import { User } from "@/types/user";
import { LoginForm } from "./LoginForm";
import { UserInfo } from "./UserInfo";

interface HeaderPanelProps {
  user: User | null;
  isLoading: boolean;
  onLoginSuccess?: () => void;
}

export function HeaderPanel({ user, isLoading, onLoginSuccess }: HeaderPanelProps) {
  return (
    <div className="flex h-full items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3 gap-6">
      {/* Left Half: Input Fields + Login Button */}
      {!user && <LoginForm onLoginSuccess={onLoginSuccess} />}

      {/* Divider */}
      {user && <div className="h-12 w-px bg-border/60" />}

      {/* Right Half: User Info + Logout Button */}
      <div className="flex flex-1 items-center justify-end gap-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
        ) : user ? (
          <UserInfo user={user} />
        ) : (
          <div className="text-sm text-muted-foreground">
            ยังไม่ได้เข้าสู่ระบบ
          </div>
        )}
      </div>
    </div>
  );
}

