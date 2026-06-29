import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceProvider } from "@/stores/workspace";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";

const queryClient = new QueryClient();

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WorkspaceProvider>
            <Router>
              <Switch>
                <Route path="/">
                  <WorkspaceLayout />
                </Route>
                <Route>404 - Not Found</Route>
              </Switch>
            </Router>
            <Toaster />
          </WorkspaceProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}