import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { WorkspaceState } from "@/types";

const initialState: WorkspaceState = {
  activeConversationId: null,
  conversations: [],
  providers: [],
  webSearchConfigs: [],
  activeModelId: "",
  activeWebSearchProviderId: "",
  researchConfig: {
    depth: "normal",
    maxSources: 10,
    maxIterations: 3,
    webSearchEnabled: true,
    webSearchProviderId: "",
    modelId: "",
  },
  sidebarOpen: true,
  sidebarWidth: 280,
};

type Action =
  | { type: "SET_ACTIVE_CONVERSATION"; id: string }
  | { type: "ADD_CONVERSATION"; conversation: WorkspaceState["conversations"][0] }
  | { type: "ADD_MESSAGE"; conversationId: string; message: WorkspaceState["conversations"][0]["messages"][0] }
  | { type: "UPDATE_MESSAGE"; conversationId: string; messageId: string; updates: Partial<WorkspaceState["conversations"][0]["messages"][0]> }
  | { type: "ADD_PROVIDER"; provider: WorkspaceState["providers"][0] }
  | { type: "REMOVE_PROVIDER"; id: string }
  | { type: "SET_MODELS"; providerId: string; models: WorkspaceState["providers"][0]["models"] }
  | { type: "SET_ACTIVE_MODEL"; id: string }
  | { type: "ADD_WEB_SEARCH_CONFIG"; config: WorkspaceState["webSearchConfigs"][0] }
  | { type: "SET_ACTIVE_WEB_SEARCH"; id: string }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR_WIDTH"; width: number };

function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case "SET_ACTIVE_CONVERSATION":
      return { ...state, activeConversationId: action.id };
    case "ADD_CONVERSATION":
      return { ...state, conversations: [...state.conversations, action.conversation] };
    case "ADD_MESSAGE": {
      const conv = state.conversations.find((c) => c.id === action.conversationId);
      if (!conv) return state;
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId
            ? { ...c, messages: [...c.messages, action.message], updatedAt: Date.now() }
            : c,
        ),
      };
    }
    case "UPDATE_MESSAGE": {
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === action.messageId ? { ...m, ...action.updates } : m,
                ),
              }
            : c,
        ),
      };
    }
    case "ADD_PROVIDER":
      return { ...state, providers: [...state.providers, action.provider] };
    case "REMOVE_PROVIDER":
      return { ...state, providers: state.providers.filter((p) => p.id !== action.id) };
    case "SET_MODELS":
      return {
        ...state,
        providers: state.providers.map((p) =>
          p.id === action.providerId ? { ...p, models: action.models } : p,
        ),
      };
    case "SET_ACTIVE_MODEL":
      return { ...state, activeModelId: action.id };
    case "ADD_WEB_SEARCH_CONFIG":
      return { ...state, webSearchConfigs: [...state.webSearchConfigs, action.config] };
    case "SET_ACTIVE_WEB_SEARCH":
      return { ...state, activeWebSearchProviderId: action.id };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "SET_SIDEBAR_WIDTH":
      return { ...state, sidebarWidth: action.width };
    default:
      return state;
  }
}

const WorkspaceContext = createContext<{
  state: WorkspaceState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <WorkspaceContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}