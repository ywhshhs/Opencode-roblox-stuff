import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { getInstancesPath, getMachinePath, getOrchestratorDir } from "./config.js";
function ensureOrchestratorDir() {
    const orchestratorDir = getOrchestratorDir();
    if (!existsSync(orchestratorDir)) {
        mkdirSync(orchestratorDir, { recursive: true });
    }
}
export function loadMachine() {
    const machinePath = getMachinePath();
    if (!existsSync(machinePath)) {
        return undefined;
    }
    const data = readFileSync(machinePath, "utf-8");
    return JSON.parse(data);
}
export function saveMachine(machine) {
    ensureOrchestratorDir();
    writeFileSync(getMachinePath(), JSON.stringify(machine, null, 2));
}
export function deleteMachine() {
    const machinePath = getMachinePath();
    if (!existsSync(machinePath)) {
        return;
    }
    rmSync(machinePath);
}
export function loadInstances() {
    const instancesPath = getInstancesPath();
    if (!existsSync(instancesPath)) {
        return [];
    }
    const data = readFileSync(instancesPath, "utf-8");
    return JSON.parse(data);
}
export function saveInstances(instances) {
    ensureOrchestratorDir();
    writeFileSync(getInstancesPath(), JSON.stringify(instances, null, 2));
}
export function getInstance(instanceId) {
    return loadInstances().find((instance) => instance.id === instanceId);
}
export function upsertInstance(instance) {
    const instances = loadInstances();
    const index = instances.findIndex((existing) => existing.id === instance.id);
    if (index === -1) {
        instances.push(instance);
        saveInstances(instances);
        return;
    }
    instances[index] = instance;
    saveInstances(instances);
}
export function removeInstance(instanceId) {
    const instances = loadInstances().filter((instance) => instance.id !== instanceId);
    saveInstances(instances);
}
//# sourceMappingURL=storage.js.map