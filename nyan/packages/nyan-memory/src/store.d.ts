export interface Session {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    /** Messages in this session */
    messages?: Message[];
}
export interface Message {
    id: string;
    sessionId: string;
    role: string;
    content: string;
    createdAt: Date;
}
export interface Goal {
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Todo {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: number;
    dependsOn?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare function createSession(name: string): Session;
export declare function getSession(id: string): Session | null;
export declare function listSessions(): Session[];
export declare function addMessage(sessionId: string, message: {
    role: string;
    content: string;
}): Message;
export declare function getMessages(sessionId: string): Message[];
export declare function createGoal(title: string, description: string): Goal;
export declare function listGoals(): Goal[];
export declare function updateGoalStatus(id: string, status: string): Goal;
export declare function createTodo(title: string): Todo;
export declare function listTodos(): Todo[];
export declare function markTodoDone(id: string): Todo;
//# sourceMappingURL=store.d.ts.map