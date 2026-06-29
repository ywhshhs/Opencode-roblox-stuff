"use client";

import { useState } from "react";
import { useWorkspace } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  X,
  Search,
  Globe,
  LucideIcon,
  ExternalLink,
} from "lucide-react";
import type { WebSearchProvider, WebSearchConfig } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const searchProviderInfo: Record<WebSearchProvider, { name: string; description: string; needsKey: boolean; selfHostable: boolean }> = {
  tavily: { name: "Tavily", description: "AI-powered search API for LLMs", needsKey: true, selfHostable: false },
  exa: { name: "Exa", description: "Semantic search engine", needsKey: true, selfHostable: false },
  brave: { name: "Brave Search", description: "Privacy-focused search engine", needsKey: true, selfHostable: false },
  duckduckgo: { name: "DuckDuckGo", description: "Free, no-tracking search", needsKey: false, selfHostable: false },
  searxng: { name: "SearXNG", description: "Self-hosted, privacy-respecting metasearch", needsKey: false, selfHostable: true },
  google: { name: "Google", description: "Google Custom Search API", needsKey: true, selfHostable: false },
};

export function WebSearchManager() {
  const { state, dispatch } = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [addProvider, setAddProvider] = useState<WebSearchProvider>("tavily");
  const [addName, setAddName] = useState("");
  const [addKey, setAddKey] = useState("");
  const [addUrl, setAddUrl] = useState("");

  const handleAdd = () => {
    if (!addName) return;
    const info = searchProviderInfo[addProvider];

    const config: WebSearchConfig = {
      id: crypto.randomUUID(),
      name: addName,
      provider: addProvider,
      apiKey: addKey || undefined,
      apiKeyRequired: info.needsKey,
      baseUrl: addUrl || (info.selfHostable ? "http://localhost:8888" : undefined),
      isActive: true,
    };

    dispatch({ type: "ADD_WEB_SEARCH_CONFIG", config });
    setAdding(false);
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Web Search Providers</h2>
        <p className="text-sm text-muted-foreground">
          Configure search engines for web research and deep research features.
        </p>
      </div>

      {/* Add */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Add Search Provider
        </Button>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Web Search</DialogTitle>
            <DialogDescription>
              Add a search provider for the research agent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search Engine</Label>
              <Select
                value={addProvider}
                onValueChange={(v) => {
                  setAddProvider(v as WebSearchProvider);
                  const info = searchProviderInfo[v as WebSearchProvider];
                  setAddName(info.name);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(searchProviderInfo).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        {info.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., My Tavily Instance"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder={searchProviderInfo[addProvider].needsKey ? "API key..." : "Not needed"}
                value={addKey}
                onChange={(e) => setAddKey(e.target.value)}
              />
              {!searchProviderInfo[addProvider].needsKey && (
                <p className="text-xs text-muted-foreground">
                  {searchProviderInfo[addProvider].name} doesn't require an API key
                </p>
              )}
            </div>

            {searchProviderInfo[addProvider].selfHostable && (
              <div className="space-y-2">
                <Label>Instance URL</Label>
                <Input
                  placeholder="http://localhost:8888"
                  value={addUrl}
                  onChange={(e) => setAddUrl(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!addName}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider List */}
      <div className="space-y-3">
        {state.webSearchConfigs.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
            <Globe className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium mb-1">No search providers</p>
            <p>Add one to enable web research</p>
          </div>
        )}

        {state.webSearchConfigs.map((config) => (
          <Card key={config.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", config.isActive ? "bg-green-500" : "bg-gray-300")} />
                  <CardTitle className="text-sm">{config.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {searchProviderInfo[config.provider]?.name ?? config.provider}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => dispatch({ type: "SET_ACTIVE_WEB_SEARCH", id: "" })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <span>{searchProviderInfo[config.provider]?.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>API Key: {config.apiKey ? "●●●●" : "Not configured"}</span>
                </div>
                {config.baseUrl && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{config.baseUrl}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}