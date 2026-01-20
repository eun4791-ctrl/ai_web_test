import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";

type TestType = "performance" | "responsive" | "ux" | "tc";
type TestState = "IDLE" | "RUNNING" | "PARTIAL_DONE" | "COMPLETED" | "FAILED";

interface LighthouseScore {
  performance: number;
  accessibility: number;
  "best-practices": number;
  seo: number;
}

interface ResponsiveScreenshots {
  desktop?: string;
  tablet?: string;
  mobile?: string;
}

interface UXReview {
  priority: "상" | "중" | "하";
  issue: string;
  cause: string;
  suggestion: string;
}

interface TestCase {
  id: string;
  title: string;
  precondition: string;
  testStep: string;
  expectedResults: string;
  result: "Pass" | "Fail" | "Blocked" | "N/A";
  details?: string;
}

interface TestResult {
  testId: TestType;
  status: "pending" | "running" | "completed" | "failed";
  data?: any;
  error?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
};

const getScoreBgColor = (score: number) => {
  if (score >= 90) return "bg-green-100";
  if (score >= 50) return "bg-amber-100";
  return "bg-red-100";
};

const getPriorityColor = (priority: string) => {
  if (priority === "상") return "bg-red-100 text-red-800";
  if (priority === "중") return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
};

const getResultColor = (result: string) => {
  if (result === "Pass") return "bg-green-100 text-green-800";
  if (result === "Fail") return "bg-red-100 text-red-800";
  if (result === "Blocked") return "bg-gray-100 text-gray-800";
  return "bg-blue-100 text-blue-800";
};

// Lighthouse 점수 원형 차트
const ScoreCircle = ({ score, label }: { score: number; label: string }) => {
  const validScore = isNaN(score) ? 0 : Math.min(100, Math.max(0, score));
  
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (validScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg width="100" height="100" className="transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={validScore >= 90 ? "#10b981" : validScore >= 50 ? "#f59e0b" : "#ef4444"}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={isNaN(offset) ? 0 : offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${getScoreColor(validScore)}`}>
            {validScore}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-gray-700">{label}</p>
    </div>
  );
};

