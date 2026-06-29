"use client";

import { useState } from "react";
import { useWorkspace } from "@/stores/workspace";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Plus,
  Search,
  Globe,
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  Brain,
  Sparkles,
  Zap,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

export function Sidebar() {
  const { state, dispatch } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggle = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
    setCollapsed(!collapsed);
  };

  const conversations = state.conversations;

  return (
    <div
      className={cn(
        "h-full border-r bg-background flex flex-col transition-all duration-200",
        collapsed ? "w-12" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Workspace</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={toggle} className="shrink-0">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* New Chat */}
      {!collapsed && (
        <div className="p-2">
          <Button
            variant="default"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => {
              /* create new conversation */
            }}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      )}

      {/* Search */}
      {!collapsed && (
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {conversations.length === 0 && !collapsed && (
            <div className="text-xs text-muted-foreground text-center py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No conversations yet</p>
              <p className="mt-1">Start a new chat to begin</p>
            </div>
          )}

          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => dispatch({ type: "SET_ACTIVE_CONVERSATION", id: conv.id })}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors",
                state.activeConversationId === conv.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted",
              )}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{conv.title}</span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom actions */}
      {!collapsed && (
        <div className="border-t p-2 space-y-1">
          <button
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>
          <button
            onClick={() => {
              window.location.href = "/settings";
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>
      )}

      {/* Collapsed icon buttons */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center gap-3 py-4 px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New Chat</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Conversations</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Search</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Zap className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Models</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Globe className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Web Search</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}