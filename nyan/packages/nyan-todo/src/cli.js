#!/usr/bin/env node
import { createTodo, listTodos, markTodoDone } from "@nyan-works/nyan-memory";
export async function main() {
    const command = process.argv[2];
    switch (command) {
        case "add":
            return add();
        case "list":
        case "ls":
            return list();
        case "done":
            return done();
        case "depends":
            return depends();
        case "--help":
        case "help":
        default:
            return help();
    }
}
async function add() {
    const title = process.argv.slice(3).join(" ");
    if (!title) {
        console.log("Usage: nyan todo add <title>");
        process.exit(1);
    }
    const todo = await createTodo(title);
    console.log(`📋 Added todo: ${todo.title}`);
}
async function list() {
    const todos = await listTodos();
    for (const t of todos) {
        const status = t.status === "done" ? "✅" : t.status === "pending" ? "⬜" : "🔄";
        console.log(`${status} ${t.id.slice(0, 8)}: ${t.title}`);
        if (t.description)
            console.log(`   ${t.description}`);
    }
}
async function done() {
    const id = process.argv[3];
    if (!id) {
        console.log("Usage: nyan todo done <id>");
        process.exit(1);
    }
    const todo = await markTodoDone(id);
    console.log(`✅ Done: ${todo.title}`);
}
async function depends() {
    // Show dependency graph
    console.log("Depends: not yet implemented");
}
function help() {
    console.log("nyan todo — manage todos");
    console.log("");
    console.log("Usage: nyan todo <command> [args]");
    console.log("");
    console.log("Commands:");
    console.log("  add <title>       Add a new todo");
    console.log("  list              List all todos");
    console.log("  done <id>         Mark a todo as done");
    console.log("  depends           Show dependency graph");
}
//# sourceMappingURL=cli.js.map