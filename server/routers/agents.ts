import { Router } from "express";
import { spawn } from "child_process";
import path from "path";

import fs from "fs";

export const agentRouter = Router();

// List available agents
agentRouter.get("/", (req, res) => {
    res.json({
        agents: [
            { id: "playwright-test-planner", name: "Test Planner", description: "Creates comprehensive test plans." },
            { id: "playwright-test-generator", name: "Test Generator", description: "Generates Playwright code from plans." },
            { id: "playwright-test-healer", name: "Test Healer", description: "Fixes broken tests." },
        ],
    });
});

// List available test plans
agentRouter.get("/plans", (req, res) => {
    const specsPath = path.resolve(process.cwd(), "specs");
    if (!fs.existsSync(specsPath)) {
        res.json({ files: [] });
        return;
    }
    const files = fs.readdirSync(specsPath).filter(f => f.endsWith(".md"));
    res.json({ files });
});

// Get test plan content
agentRouter.get("/plan", (req, res) => {
    const { file } = req.query;
    const fileName = (file as string) || "test-plan.md";
    const planPath = path.resolve(process.cwd(), "specs", fileName);

    // Security check
    if (!planPath.startsWith(path.resolve(process.cwd(), "specs"))) {
        res.status(403).json({ content: "Access denied" });
        return;
    }

    if (fs.existsSync(planPath)) {
        const content = fs.readFileSync(planPath, "utf-8");
        res.json({ content });
    } else {
        res.json({ content: "" });
    }
});

// Run an agent
agentRouter.get("/run/:agentId", async (req, res) => {
    const { agentId } = req.params;
    const { context } = req.query;

    // Set headers for SSE (Server-Sent Events)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log(`Starting agent: ${agentId} with context: ${context}`);

    // Construct the command.
    // Note: specific arguments depend on how the agents are designed to be invoked via CLI.
    // Assuming a hypothetical CLI usage based on the agent files present.
    // For now, we will run a dummy command to demonstrate the streaming.
    // Real command would be something like:
    // const cmd = "npx";
    // const args = ["playwright", "run-agent", agentId, "--context", String(context)];

    // Since we don't have the full agent CLI wrapper yet, let's simulate the output
    try {
        const { runAgent } = await import("./agentRunner");

        await runAgent(agentId, context as string, (logMsg) => {
            res.write(`data: ${JSON.stringify({ type: "stdout", content: logMsg })}\n\n`);
        });

        res.write(`data: ${JSON.stringify({ type: "exit", code: 0 })}\n\n`);
    } catch (error: any) {
        console.error("Agent Run Error:", error);
        res.write(`data: ${JSON.stringify({ type: "stderr", content: error.message })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: "exit", code: 1 })}\n\n`);
    } finally {
        res.end();
    }
});
