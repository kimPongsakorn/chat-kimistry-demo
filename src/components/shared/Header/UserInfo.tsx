"use client";

import { logout } from "@/actions/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user";
import { useState } from "react";
import { toast } from "sonner";

interface UserInfoProps {
  user: User;
  onLogoutSuccess?: () => void;
}

export function UserInfo({ user, onLogoutSuccess }: UserInfoProps) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    try {
      const result = await logout();
      if (result?.success) {
        toast.success("ออกจากระบบสำเร็จ");
        setIsOpen(false);
        onLogoutSuccess?.();
      }
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
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
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 rounded-full px-6 transition-all hover:shadow-sm"
          >
            Logout
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการออกจากระบบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ? คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อใช้งาน
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ออกจากระบบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
