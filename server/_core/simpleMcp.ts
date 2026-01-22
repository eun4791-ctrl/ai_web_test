
import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";

export class SimpleMcpClient extends EventEmitter {
    private process: ChildProcess | null = null;
    private messageId = 0;
    private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
    private buffer = "";

    constructor(private command: string, private args: string[], private env: NodeJS.ProcessEnv = {}) {
        super();
    }

    async connect() {
        this.process = spawn(this.command, this.args, {
            stdio: ["pipe", "pipe", "pipe"],
            env: { ...process.env, ...this.env },
        });

        this.process.stdout?.on("data", (data) => {
            this.buffer += data.toString();
            this.processBuffer();
        });

        this.process.stderr?.on("data", (data) => {
            console.error(`[MCP STDERR] ${data}`);
            this.emit("log", `[MCP ERROR] ${data.toString()}`);
        });

        this.process.on("close", (code) => {
            console.log(`MCP Process exited with code ${code}`);
            this.emit("close", code);
        });

        // Initialize MCP
        await this.request("initialize", {
            protocolVersion: "2024-11-05", // Use a recent version
            capabilities: {},
            clientInfo: {
                name: "qa-dashboard-client",
                version: "1.0.0",
            },
        });

        await this.notification("notifications/initialized", {});
    }

    private processBuffer() {
        let newlineIndex: number;
        while ((newlineIndex = this.buffer.indexOf("\n")) !== -1) {
            const line = this.buffer.slice(0, newlineIndex);
            this.buffer = this.buffer.slice(newlineIndex + 1);

            if (line.trim()) {
                try {
                    const message = JSON.parse(line);
                    this.handleMessage(message);
                } catch (e) {
                    console.error("Failed to parse JSON-RPC message:", line);
                }
            }
        }
    }

    private handleMessage(message: any) {
        if (message.id !== undefined && this.pendingRequests.has(message.id)) {
            const { resolve, reject } = this.pendingRequests.get(message.id)!;
            this.pendingRequests.delete(message.id);
            if (message.error) {
                reject(message.error);
            } else {
                resolve(message.result);
            }
        } else {
            // Notification or request from server
            if (message.method === "notifications/message") {
                // Log message from server
                this.emit("log", `[MCP] ${message.params.data}`);
            }
        }
    }

    async request(method: string, params: any): Promise<any> {
        const id = this.messageId++;
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            const request = { jsonrpc: "2.0", id, method, params };
            this.send(request);
        });
    }

    async notification(method: string, params: any) {
        const request = { jsonrpc: "2.0", method, params };
        this.send(request);
    }

    private send(request: any) {
        if (this.process?.stdin) {
            this.process.stdin.write(JSON.stringify(request) + "\n");
        }
    }

    disconnect() {
        this.process?.kill();
    }
}
