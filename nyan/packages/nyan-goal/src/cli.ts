#!/usr/bin/env node
import { createGoal, listGoals, updateGoalStatus } from "@nyan-works/nyan-memory";
import { GoalDaemon } from "./daemon.js";

export async function main(): Promise<void> {
  const command = process.argv[2];
  switch (command) {
    case "start": {
      const daemon = new GoalDaemon();
      await daemon.start();
      break;
    }
    case "list":
    case "ls": {
      const goals = await listGoals();
      for (const g of goals) console.log(`[${g.status}] ${g.title}: ${g.description}`);
      break;
    }
    case "create": {
      const title = process.argv[3];
      const desc = process.argv[4] || "";
      if (!title) { console.error("Usage: nyan goal create <title> [description]"); process.exit(1); }
      await createGoal(title, desc);
      break;
    }
    case "--help":
    case "help":
    default:
      console.log("Usage: nyan goal <command>");
      console.log("Commands:");
      console.log("  start    Start the goal daemon");
      console.log("  create   Create a new goal");
      console.log("  list     List all goals");
      break;
  }
}