// TC 결과 테이블
const TestCaseTable = ({ testCases, summary }: { testCases: TestCase[]; summary: any }) => {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const successRate = summary.total > 0 
    ? Math.round((summary.passed / (summary.total - summary.na)) * 100 * 10) / 10 
    : 0;

  return (
    <div className="space-y-4">
      {/* 요약 테이블 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">총 TC 수</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pass</p>
            <p className="text-2xl font-bold text-green-600">{summary.passed}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fail</p>
            <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">성공률</p>
            <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
          </div>
        </div>
      </div>

      {/* 상세 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="text-left p-3 font-semibold text-gray-700">ID</th>
              <th className="text-left p-3 font-semibold text-gray-700">Title</th>
              <th className="text-left p-3 font-semibold text-gray-700">Precondition</th>
              <th className="text-left p-3 font-semibold text-gray-700">Test Step</th>
              <th className="text-left p-3 font-semibold text-gray-700">Expected Results</th>
              <th className="text-left p-3 font-semibold text-gray-700">Result</th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc) => (
              <React.Fragment key={tc.id}>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-900 font-medium">{tc.id}</td>
                  <td className="p-3 text-gray-900">{tc.title}</td>
                  <td className="p-3 text-gray-600 text-xs">{tc.precondition}</td>
                  <td className="p-3 text-gray-600 text-xs">{tc.testStep}</td>
                  <td className="p-3 text-gray-600 text-xs">{tc.expectedResults}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getResultColor(tc.result)}`}>
                      {tc.result}
                    </span>
                  </td>
                </tr>
                {tc.details && (
                  <tr className="border-b bg-gray-50">
                    <td colSpan={6} className="p-3">
                      <button
                        onClick={() => toggleRow(tc.id)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        {expandedRows.has(tc.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {expandedRows.has(tc.id) ? "로그 숨기기" : "로그 보기"}
                      </button>
                      {expandedRows.has(tc.id) && (
                        <div className="mt-2 p-3 bg-gray-800 text-gray-100 rounded font-mono text-xs overflow-x-auto">
                          {tc.details}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function Home() {
  const [url, setUrl] = React.useState("");
  const [selectedTests, setSelectedTests] = React.useState<TestType[]>([]);
  const [results, setResults] = React.useState<TestResult[]>([]);
  const [testState, setTestState] = React.useState<TestState>("IDLE");
  const [runId, setRunId] = React.useState<number | null>(null);
  const [pollCount, setPollCount] = React.useState(0);
  const [screenshots, setScreenshots] = React.useState<ResponsiveScreenshots>({});
  const [screenshotBase64, setScreenshotBase64] = React.useState<ResponsiveScreenshots>({});
  const [uxReviews, setUxReviews] = React.useState<UXReview[]>([]);
  const [testCases, setTestCases] = React.useState<TestCase[]>([]);
  const [testSummary, setTestSummary] = React.useState<any>(null);
  const [videoUrl, setVideoUrl] = React.useState<string>("");

  const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || "";
  const GITHUB_REPO = "eun4791-ctrl/ai_web_test";

  if (!GITHUB_TOKEN) {
    console.warn("VITE_GITHUB_TOKEN is not set");
  }

  // URL 검증
  const validateUrl = (inputUrl: string): boolean => {
    try {
      const urlObj = new URL(inputUrl);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  // URL 자동 보정
  const normalizeUrl = (inputUrl: string): string => {
    if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
      return `https://${inputUrl}`;
    }
    return inputUrl;
  };

  // Timestamp 기반 run_id 찾기
  const triggerWorkflow = async (targetUrl: string, tests: string): Promise<number | null> => {
    try {
      console.log("Triggering workflow with URL:", targetUrl, "Tests:", tests);

      // workflow_dispatch 호출 직전 시간 기록 (UTC)
      const dispatchTime = Math.floor(Date.now() / 1000);

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/223007944/dispatches`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            ref: "main",
            inputs: {
              target_url: targetUrl,
              tests: tests,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Workflow trigger failed:", response.status, error);
        throw new Error(`Failed to trigger workflow: ${response.status}`);
      }

      console.log("Workflow triggered successfully");

      // Timestamp 기반으로 run_id 찾기 (최대 25회 polling, 약 7.5초)
      for (let i = 0; i < 25; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));

        const runsResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=10`,
          {
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!runsResponse.ok) continue;

        const runsData = await runsResponse.json();
        const runs = runsData.workflow_runs || [];

        // dispatch 이후에 생성되고 in_progress/queued 상태인 run 찾기
        const targetRun = runs.find((run: any) => {
          const runCreatedTime = Math.floor(new Date(run.created_at).getTime() / 1000);
          const isAfterDispatch = runCreatedTime >= dispatchTime - 1; // 1초 오차 허용
          const isRunning = run.status === "in_progress" || run.status === "queued";
          return isAfterDispatch && isRunning;
        });

        if (targetRun) {
          console.log("Found run ID:", targetRun.id);
          return targetRun.id;
        }
      }

      throw new Error("Could not find workflow run");
    } catch (error) {
      console.error("Trigger error:", error);
      throw error;
    }
  };

  // GitHub API: run 상태 조회
  const checkRunStatus = async (id: number): Promise<{ status: string; conclusion: string | null }> => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${id}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch run status");

      const data = await response.json();
      console.log("Run status:", data.status, "Conclusion:", data.conclusion);
      return { status: data.status, conclusion: data.conclusion };
    } catch (error) {
      console.error("Error checking status:", error);
      return { status: "unknown", conclusion: null };
    }
  };

  // GitHub API: artifacts 목록 조회
  const getArtifacts = async (runId: number): Promise<any[]> => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${runId}/artifacts`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch artifacts");

      const data = await response.json();
      console.log("Artifacts found:", data.artifacts?.length || 0);
      return data.artifacts || [];
    } catch (error) {
      console.error("Error fetching artifacts:", error);
      return [];
    }
  };

  // Lighthouse 결과 조회
  const fetchLighthouseResults = async (id: number): Promise<LighthouseScore | null> => {
    try {
      console.log("Fetching Lighthouse results for run:", id);

      const artifacts = await getArtifacts(id);
      const lighthouseArtifact = artifacts.find((a: any) => a.name === "lighthouse-report");

      if (!lighthouseArtifact) {
        console.warn("Lighthouse artifact not found");
        return null;
      }

      console.log("Downloading Lighthouse artifact...");
      const zipResponse = await fetch(lighthouseArtifact.archive_download_url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      if (!zipResponse.ok) throw new Error("Failed to download artifact");

      const arrayBuffer = await zipResponse.arrayBuffer();
      console.log("Downloaded ZIP file, size:", arrayBuffer.byteLength);

      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);

      let jsonContent: any = null;

      for (const [filename, file] of Object.entries(zip.files)) {
        console.log("ZIP file entry:", filename);
        if (filename.includes("lighthouse-report.json")) {
          const content = await (file as any).async("text");
          jsonContent = JSON.parse(content);
          console.log("Parsed Lighthouse JSON:", jsonContent);
          break;
        }
      }

      if (!jsonContent) {
        console.error("lighthouse-report.json not found in ZIP");
        return null;
      }

      let lighthouseScores: LighthouseScore = {
        performance: 0,
        accessibility: 0,
        "best-practices": 0,
        seo: 0,
      };

      if (jsonContent.categories) {
        const categories = jsonContent.categories;
        lighthouseScores.performance = Math.round((categories.performance?.score || 0) * 100);
        lighthouseScores.accessibility = Math.round((categories.accessibility?.score || 0) * 100);
        lighthouseScores["best-practices"] = Math.round((categories["best-practices"]?.score || 0) * 100);
        lighthouseScores.seo = Math.round((categories.seo?.score || 0) * 100);
      } else if (jsonContent.scores) {
        const scores = jsonContent.scores;
        lighthouseScores.performance = Math.round((scores.performance || 0) * 100);
        lighthouseScores.accessibility = Math.round((scores.accessibility || 0) * 100);
        lighthouseScores["best-practices"] = Math.round((scores["best-practices"] || 0) * 100);
        lighthouseScores.seo = Math.round((scores.seo || 0) * 100);
      }

      if (isNaN(lighthouseScores.performance)) lighthouseScores.performance = 0;
      if (isNaN(lighthouseScores.accessibility)) lighthouseScores.accessibility = 0;
      if (isNaN(lighthouseScores["best-practices"])) lighthouseScores["best-practices"] = 0;
      if (isNaN(lighthouseScores.seo)) lighthouseScores.seo = 0;

      console.log("Extracted scores:", lighthouseScores);
      return lighthouseScores;
    } catch (error) {
      console.error("Error fetching Lighthouse results:", error);
      return null;
    }
  };

  // 스크린샷 조회
  const fetchScreenshots = async (id: number): Promise<ResponsiveScreenshots> => {
    try {
      console.log("Fetching screenshots for run:", id);

      const artifacts = await getArtifacts(id);
      const screenshotArtifact = artifacts.find((a: any) => a.name === "responsive-screenshots");

      if (!screenshotArtifact) {
        console.warn("Screenshot artifact not found");
        return {};
      }

      console.log("Downloading screenshot artifact...");
      const zipResponse = await fetch(screenshotArtifact.archive_download_url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      if (!zipResponse.ok) throw new Error("Failed to download screenshot artifact");

      const arrayBuffer = await zipResponse.arrayBuffer();
      console.log("Downloaded screenshot ZIP, size:", arrayBuffer.byteLength);

      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);

      const base64Screenshots: ResponsiveScreenshots = {};

      for (const [filename, file] of Object.entries(zip.files)) {
        console.log("Screenshot file:", filename);
        if (filename.includes("desktop.png")) {
          const arrayBuf = await (file as any).async("arraybuffer");
          const uint8Array = new Uint8Array(arrayBuf);
          let binaryString = "";
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
          }
          base64Screenshots.desktop = "data:image/png;base64," + btoa(binaryString);
        } else if (filename.includes("tablet.png")) {
          const arrayBuf = await (file as any).async("arraybuffer");
          const uint8Array = new Uint8Array(arrayBuf);
          let binaryString = "";
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
          }
          base64Screenshots.tablet = "data:image/png;base64," + btoa(binaryString);
        } else if (filename.includes("mobile.png")) {
          const arrayBuf = await (file as any).async("arraybuffer");
          const uint8Array = new Uint8Array(arrayBuf);
          let binaryString = "";
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
          }
          base64Screenshots.mobile = "data:image/png;base64," + btoa(binaryString);
        }
      }

      console.log("Extracted screenshots:", Object.keys(base64Screenshots));
      setScreenshotBase64(base64Screenshots);
      return base64Screenshots;
    } catch (error) {
      console.error("Error fetching screenshots:", error);
      return {};
    }
  };

  // AI UX 리뷰 조회
  const fetchUXReview = async (id: number): Promise<UXReview[]> => {
    try {
      console.log("Fetching UX review for run:", id);

      const artifacts = await getArtifacts(id);
      const uxArtifact = artifacts.find((a: any) => a.name === "ux-review");

      if (!uxArtifact) {
        console.warn("UX review artifact not found");
        return [];
      }

      console.log("Downloading UX review artifact...");
      const zipResponse = await fetch(uxArtifact.archive_download_url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      if (!zipResponse.ok) throw new Error("Failed to download UX review artifact");

      const arrayBuffer = await zipResponse.arrayBuffer();
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);

      let jsonContent: any = null;
      for (const [filename, file] of Object.entries(zip.files)) {
        if (filename.includes("ux-review.json")) {
          const content = await (file as any).async("text");
          try {
            jsonContent = JSON.parse(content);
          } catch (parseError) {
            console.error("JSON parse error:", parseError, "Content:", content.substring(0, 200));
            return [];
          }
          break;
        }
      }

      if (!jsonContent) {
        console.error("ux-review.json not found");
        return [];
      }

      const reviews = jsonContent.reviews || [];
      console.log("Extracted UX reviews:", reviews.length);
      setUxReviews(reviews);
      return reviews;
    } catch (error) {
      console.error("Error fetching UX review:", error);
      return [];
    }
  };

  // 비디오 조회
  const fetchVideo = async (id: number): Promise<string> => {
    try {
      console.log("Fetching video for run:", id);

      const artifacts = await getArtifacts(id);
      const videoArtifact = artifacts.find((a: any) => a.name === "test-video");

      if (!videoArtifact) {
        console.warn("Video artifact not found");
        return "";
      }

      console.log("Downloading video artifact...");
      const zipResponse = await fetch(videoArtifact.archive_download_url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      if (!zipResponse.ok) throw new Error("Failed to download video artifact");

      const arrayBuffer = await zipResponse.arrayBuffer();
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);

      for (const [filename, file] of Object.entries(zip.files)) {
        if (filename.includes("test-video.webm")) {
          console.log("Found main video file:", filename);
          const arrayBuf = await (file as any).async("arraybuffer");
          const blob = new Blob([arrayBuf], { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          console.log("Created video URL");
          setVideoUrl(url);
          return url;
        }
      }

      console.warn("No video file found in artifact");
      return "";
    } catch (error) {
      console.error("Error fetching video:", error);
      return "";
    }
  };

  // TC 결과 조회
  const fetchTestCases = async (id: number): Promise<{ testCases: TestCase[]; summary: any }> => {
    try {
      console.log("Fetching test cases for run:", id);

      const artifacts = await getArtifacts(id);
      const tcArtifact = artifacts.find((a: any) => a.name === "test-cases-report");

      if (!tcArtifact) {
        console.warn("Test cases artifact not found");
        return { testCases: [], summary: null };
      }

      console.log("Downloading test cases artifact...");
      const zipResponse = await fetch(tcArtifact.archive_download_url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      if (!zipResponse.ok) throw new Error("Failed to download test cases artifact");

      const arrayBuffer = await zipResponse.arrayBuffer();
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);

      let jsonContent: any = null;
      for (const [filename, file] of Object.entries(zip.files)) {
        if (filename.includes("tc-report.json")) {
          const content = await (file as any).async("text");
          jsonContent = JSON.parse(content);
          break;
        }
      }

      if (!jsonContent) {
        console.error("tc-report.json not found");
        return { testCases: [], summary: null };
      }

      const testCasesList = jsonContent.testCases || [];
      const summary = jsonContent.summary || {};
      console.log("Extracted test cases:", testCasesList.length);
      setTestCases(testCasesList);
      setTestSummary(summary);
      return { testCases: testCasesList, summary };
    } catch (error) {
      console.error("Error fetching test cases:", error);
      return { testCases: [], summary: null };
    }
  };

  // 상태 폴링
  React.useEffect(() => {
    if (testState !== "RUNNING" || !runId) return;

    console.log("[Polling] Started with runId:", runId);
    let isPolling = true;
    let pollCount = 0;

    const poll = async () => {
      while (isPolling) {
        pollCount++;
        console.log(`[Polling] Check #${pollCount}`);
        
        const { status, conclusion } = await checkRunStatus(runId);
        console.log(`[Polling] Status: ${status}, Conclusion: ${conclusion}`);
        setPollCount(pollCount);

        if (status === "completed") {
          console.log("[Polling] Run completed! Fetching results...");
          isPolling = false;

          // 결과 수집
          const newResults: TestResult[] = [];

          if (selectedTests.includes("performance")) {
            const scores = await fetchLighthouseResults(runId);
            newResults.push({
              testId: "performance",
              status: "completed",
              data: scores || undefined,
            });
          }

          if (selectedTests.includes("responsive")) {
            const screenshots = await fetchScreenshots(runId);
            newResults.push({
              testId: "responsive",
              status: "completed",
              data: screenshots,
            });
          }

          if (selectedTests.includes("ux")) {
            const uxList = await fetchUXReview(runId);
            newResults.push({
              testId: "ux",
              status: "completed",
              data: uxList,
            });
          }

          if (selectedTests.includes("tc")) {
            const tcData = await fetchTestCases(runId);
            newResults.push({
              testId: "tc",
              status: "completed",
              data: tcData,
            });
            await fetchVideo(runId);
          }

          console.log("[Results] Setting", newResults.length, "results");
          setResults(newResults);
          setTestState("COMPLETED");
          toast.success("실행 완료되었습니다.", {
            description: "테스트 결과를 아래에서 확인하세요.",
            duration: 3000,
          });
          break;
        }

        // 5초 대기
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    };

    poll().catch((error) => {
      console.error("[Polling] Error:", error);
      isPolling = false;
      setTestState("FAILED");
    });

    return () => {
      isPolling = false;
    };
  }, [testState, runId, selectedTests]);

  const handleRunTests = async () => {
    if (!url.trim()) {
      alert("URL을 입력해주세요");
      return;
    }

    if (selectedTests.length === 0) {
      alert("테스트를 선택해주세요");
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    if (!validateUrl(normalizedUrl)) {
      alert("유효한 URL을 입력해주세요");
      return;
    }

    setTestState("RUNNING");
    setResults(selectedTests.map((t) => ({ testId: t, status: "running" })));
    setPollCount(0);

    try {
      const id = await triggerWorkflow(normalizedUrl, selectedTests.join(","));
      console.log("[handleRunTests] Received run ID:", id);
      if (id) {
        console.log("[handleRunTests] Setting runId to:", id);
        setRunId(id);
      } else {
        setTestState("FAILED");
        alert("워크플로우 실패에 실패했습니다");
      }
    } catch (error) {
      setTestState("FAILED");
      alert("테스트 실패 중 오류가 발생했습니다: " + (error as Error).message);
    }
  };

  const isLoading = testState === "RUNNING";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">URL Test Lab</h1>
          <p className="text-gray-600">
            URL 입력만으로 실행하는 웹 QA 테스트 실험실
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                테스트 설정
              </CardTitle>
              <CardDescription>테스트할 URL을 입력하고 항목을 선택하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">🔗 테스트할 URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">https:// 프로토콜 자동 추가됨</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">🧪 실행할 테스트 항목</label>
                <div className="space-y-2">
                  {[
                    { id: "performance", label: "Lighthouse 성능 확인", desc: "성능, 접근성, SEO 점수 분석" },
                    { id: "responsive", label: "Responsive Viewer 화면 확인", desc: "데스크톱, 태블릿, 모바일 화면 캡처" },
                //    { id: "ux", label: "AI UX 리뷰", desc: "사용자 경험 및 내게설 분석" },
                    { id: "tc", label: "시나리오 작성 및 수행", desc: "사용자 시나리오 테스트" },
                  ].map(({ id, label, desc }) => (
                    <label key={id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={selectedTests.includes(id as TestType)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTests([...selectedTests, id as TestType]);
                          } else {
                            setSelectedTests(selectedTests.filter((t) => t !== id));
                          }
                        }}
                        disabled={isLoading}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleRunTests}
                disabled={isLoading || selectedTests.length === 0}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    실행 중... ({pollCount}회 확인 시도)
                  </>
                ) : (
                  "테스트 실행"
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {results.length > 0 && (
              <>
                {results.find((r) => r.testId === "performance") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Lighthouse 성능 확인
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {results.find((r) => r.testId === "performance")?.status === "running" ? (
                        <div className="flex items-center justify-center py-8">
                          <Clock className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                          <span>성능 테스트 실행 중...</span>
                        </div>
                      ) : results.find((r) => r.testId === "performance")?.data ? (
                        <div className="grid grid-cols-4 gap-4">
                          <ScoreCircle
                            score={results.find((r) => r.testId === "performance")?.data?.performance || 0}
                            label="성능"
                          />
                          <ScoreCircle
                            score={results.find((r) => r.testId === "performance")?.data?.accessibility || 0}
                            label="접근성"
                          />
                          <ScoreCircle
                            score={results.find((r) => r.testId === "performance")?.data?.["best-practices"] || 0}
                            label="권장사항"
                          />
                          <ScoreCircle
                            score={results.find((r) => r.testId === "performance")?.data?.seo || 0}
                            label="검색엔진최적화"
                          />
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          결과를 불러올 수 없습니다
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {results.find((r) => r.testId === "responsive") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Responsive Viewer 화면 확인
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {results.find((r) => r.testId === "responsive")?.status === "running" ? (
                        <div className="flex items-center justify-center py-8">
                          <Clock className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                          <span>스크린샷 캡처 중...</span>
                        </div>
                      ) : screenshotBase64.desktop && screenshotBase64.tablet && screenshotBase64.mobile ? (
                        <Tabs defaultValue="desktop" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="desktop">💻 데스크톱 (1920x1080)</TabsTrigger>
                            <TabsTrigger value="tablet">📱 태블릿 (768x1024)</TabsTrigger>
                            <TabsTrigger value="mobile">📲 모바일 (375x667)</TabsTrigger>
                          </TabsList>
                          <TabsContent value="desktop" className="mt-4">
                            {screenshotBase64.desktop ? (
                              <img
                                src={screenshotBase64.desktop}
                                alt="Desktop screenshot"
                                className="w-full border rounded-lg"
                              />
                            ) : (
                              <div className="text-center py-8 text-gray-500">스크린샷 없음</div>
                            )}
                          </TabsContent>
                          <TabsContent value="tablet" className="mt-4">
                            {screenshotBase64.tablet ? (
                              <img
                                src={screenshotBase64.tablet}
                                alt="Tablet screenshot"
                                className="w-full border rounded-lg"
                              />
                            ) : (
                              <div className="text-center py-8 text-gray-500">스크린샷 없음</div>
                            )}
                          </TabsContent>
                          <TabsContent value="mobile" className="mt-4">
                            {screenshotBase64.mobile ? (
                              <img
                                src={screenshotBase64.mobile}
                                alt="Mobile screenshot"
                                className="w-full border rounded-lg"
                              />
                            ) : (
                              <div className="text-center py-8 text-gray-500">스크린샷 없음</div>
                            )}
                          </TabsContent>
                        </Tabs>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          스크린샷을 불러올 수 없습니다
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {results.find((r) => r.testId === "ux") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        AI UX 리뷰
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {results.find((r) => r.testId === "ux")?.status === "running" ? (
                        <div className="flex items-center justify-center py-8">
                          <Clock className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                          <span>UX 리뷰 분석 중...</span>
                        </div>
                      ) : uxReviews && uxReviews.length > 0 ? (
                        <div className="space-y-3">
                          {uxReviews.map((review, idx) => (
                            <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-start gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(review.priority)}`}>
                                  {review.priority}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">[문제점]</p>
                                  <p className="text-sm text-gray-700">{review.issue}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">[문제 원인]</p>
                                  <p className="text-sm text-gray-700">{review.cause}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">[개선 제안]</p>
                                  <p className="text-sm text-gray-700">{review.suggestion}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          UX 리뷰 결과를 불러올 수 없습니다
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {results.find((r) => r.testId === "tc") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        시나리오 작성 및 수행
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {results.find((r) => r.testId === "tc")?.status === "running" ? (
                        <div className="flex items-center justify-center py-8">
                          <Clock className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                          <span>테스트 케이스 실행 중...</span>
                        </div>
                      ) : testCases.length > 0 && testSummary ? (
                        <div className="space-y-6">
                          {videoUrl && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                              <h3 className="text-sm font-semibold text-gray-900 mb-3">Video Recording</h3>
                              <video
                                controls
                                className="w-full rounded-lg bg-black"
                                style={{ maxHeight: "400px" }}
                              >
                                <source src={videoUrl} type="video/webm" />
                              </video>
                            </div>
                          )}
                          <TestCaseTable testCases={testCases} summary={testSummary} />
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          테스트 케이스 결과를 불러올 수 없습니다
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!isLoading && results.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Zap className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center">
                    URL을 입력하고 테스트 항목을 선택한 후 [테스트 실행] 버튼을 클릭하세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
