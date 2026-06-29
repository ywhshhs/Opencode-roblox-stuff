"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/stores/workspace";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  StopCircle,
  Sparkles,
  Brain,
  Code,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  User,
  Bot,
  Globe,
  Zap,
} from "lucide-react";
import type { ChatMessage, ContentBlock } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Sanitize markdown-ish content for display
function MessageContent({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "reasoning":
          case "thinking":
            return <ThinkingBlock key={i} block={block} />;
          case "code":
            return <CodeBlock key={i} block={block} />;
          case "tool_call":
            return <ToolCallBlock key={i} block={block} />;
          case "tool_result":
            return <ToolResultBlock key={i} block={block} />;
          default:
            return <TextBlock key={i} block={block} />;
        }
      })}
    </div>
  );
}

function TextBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {block.content.split("\n").map((line, i) => (
        <p key={i} className="leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  );
}

function ThinkingBlock({ block }: { block: ContentBlock }) {
  const [open, setOpen] = useState(!block.collapsed);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "rounded-lg border bg-muted/30 p-2",
          block.type === "thinking" ? "border-blue-200 dark:border-blue-800" : "border-amber-200 dark:border-amber-800",
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground w-full">
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <Brain className="h-3 w-3" />
            {block.type === "thinking" ? "Thinking" : "Reasoning"}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
            {block.content}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function CodeBlock({ block }: { block: ContentBlock }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(block.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50">
        <div className="flex items-center gap-2">
          <Code className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{block.language ?? "code"}</span>
        </div>
        <button onClick={copy} className="p-1 hover:bg-muted rounded">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="p-3 text-xs overflow-x-auto">
        <code>{block.content}</code>
      </pre>
    </div>
  );
}

function ToolCallBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 rounded-lg bg-muted/30">
      <RefreshCw className="h-3 w-3 animate-spin" />
      <span>Using tool: {block.title ?? block.content}</span>
    </div>
  );
}

function ToolResultBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/30">
      <Check className="h-3 w-3 text-green-500" />
      <span>{block.title ?? "Tool completed"}</span>
    </div>
  );
}

// ---- Message Bubble ----

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row",
        message.status === "streaming" && "opacity-80",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 h-7 w-7 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border",
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isUser && "text-right")}>
        <div className={cn(isUser ? "inline-block" : "")}>
          <MessageContent blocks={message.content} />
        </div>

        {/* Status indicators */}
        {message.status === "streaming" && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating...
          </span>
        )}
        {message.status === "error" && (
          <div className="text-xs text-destructive mt-1">
            Failed to generate response
          </div>
        )}

        {/* Token count */}
        {message.tokens && message.status === "done" && (
          <div className="text-xs text-muted-foreground mt-1">
            {message.tokens} tokens
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main Chat Panel ----

export function ChatPanel() {
  const { state } = useWorkspace();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = state.conversations.find(
    (c) => c.id === state.activeConversationId,
  )?.messages ?? [];

  const activeModel = state.providers
    .flatMap((p) => p.models)
    .find((m) => m.id === state.activeModelId);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    // TODO: implement actual chat
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="mb-4 flex justify-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h2 className="text-lg font-semibold mb-1">Start a conversation</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {activeModel
                  ? `Using ${activeModel.name}`
                  : "Select a model to begin"}
              </p>
              {!state.activeModelId && (
                <div className="flex justify-center">
                  <Button variant="outline" size="sm" onClick={() => {
                    // Navigate to the providers tab — use location
                    window.location.hash = "#add-provider";
                  }}>
                    <Zap className="h-4 w-4 mr-1" />
                    Configure a Model
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="space-y-0">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
            {activeModel?.supportsReasoning &&
              <span className="text-xs text-muted-foreground">
                (reasoning enabled)
              </span>
            }
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder={
              activeModel
                ? `Message ${activeModel.name}...`
                : "Select a model first..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[200px] resize-none pr-12"
            rows={2}
          />
          <div className="absolute bottom-2 right-2 flex gap-1">
            {isLoading ? (
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="default"
                    className="h-8 w-8"
                    onClick={handleSend}
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send message</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 rounded bg-muted">Enter</kbd>
          <span>to send ·</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted">Shift+Enter</kbd>
          <span>for new line</span>
          {activeModel?.supportsDeepResearch && (
            <>
              <span className="mx-1">·</span>
              <Globe className="h-3 w-3" />
              <span>Deep Research active</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}