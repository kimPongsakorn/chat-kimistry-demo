"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { UserListItem } from "@/types/user";
import { useEffect, useRef } from "react";

interface UserListProps {
  users: UserListItem[];
  isBlurred?: boolean;
  selectedUserId?: number | null;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  onUserSelect?: (user: UserListItem) => void;
  onLoadMore?: () => void;
}

export function UserList({
  users,
  isBlurred = false,
  selectedUserId,
  isLoadingMore = false,
  hasNextPage = false,
  onUserSelect,
  onLoadMore,
}: UserListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll for horizontal list
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreTriggerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isLoadingMore, onLoadMore]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex snap-x snap-mandatory flex-nowrap gap-4 overflow-x-auto py-4 "
    >
      {users.map((userItem, index) => {
        const isSelected = userItem.id === selectedUserId;
        return (
          <div
            key={userItem.id || index}
            onClick={() => !isBlurred && onUserSelect?.(userItem)}
            className={cn(
              "snap-start flex shrink-0 w-[70px] flex-col items-center justify-center cursor-pointer transition-all",
              isSelected
                ? "scale-105"
                : "hover:scale-105 opacity-80 hover:opacity-100",
              isBlurred && "cursor-not-allowed"
            )}
          >
            <Avatar
              className={cn(
                "ring-2 transition-all",
                isSelected
                  ? "ring-primary ring-offset-2"
                  : "ring-transparent"
              )}
            >
              <AvatarImage src={userItem.image} />
            </Avatar>
            <Label
              className={cn(
                "mt-2 w-full text-center text-sm font-medium",
                isSelected && "font-semibold"
              )}
            >
              {userItem.name}
            </Label>
          </div>
        );
      })}

      {/* Load more trigger for horizontal scroll */}
      {hasNextPage && (
        <div ref={loadMoreTriggerRef} className="shrink-0 w-4 h-full flex items-center">
          {isLoadingMore && (
            <span className="text-xs text-muted-foreground">...</span>
          )}
        </div>
      )}
    </div>
  );
}

