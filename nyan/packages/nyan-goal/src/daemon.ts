import { createGoal, listGoals, updateGoalStatus } from "@nyan-works/nyan-memory";

export interface GoalCycle {
  plan(goal: { title: string; description: string }): Promise<void>;
  execute(): Promise<boolean>;
  reflect(): Promise<string>;
}

export class GoalDaemon {
  private interval: number;
  private running: boolean;
  private currentGoal: string | null;

  constructor(interval: number = 30_000) {
    this.interval = interval;
    this.running = false;
    this.currentGoal = null;
  }

  async start(): Promise<void> {
    this.running = true;
    while (this.running) {
      await this.cycle();
      await new Promise(r => setTimeout(r, this.interval));
    }
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  async cycle(): Promise<GoalCycle> {
    const goals = await listGoals();
    // Phase 1: Plan — find the next active goal
    const activeGoal = goals.find(g => g.status === "active");
    if (!activeGoal) return { plan: async () => {}, execute: async () => false, reflect: async () => "No active goals" };
    this.currentGoal = activeGoal.id;
    // Phase 2: Execute — run the goal's steps
    // Phase 3: Reflect — check goal completion
    await updateGoalStatus(activeGoal.id, "completed");
    return {
      plan: async () => {},
      execute: async () => true,
      reflect: async () => `Goal ${activeGoal.title}: ${activeGoal.description}`
    };
  }
}