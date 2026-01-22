
import fs from "fs";
import path from "path";
import { SimpleMcpClient } from "../_core/simpleMcp";
import { ENV } from "../_core/env";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runAgent(agentId: string, context: string, onLog: (msg: string) => void) {
    onLog(`🚀 Initializing Agent Runner for ${agentId}...`);

    // 1. Load Agent Definition
    const agentPath = path.resolve(process.cwd(), ".github/agents", `${agentId}.agent.md`);
    if (!fs.existsSync(agentPath)) {
        throw new Error(`Agent definition not found: ${agentPath}`);
    }
    const agentContent = fs.readFileSync(agentPath, "utf-8");

    // Extract System Prompt (The content after frontmatter)
    const systemPrompt = agentContent.replace(/^---\n[\s\S]*?---\n/, "");

    // 2. Start MCP Server
    onLog("🔧 Starting Playwright MCP Server...");
    const mcpEnv = ENV.mcpHeadless ? { HEADLESS: "1" } : {};
    const mcp = new SimpleMcpClient("npx", ["playwright", "run-test-mcp-server"], mcpEnv);

    mcp.on("log", (msg) => onLog(msg));

    try {
        await mcp.connect();
        onLog("✅ MCP Connected.");

        // 3. Get Tools
        const toolsResponse = await mcp.request("tools/list", {});
        const mcpTools = toolsResponse.tools;
        // Inject custom file reading tool
        const customTools = [
            {
                name: "read_file",
                description: "Read the content of a file from the filesystem. Use this to read the test plan or seed file.",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "Path to the file to read (relative to project root)",
                        }
                    },
                    required: ["path"],
                },
            }
        ];

        const tools = [...mcpTools, ...customTools];

        onLog(`🛠️ Loaded ${mcpTools.length} tools from MCP and ${customTools.length} custom tools.`);

        // 4. OpenAI Loop
        const messages: any[] = [
            { role: "system", content: systemPrompt },
            { role: "user", content: context }
        ];

        onLog("🤖 Thinking...");

        // Limit loop to avoid infinite costs
        for (let i = 0; i < 15; i++) {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${ENV.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: ENV.openaiModel, // Use configured model (default gpt-4o)
                    messages: messages,
                    tools: tools.map((t: any) => ({
                        type: "function",
                        function: {
                            name: t.name,
                            description: t.description,
                            parameters: t.inputSchema
                        }
                    }))
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI API Error: ${err}`);
            }

            const data = await response.json();
            const choice = data.choices[0];
            const message = choice.message;

            messages.push(message);

            if (message.content) {
                onLog(`🤖 ${message.content}`);
            }

            if (message.tool_calls) {
                onLog(`⚡ Executing ${message.tool_calls.length} tool(s)...`);

                for (const toolCall of message.tool_calls) {
                    const toolName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);

                    onLog(`running tool: ${toolName}`);

                    try {
                        let result;

                        // Handle Custom Tools
                        if (toolName === "read_file") {
                            const p = path.resolve(process.cwd(), args.path);
                            // Security check: ensure path is within project
                            if (!p.startsWith(process.cwd())) {
                                throw new Error("Access denied: Cannot read files outside project root.");
                            }
                            if (!fs.existsSync(p)) {
                                throw new Error(`File not found: ${args.path}`);
                            }
                            const content = fs.readFileSync(p, "utf-8");
                            result = { content: [{ type: "text", text: content }] };
                        } else {
                            // Handle MCP Tools
                            result = await mcp.request("tools/call", {
                                name: toolName,
                                arguments: args
                            });
                        }

                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(result)
                        });

                        // If result has text, log it
                        if (result.content && result.content[0]?.text) {
                            onLog(`> ${result.content[0].text.substring(0, 100)}...`);
                        } else {
                            onLog(`> Tool completed.`);
                        }

                    } catch (e: any) {
                        onLog(`❌ Tool Error: ${e.message}`);
                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: `Error: ${e.message}`
                        });
                    }
                }
            } else {
                // No tool calls, assume done
                onLog("✅ Agent Task Completed.");
                break;
            }
        }

    } catch (e: any) {
        onLog(`❌ Error: ${e.message}`);
        console.error(e);
    } finally {
        mcp.disconnect();
        onLog("🏁 Session ended.");
    }
}
