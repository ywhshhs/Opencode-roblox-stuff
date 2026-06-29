/**
 * Session runtime
 *
 * Use AgentSessionRuntime when you need to replace the active AgentSession,
 * for example for new-session, resume, fork, or import flows.
 *
 * The important pattern is: after the runtime replaces the active session,
 * rebind any session-local subscriptions and extension bindings to `runtime.session`.
 */
export {};
//# sourceMappingURL=13-session-runtime.d.ts.map