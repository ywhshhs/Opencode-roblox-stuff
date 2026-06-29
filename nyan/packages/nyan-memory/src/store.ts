import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { sessions, messages, goals, todos } from "./schema/tables.js";

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

let db: ReturnType<typeof drizzle> | null = null;

function getDb(): ReturnType<typeof drizzle> {
	if (!db) {
		const sqliteDb = new Database(":memory:");
		db = drizzle(sqliteDb);
		runMigrations();
	}
	return db;
}

function runMigrations() {
	const sqlite = (db! as any).session?.client as typeof Database.prototype;
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

export function createSession(name: string): Session {
	const db = getDb();
	const id = crypto.randomUUID();
	const now = new Date();
	db.insert(sessions).values({ id, name, createdAt: now, updatedAt: now }).run();
	const [row] = db.select().from(sessions).where(eq(sessions.id, id)).all();
	return row as Session;
}

export function getSession(id: string): Session | null {
	const db = getDb();
	const [row] = db.select().from(sessions).where(eq(sessions.id, id)).all();
	return (row as Session) ?? null;
}

export function listSessions(): Session[] {
	const db = getDb();
	return db.select().from(sessions).all() as Session[];
}

export function addMessage(
	sessionId: string,
	message: { role: string; content: string },
): Message {
	const db = getDb();
	const id = crypto.randomUUID();
	const now = new Date();
	db.insert(messages)
		.values({ id, sessionId: sessionId, role: message.role, content: message.content, createdAt: now })
		.run();
	const [row] = db.select().from(messages).where(eq(messages.id, id)).all();
	return row as Message;
}

export function getMessages(sessionId: string): Message[] {
	const db = getDb();
	return db
		.select()
		.from(messages)
		.where(eq(messages.sessionId, sessionId))
		.all() as Message[];
}

export function createGoal(title: string, description: string): Goal {
	const db = getDb();
	const id = crypto.randomUUID();
	const now = new Date();
	db.insert(goals)
		.values({ id, title, description, status: "active", createdAt: now, updatedAt: now })
		.run();
	const [row] = db.select().from(goals).where(eq(goals.id, id)).all();
	return row as Goal;
}

export function listGoals(): Goal[] {
	const db = getDb();
	return db.select().from(goals).all() as Goal[];
}

export function updateGoalStatus(id: string, status: string): Goal {
	const db = getDb();
	const now = new Date();
	db.update(goals)
		.set({ status, updatedAt: now })
		.where(eq(goals.id, id))
		.run();
	const [row] = db.select().from(goals).where(eq(goals.id, id)).all();
	return row as Goal;
}

export function createTodo(title: string): Todo {
	const db = getDb();
	const id = crypto.randomUUID();
	const now = new Date();
	db.insert(todos)
		.values({ id, title, description: "", status: "pending", priority: 0, createdAt: now, updatedAt: now })
		.run();
	const [row] = db.select().from(todos).where(eq(todos.id, id)).all();
	return row as Todo;
}

export function listTodos(): Todo[] {
	const db = getDb();
	return db.select().from(todos).all() as Todo[];
}

export function markTodoDone(id: string): Todo {
	const db = getDb();
	const now = new Date();
	db.update(todos)
		.set({ status: "done", updatedAt: now })
		.where(eq(todos.id, id))
		.run();
	const [row] = db.select().from(todos).where(eq(todos.id, id)).all();
	return row as Todo;
}