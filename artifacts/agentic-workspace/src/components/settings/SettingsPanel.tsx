"use client";

import { useTheme } from "next-themes";
import { useWorkspace } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Bell,
  Globe,
  Keyboard,
  Eye,
  Brain,
  Zap,
  Sparkles,
} from "lucide-react";

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const { state, dispatch } = useWorkspace();

  return (
    <div className="p-4 space-y-6 max-w-2xl overflow-y-auto">
      {/* Appearance */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Customize how the workspace looks
        </p>

        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-xs text-muted-foreground">Choose your color scheme</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className="gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className="gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  className="gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  System
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Font Size</Label>
                <p className="text-xs text-muted-foreground">Adjust text size in the chat</p>
              </div>
              <Select defaultValue="sm">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xs">Extra Small</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="base">Normal</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-xs text-muted-foreground">Tighter spacing in messages</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Display */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Display
        </h2>

        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Reasoning</Label>
                <p className="text-xs text-muted-foreground">
                  Display model reasoning blocks in conversations
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Token Count</Label>
                <p className="text-xs text-muted-foreground">
                  Display token usage per message
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Collapse Thinking</Label>
                <p className="text-xs text-muted-foreground">
                  Auto-collapse thinking blocks to save space
                </p>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Code Highlighting</Label>
                <p className="text-xs text-muted-foreground">
                  Enable syntax highlighting in code blocks
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Keyboard Shortcuts
        </h2>

        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/50">
                <span>New Chat</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Cmd+K</kbd>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/50">
                <span>Send Message</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Enter</kbd>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/50">
                <span>New Line</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Shift+Enter</kbd>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/50">
                <span>Toggle Sidebar</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Cmd+B</kbd>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/50">
                <span>Search</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Cmd+F</kbd>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/50">
                <span>Focus Input</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Cmd+L</kbd>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Customize shortcuts in the keyboard settings
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}