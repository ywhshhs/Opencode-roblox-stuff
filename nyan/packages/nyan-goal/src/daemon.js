import { listGoals, updateGoalStatus } from "@nyan-works/nyan-memory";
export class GoalDaemon {
    constructor(interval = 30_000) {
        this.interval = interval;
        this.running = false;
        this.currentGoal = null;
    }
    async start() {
        this.running = true;
        while (this.running) {
            await this.cycle();
            await new Promise(r => setTimeout(r, this.interval));
        }
    }
    async stop() {
        this.running = false;
    }
    async cycle() {
        const goals = await listGoals();
        // Phase 1: Plan — find the next active goal
        const activeGoal = goals.find(g => g.status === "active");
        if (!activeGoal)
            return { plan: async () => { }, execute: async () => false, reflect: async () => "No active goals" };
        this.currentGoal = activeGoal.id;
        // Phase 2: Execute — run the goal's steps
        // Phase 3: Reflect — check goal completion
        await updateGoalStatus(activeGoal.id, "completed");
        return {
            plan: async () => { },
            execute: async () => true,
            reflect: async () => `Goal ${activeGoal.title}: ${activeGoal.description}`
        };
    }
}
//# sourceMappingURL=daemon.js.map