"use client";

import { ChatPanel } from "@/components/Chat/ChatPanel";
import { ContentPanel } from "@/components/Chat/ContentPanel";
import { HeaderPanel } from "@/components/Header/HeaderPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAuth } from "@/hooks/useAuth";
import { mockMessages, mockUsers } from "@/lib/mockData";

export default function Home() {
  const { user, isLoading } = useAuth();

  return (
    <div className="flex h-screen w-full items-center justify-center p-8">
      <ResizablePanelGroup
        direction="vertical"
        className="h-full w-full rounded-lg border"
      >
        {/* Header Panel */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <HeaderPanel user={user} isLoading={isLoading} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Bottom Section: Left and Right Panels */}
        <ResizablePanel defaultSize={80} minSize={60}>
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            {/* Left Panel: User List */}
            <ResizablePanel defaultSize={25} minSize={20}>
              <ChatPanel
                users={mockUsers}
                messages={mockMessages}
                isBlurred={!user}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel: Content */}
            <ResizablePanel defaultSize={75} minSize={50}>
              <ContentPanel isBlurred={!user} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
