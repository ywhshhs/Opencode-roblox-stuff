"use client";

import { useState, useCallback, useEffect } from "react";
import { useWorkspace } from "@/stores/workspace";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Settings2,
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Loader2,
  Brain,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ModelProvider, ModelProviderType, AIModel } from "@/types";

type Action =
  | { type: "SET_ACTIVE_MODEL"; id: string }
  | { type: "ADD_PROVIDER"; provider: ModelProvider }
  | { type: "REMOVE_PROVIDER"; id: string }
  | { type: "SET_MODELS"; providerId: string; models: AIModel[] }
  | { type: "SET_ACTIVE_WEB_SEARCH"; id: string };

// ---- Model Selector (Right Panel) ----

export function ModelSelector() {
  const { state, dispatch } = useWorkspace();

  const activeProvider = state.providers.find((p) => p.isActive);
  const activeModel = state.providers
    .flatMap((p) => p.models)
    .find((m) => m.id === state.activeModelId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Active Model
        </span>
      </div>

      <Select
        value={state.activeModelId}
        onValueChange={(id) =>
          dispatch({ type: "SET_ACTIVE_MODEL", id } as Action)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={activeModel ? activeModel.name : "Select a model..."}
          />
        </SelectTrigger>
        <SelectContent>
          {state.providers
            .filter((p) => p.isActive)
            .flatMap((p) => p.models)
            .map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <span>{model.name}</span>
                  {model.supportsReasoning && (
                    <Badge variant="outline" className="text-[10px] px-1">
                      <Brain className="h-3 w-3 mr-0.5" />
                      R
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          {state.providers.length === 0 && (
            <div className="p-2 text-xs text-muted-foreground text-center">
              No providers configured
            </div>
          )}
        </SelectContent>
      </Select>

      {activeModel && (
        <div className="space-y-2 mt-3">
          <div className="text-xs font-medium text-muted-foreground">Capabilities</div>
          <div className="flex flex-wrap gap-1">
            {activeModel.supportsReasoning && (
              <Badge variant="secondary" className="text-[10px]">
                Reasoning
              </Badge>
            )}
            {activeModel.supportsThinking && (
              <Badge variant="secondary" className="text-[10px]">
                Thinking
              </Badge>
            )}
            {activeModel.supportsDeepResearch && (
              <Badge variant="secondary" className="text-[10px]">
                Deep Research
              </Badge>
            )}
            {activeModel.maxTokens && (
              <Badge variant="outline" className="text-[10px]">
                {activeModel.maxTokens.toLocaleString()} max
              </Badge>
            )}
          </div>
        </div>
      )}

      {activeProvider && (
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs font-medium text-muted-foreground mb-1">Provider</div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                activeProvider.apiKeyEnabled ? "bg-green-500" : "bg-yellow-500",
              )}
            />
            <span className="text-xs">{activeProvider.name}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {activeProvider.baseUrl}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Model Provider Configuration ----

export function ProviderManager({ autoOpen, onClose }: { autoOpen?: boolean; onClose?: () => void }) {
  const { state, dispatch } = useWorkspace();
  const [adding, setAdding] = useState(autoOpen ?? false);
  const [fetching, setFetching] = useState<string | null>(null);
  const [addUrl, setAddUrl] = useState("");
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<ModelProviderType>("openai");
  const [addKey, setAddKey] = useState("");
  const [addKeyEnabled, setAddKeyEnabled] = useState(true);

  // When autoOpen changes to true, open the dialog
  useEffect(() => {
    if (autoOpen) setAdding(true);
  }, [autoOpen]);

  // When dialog closes, notify parent
  useEffect(() => {
    if (onClose && !adding) onClose();
  }, [adding, onClose]);

  const fetchModelsFromEndpoint = useCallback(
    async (provider: ModelProvider) => {
      setFetching(provider.id);
      try {
        let baseUrl = provider.baseUrl.replace(/\/$/, "");
        // Normalize: strip trailing /v1 if present, then append /v1/models
        if (baseUrl.endsWith("/v1")) {
          baseUrl = baseUrl.slice(0, -3);
        } else if (baseUrl.endsWith("/v1/")) {
          baseUrl = baseUrl.slice(0, -4);
        }
        const modelsUrl = `${baseUrl}/v1/models`;
        const response = await fetch(modelsUrl, {
          headers: {
            ...(provider.apiKey && provider.apiKeyEnabled
              ? { Authorization: `Bearer ${provider.apiKey}` }
              : {}),
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = await response.json();
        // OpenAI returns { data: [...] }, some providers return [...] directly
        const modelList: any[] = Array.isArray(raw) ? raw : (raw.data ?? []);
        const models: AIModel[] = modelList.map(
          (m: any, i: number) => ({
            id: m.id ?? `${provider.id}-model-${i}`,
            name: m.id ?? m.name ?? `Model ${i + 1}`,
            providerId: provider.id,
            supportsReasoning: true,
            supportsThinking: true,
            supportsDeepResearch: true,
            maxTokens: m.max_tokens ?? 128000,
          }),
        );
        dispatch({ type: "SET_MODELS", providerId: provider.id, models } as Action);
      } catch {
        dispatch({ type: "SET_MODELS", providerId: provider.id, models: [] } as Action);
      } finally {
        setFetching(null);
      }
    },
    [dispatch],
  );

  const handleAddProvider = useCallback(() => {
    if (!addUrl || !addName) return;

    const provider: ModelProvider = {
      id: crypto.randomUUID(),
      name: addName,
      type: addType,
      baseUrl: addUrl,
      apiKey: addKey || undefined,
      apiKeyEnabled: addKeyEnabled,
      models: [],
      isActive: true,
      createdAt: Date.now(),
    };

    dispatch({ type: "ADD_PROVIDER", provider } as Action);
    void fetchModelsFromEndpoint(provider);

    setAddUrl("");
    setAddName("");
    setAddKey("");
    setAdding(false);
  }, [addUrl, addName, addType, addKey, addKeyEnabled, dispatch, fetchModelsFromEndpoint]);

  return (
    <div className="p-4 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Model Providers</h2>
        <p className="text-sm text-muted-foreground">
          Configure AI model providers. Add OpenAI, Anthropic, or custom
          API-compatible endpoints.
        </p>
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Model Provider</DialogTitle>
            <DialogDescription>
              Connect an OpenAI or Anthropic-compatible API endpoint.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider Name</Label>
              <Input
                placeholder="e.g., My OpenAI Proxy, Local LLM"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>API Type</Label>
              <Select
                value={addType}
                onValueChange={(v) => setAddType(v as ModelProviderType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI Compatible</SelectItem>
                  <SelectItem value="anthropic">Anthropic Compatible</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                placeholder="https://api.openai.com/v1"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>API Key</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={addKeyEnabled}
                    onCheckedChange={setAddKeyEnabled}
                    id="key-toggle"
                  />
                  <Label
                    htmlFor="key-toggle"
                    className="text-xs text-muted-foreground"
                  >
                    {addKeyEnabled ? "Required" : "Disabled"}
                  </Label>
                </div>
              </div>
              <Input
                type="password"
                placeholder={
                  addKeyEnabled ? "sk-..." : "No key needed (disabled)"
                }
                value={addKey}
                onChange={(e) => setAddKey(e.target.value)}
                disabled={!addKeyEnabled}
              />
              {!addKeyEnabled && (
                <p className="text-xs text-amber-600">
                  Some providers work without an API key (e.g., local models)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProvider} disabled={!addUrl || !addName}>
              <Plus className="h-4 w-4 mr-1" />
              Add Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {state.providers.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
            <p className="font-medium mb-1">No providers configured</p>
            <p>Add a provider to get started with AI models</p>
          </div>
        )}

        {state.providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      provider.isActive ? "bg-green-500" : "bg-gray-300",
                    )}
                  />
                  <CardTitle className="text-sm">{provider.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {provider.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => void fetchModelsFromEndpoint(provider)}
                    disabled={fetching === provider.id}
                  >
                    {fetching === provider.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() =>
                      dispatch({ type: "REMOVE_PROVIDER", id: provider.id } as Action)
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">URL:</span>
                  <span className="truncate">{provider.baseUrl}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">API Key:</span>
                  <span>
                    {provider.apiKey && provider.apiKeyEnabled
                      ? "\u25cf\u25cf\u25cf\u25cf\u25cf\u25cf\u25cf\u25cf"
                      : provider.apiKeyEnabled
                        ? "Missing"
                        : "Not required"}
                  </span>
                </div>
              </div>

              {provider.models.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Models ({provider.models.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {provider.models.map((model) => (
                      <Badge
                        key={model.id}
                        variant={
                          model.id === state.activeModelId
                            ? "default"
                            : "secondary"
                        }
                        className="text-[10px] cursor-pointer"
                        onClick={() =>
                          dispatch({ type: "SET_ACTIVE_MODEL", id: model.id } as Action)
                        }
                      >
                        {model.name}
                        {model.supportsReasoning && (
                          <Brain className="h-2.5 w-2.5 ml-0.5" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}