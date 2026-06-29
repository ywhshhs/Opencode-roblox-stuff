export interface GoalCycle {
    plan(goal: {
        title: string;
        description: string;
    }): Promise<void>;
    execute(): Promise<boolean>;
    reflect(): Promise<string>;
}
export declare class GoalDaemon {
    private interval;
    private running;
    private currentGoal;
    constructor(interval?: number);
    start(): Promise<void>;
    stop(): Promise<void>;
    cycle(): Promise<GoalCycle>;
}
//# sourceMappingURL=daemon.d.ts.map