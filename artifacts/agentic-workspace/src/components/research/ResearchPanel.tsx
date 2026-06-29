"use client";

import { useState } from "react";
import { useWorkspace } from "@/stores/workspace";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Search,
  Globe,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  ExternalLink,
  Brain,
  Zap,
  Layers,
  Settings2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ResearchConfig } from "@/types";

export function ResearchPanel() {
  const { state, dispatch } = useWorkspace();
  const [query, setQuery] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);

  const runResearch = () => {
    if (!query || isRunning) return;
    setIsRunning(true);
    setProgress(0);

    // Simulate deep research
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setResults([
            {
              title: "Research Summary",
              sources: [
                { url: "https://example.com/1", title: "Source 1", snippet: "..." },
                { url: "https://example.com/2", title: "Source 2", snippet: "..." },
              ],
              findings: [
                "Key insight 1 about the query",
                "Key insight 2 with supporting evidence",
                "Related research direction identified",
              ],
            },
          ]);
          return 100;
        }
        return p + Math.random() * 15;
      });
    }, 500);
  };

  const depthOptions = [
    { value: "quick", label: "Quick Scan", desc: "Fast, minimal depth" },
    { value: "normal", label: "Normal", desc: "Balanced depth and speed" },
    { value: "deep", label: "Deep", desc: "Thorough analysis" },
    { value: "comprehensive", label: "Comprehensive", desc: "Exhaustive research" },
  ];

  return (
    <div className="p-4 h-full flex flex-col space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Deep Research</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Multi-step research with web search, source analysis, and AI-powered synthesis
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Research Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Depth</Label>
              <Select
                value={state.researchConfig.depth}
                onValueChange={(v) =>
                  dispatch({ type: "SET_DEPTH", ...state, researchConfig: { ...state.researchConfig, depth: v as any } } as any)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {depthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <Layers className="h-3 w-3" />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Model</Label>
              <Select
                value={state.activeModelId}
                onValueChange={(id) => dispatch({ type: "SET_ACTIVE_MODEL", id })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {state.providers.flatMap((p) => p.models).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Max Sources</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[state.researchConfig.maxSources]}
                onValueChange={([v]) =>
                  dispatch({ type: "SET_MAX_SOURCES", maxSources: v } as any)
                }
                max={50}
                min={3}
                step={1}
              />
              <span className="text-xs tabular-nums">{state.researchConfig.maxSources}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Max Iterations</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[state.researchConfig.maxIterations]}
                onValueChange={([v]) =>
                  dispatch({ type: "SET_MAX_ITERATIONS", maxIterations: v } as any)
                }
                max={10}
                min={1}
                step={1}
              />
              <span className="text-xs tabular-nums">{state.researchConfig.maxIterations}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={state.researchConfig.webSearchEnabled}
                onCheckedChange={(v) =>
                  dispatch({ type: "SET_WEB_SEARCH_ENABLED", enabled: v } as any)
                }
              />
              <Label className="text-xs">Enable Web Search</Label>
            </div>
            <Select
              value={state.activeWebSearchProviderId}
              onValueChange={(id) => dispatch({ type: "SET_ACTIVE_WEB_SEARCH", id })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Search provider" />
              </SelectTrigger>
              <SelectContent>
                {state.webSearchConfigs.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {w.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Research Query */}
      <div className="flex-1 space-y-3">
        <div className="relative">
          <Textarea
            placeholder="What would you like to research deeply?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[60px]"
            rows={2}
          />
          <Button
            className="absolute bottom-2 right-2"
            size="sm"
            onClick={runResearch}
            disabled={!query || isRunning}
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Search className="h-4 w-4 mr-1" />
            )}
            {isRunning ? "Researching..." : "Research"}
          </Button>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Gathering sources...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3" />
                Searching web...
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Analyzing {Math.floor(progress / 10)} sources...
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-3 w-3" />
                Synthesizing findings...
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <ScrollArea className="flex-1">
          <div className="space-y-3">
            {results.map((result, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {result.title || `Research Iteration ${i + 1}`}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Found {result.sources?.length ?? 0} sources
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Sources */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Sources
                    </div>
                    <div className="space-y-1">
                      {result.sources?.map((src: any, j: number) => (
                        <div key={j} className="flex items-start gap-2 text-xs">
                          <Badge variant="outline" className="text-[10px] shrink-0">{j + 1}</Badge>
                          <div>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline"
                            >
                              {src.title}
                            </a>
                            <p className="text-muted-foreground">{src.snippet}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Findings */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Key Findings
                    </div>
                    <ul className="text-xs space-y-1">
                      {result.findings?.map((f: string, j: number) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}