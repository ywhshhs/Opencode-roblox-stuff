import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { sessions, messages, goals, todos } from "./schema/tables.js";
let db = null;
function getDb() {
    if (!db) {
        const sqliteDb = new Database(":memory:");
        db = drizzle(sqliteDb);
        runMigrations();
    }
    return db;
}
function runMigrations() {
    const sqlite = db.session?.client;
    const statement = sqlite.prepare(`
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);
		CREATE TABLE IF NOT EXISTS messages (
			id TEXT PRIMARY KEY,
			session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
			role TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at INTEGER NOT NULL
		);
		CREATE TABLE IF NOT EXISTS goals (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'active',
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);
		CREATE TABLE IF NOT EXISTS todos (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'pending',
			priority INTEGER NOT NULL DEFAULT 0,
			depends_on TEXT,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);
	`);
    statement.run();
}
export function createSession(name) {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date();
    db.insert(sessions).values({ id, name, createdAt: now, updatedAt: now }).run();
    const [row] = db.select().from(sessions).where(eq(sessions.id, id)).all();
    return row;
}
export function getSession(id) {
    const db = getDb();
    const [row] = db.select().from(sessions).where(eq(sessions.id, id)).all();
    return row ?? null;
}
export function listSessions() {
    const db = getDb();
    return db.select().from(sessions).all();
}
export function addMessage(sessionId, message) {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date();
    db.insert(messages)
        .values({ id, sessionId: sessionId, role: message.role, content: message.content, createdAt: now })
        .run();
    const [row] = db.select().from(messages).where(eq(messages.id, id)).all();
    return row;
}
export function getMessages(sessionId) {
    const db = getDb();
    return db
        .select()
        .from(messages)
        .where(eq(messages.sessionId, sessionId))
        .all();
}
export function createGoal(title, description) {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date();
    db.insert(goals)
        .values({ id, title, description, status: "active", createdAt: now, updatedAt: now })
        .run();
    const [row] = db.select().from(goals).where(eq(goals.id, id)).all();
    return row;
}
export function listGoals() {
    const db = getDb();
    return db.select().from(goals).all();
}
export function updateGoalStatus(id, status) {
    const db = getDb();
    const now = new Date();
    db.update(goals)
        .set({ status, updatedAt: now })
        .where(eq(goals.id, id))
        .run();
    const [row] = db.select().from(goals).where(eq(goals.id, id)).all();
    return row;
}
export function createTodo(title) {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date();
    db.insert(todos)
        .values({ id, title, description: "", status: "pending", priority: 0, createdAt: now, updatedAt: now })
        .run();
    const [row] = db.select().from(todos).where(eq(todos.id, id)).all();
    return row;
}
export function listTodos() {
    const db = getDb();
    return db.select().from(todos).all();
}
export function markTodoDone(id) {
    const db = getDb();
    const now = new Date();
    db.update(todos)
        .set({ status: "done", updatedAt: now })
        .where(eq(todos.id, id))
        .run();
    const [row] = db.select().from(todos).where(eq(todos.id, id)).all();
    return row;
}
//# sourceMappingURL=store.js.map