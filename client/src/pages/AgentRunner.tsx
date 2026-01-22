import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Play, SquareTerminal, Sparkles, RotateCw, FileText } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface Agent {
    id: string;
    name: string;
    description: string;
}

const AGENTS: Agent[] = [
    { id: "playwright-test-planner", name: "Test Planner", description: "웹사이트를 분석하고 테스트 시나리오를 설계합니다." },
    { id: "playwright-test-generator", name: "Test Generator", description: "설계된 시나리오를 바탕으로 Playwright 코드를 작성합니다." },
    { id: "playwright-test-healer", name: "Test Healer", description: "실패한 테스트를 분석하고 수정합니다." },
];

export default function AgentRunner() {
    const [selectedAgent, setSelectedAgent] = useState<string>(AGENTS[0].id);
    const [context, setContext] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const [planContent, setPlanContent] = useState("");
    const [planFiles, setPlanFiles] = useState<string[]>([]);
    const [selectedPlanFile, setSelectedPlanFile] = useState<string>("");

    // Fetch list of plan files
    const fetchPlanFiles = async () => {
        try {
            const res = await fetch("/api/agents/plans");
            const data = await res.json();
            setPlanFiles(data.files || []);

            // If no plan is selected but files exist, select the first one (or test-plan.md if exists)
            if (data.files && data.files.length > 0 && !selectedPlanFile) {
                if (data.files.includes("test-plan.md")) {
                    setSelectedPlanFile("test-plan.md");
                } else {
                    setSelectedPlanFile(data.files[0]);
                }
            }
        } catch (e) {
            console.error("Failed to fetch plan files", e);
        }
    };

    const fetchPlan = async () => {
        if (!selectedPlanFile) return;
        try {
            const res = await fetch(`/api/agents/plan?file=${selectedPlanFile}`);
            const data = await res.json();
            setPlanContent(data.content);
        } catch (e) {
            console.error("Failed to fetch plan", e);
        }
    };

    useEffect(() => {
        fetchPlanFiles();
    }, []);

    useEffect(() => {
        if (selectedPlanFile) {
            fetchPlan();
        }
    }, [selectedPlanFile]);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleRun = () => {
        if (!selectedAgent) return;
        if (!context.trim()) {
            toast.error("지시할 내용을 입력해주세요.");
            return;
        }

        setIsRunning(true);
        setLogs(["🚀 Agent starting..."]);

        const url = `/api/agents/run/${selectedAgent}?context=${encodeURIComponent(context)}`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);

                if (parsed.type === "stdout" || parsed.type === "stderr") {
                    setLogs((prev) => [...prev, parsed.content]);
                } else if (parsed.type === "exit") {
                    setLogs((prev) => [...prev, `🏁 Agent finished with code ${parsed.code}`]);
                    eventSource.close();
                    setIsRunning(false);
                    // Refresh plans and content
                    fetchPlanFiles();
                    fetchPlan();
                }

            } catch (e) {
                console.error("Failed to parse log", e);
            }
        };

        eventSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            eventSource.close();
            setIsRunning(false);
            setLogs((prev) => [...prev, "❌ Connection error or stream closed."]);
        };
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center space-x-2">
                    <Bot className="w-8 h-8 text-indigo-600" />
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI Agents</h1>
                </div>
                <p className="text-gray-500">
                    Playwright AI 에이전트를 사용하여 테스트 계획 수립, 코드 생성, 유지보수를 자동화하세요.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>에이전트 설정</CardTitle>
                            <CardDescription>실행할 에이전트와 작업을 선택하세요.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Select Agent</label>
                                <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={isRunning}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an agent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AGENTS.map((agent) => (
                                            <SelectItem key={agent.id} value={agent.id}>
                                                <div className="flex flex-col items-start py-1">
                                                    <span className="font-semibold">{agent.name}</span>
                                                    <span className="text-xs text-gray-500">{agent.description}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Instructions (Context)</label>
                                <Textarea
                                    placeholder="예: 로그인 페이지에 대한 테스트 시나리오를 작성해줘"
                                    className="min-h-[150px] resize-none"
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    disabled={isRunning}
                                />
                                <p className="text-xs text-gray-500">
                                    에이전트에게 전달할 구체적인 작업 지시사항을 입력하세요.
                                </p>
                            </div>

                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={handleRun}
                                disabled={isRunning}
                            >
                                {isRunning ? (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Run Agent
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <SquareTerminal className="w-5 h-5" />
                                Terminal Output
                            </CardTitle>
                            <CardDescription>에이전트의 실시간 실행 로그입니다.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-[400px]">
                            <div
                                ref={logContainerRef}
                                className="w-full h-full min-h-[400px] max-h-[600px] bg-black rounded-lg p-4 overflow-y-auto font-mono text-sm text-green-400 shadow-inner"
                            >
                                {logs.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-600 italic">
                                        Waiting for execution...
                                    </div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="whitespace-pre-wrap break-all py-0.5 border-l-2 border-transparent hover:border-gray-700 pl-1">
                                            {log}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Test Plan Viewer
                                </CardTitle>
                                <CardDescription>Generated test scenarios and steps.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={selectedPlanFile} onValueChange={setSelectedPlanFile}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select plan file" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {planFiles.length === 0 ? (
                                            <SelectItem value="none" disabled>No plans found</SelectItem>
                                        ) : (
                                            planFiles.map((file) => (
                                                <SelectItem key={file} value={file}>{file}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="icon" onClick={() => { fetchPlanFiles(); fetchPlan(); }}>
                                    <RotateCw className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted p-4 rounded-md overflow-x-auto min-h-[200px]">
                                <pre className="text-sm whitespace-pre-wrap">{planContent || "Select a plan file to view content."}</pre>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
