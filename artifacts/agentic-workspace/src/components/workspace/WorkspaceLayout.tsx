"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorkspace } from "@/stores/workspace";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ModelSelector } from "@/components/providers/ModelSelector";
import { ProviderManager } from "@/components/providers/ProviderManager";
import { WebSearchManager } from "@/components/web-search/WebSearchManager";
import { ResearchPanel } from "@/components/research/ResearchPanel";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Sidebar } from "@/components/workspace/Sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import {
  MessageSquare,
  Search,
  Globe,
  Settings,
  Zap,
} from "lucide-react";

export function WorkspaceLayout() {
  const { dispatch } = useWorkspace();
  const [activeTab, setActiveTab] = useState("chat");
  const [addProviderOpen, setAddProviderOpen] = useState(false);
  const isMobile = useIsMobile();

  // Dispatch is available for state, but layout manages its own tab state
  const { state } = useWorkspace();

  // Listen for hash-based "add provider" requests from ChatPanel
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === "#add-provider") {
        setAddProviderOpen(true);
        setActiveTab("providers");
        window.location.hash = "";
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Sidebar - hidden on mobile, shown on desktop */}
      {!isMobile && <Sidebar />}

      {/* Main Content */}
      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={isMobile ? 100 : 75} minSize={isMobile ? 100 : 40}>
          <div className="h-full flex flex-col">
            {/* Tab Bar */}
            <div className="border-b flex items-center gap-1 px-2 py-1 bg-muted/20">
              <div className="flex-1 flex gap-1 overflow-x-auto">
                <TabButton id="chat" label={isMobile ? <MessageSquare className="h-3.5 w-3.5" /> : "Chat"} active={activeTab} onClick={setActiveTab} />
                <TabButton id="research" label={isMobile ? <Search className="h-3.5 w-3.5" /> : "Deep Research"} active={activeTab} onClick={setActiveTab} />
                <TabButton id="providers" label={isMobile ? <Settings className="h-3.5 w-3.5" /> : "Providers"} active={activeTab} onClick={setActiveTab} />
                <TabButton id="search" label={isMobile ? <Globe className="h-3.5 w-3.5" /> : "Web Search"} active={activeTab} onClick={setActiveTab} />
                <TabButton id="settings" label={isMobile ? <Zap className="h-3.5 w-3.5" /> : "Settings"} active={activeTab} onClick={setActiveTab} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "chat" && <ChatPanel />}
              {activeTab === "research" && <ResearchPanel />}
              {activeTab === "providers" && <ProviderManager autoOpen={addProviderOpen} onClose={() => setAddProviderOpen(false)} />}
              {activeTab === "search" && <WebSearchManager />}
              {activeTab === "settings" && <SettingsPanel />}
            </div>
          </div>
        </Panel>

        {/* Right panel - hide on mobile */}
        {!isMobile && (
          <>
            <PanelResizeHandle className="w-1.5 bg-border hover:bg-ring transition-colors cursor-col-resize" />
            <Panel defaultSize={25} minSize={15} maxSize={40}>
              <div className="h-full p-3 overflow-y-auto">
                <ModelSelector />
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}

function TabButton({ id, label, active, onClick }: {
  id: string;
  label: React.ReactNode;
  active: string;
  onClick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap",
        active === id
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      )}
    >
      {label}
    </button>
  );
}