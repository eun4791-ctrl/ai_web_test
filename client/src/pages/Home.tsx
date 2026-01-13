import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type TestType = "performance" | "responsive" | "ux" | "tc";

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
  const [isLoading, setIsLoading] = React.useState(false);
  const [runId, setRunId] = React.useState<number | null>(null);
  const [pollCount, setPollCount] = React.useState(0);

  // tRPC 쿼리/뮤테이션
  const triggerWorkflowMutation = trpc.qa.triggerWorkflow.useMutation();
  const getLatestRunQuery = trpc.qa.getLatestRun.useQuery(undefined, { enabled: false });
  const checkRunStatusQuery = trpc.qa.checkRunStatus.useQuery({ runId: runId || 0 }, { enabled: false });
  const getArtifactsQuery = trpc.qa.getArtifacts.useQuery({ runId: runId || 0 }, { enabled: false });
  const downloadArtifactMutation = trpc.qa.downloadArtifact.useMutation();
  const parseArtifactJsonMutation = trpc.qa.parseArtifactJson.useMutation();

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

  // 결과 다운로드 및 파싱
  const downloadAndParseArtifact = async (artifactName: string, fileName: string) => {
    if (!runId) return null;
    try {
      const downloadResult = await downloadArtifactMutation.mutateAsync({
        runId,
        artifactName,
      });

      if (!downloadResult.success || !downloadResult.data) {
        console.error(`Failed to download ${artifactName}:`, downloadResult.error);
        return null;
      }

      const parseResult = await parseArtifactJsonMutation.mutateAsync({
        base64Data: downloadResult.data,
        fileName,
      });

      if (!parseResult.success) {
        console.error(`Failed to parse ${artifactName}:`, parseResult.error);
        return null;
      }

      return parseResult.data;
    } catch (error) {
      console.error(`Error processing ${artifactName}:`, error);
      return null;
    }
  };

  // 상태 폴링
  React.useEffect(() => {
    if (!isLoading || !runId) return;

    const pollInterval = setInterval(async () => {
      setPollCount((prev) => prev + 1);
      try {
        const statusResult = await checkRunStatusQuery.refetch();
        const { status, conclusion } = statusResult.data || {};

        if (status === "completed") {
          console.log("Run completed with conclusion:", conclusion);
          clearInterval(pollInterval);

          // 모든 결과 다운로드 및 파싱
          const lighthouseData = selectedTests.includes("performance")
            ? await downloadAndParseArtifact("lighthouse-report", "lighthouse-report.json")
            : null;

          const screenshotData = selectedTests.includes("responsive")
            ? await downloadAndParseArtifact("responsive-screenshots", ".png")
            : null;

          const uxReviewData = selectedTests.includes("ux")
            ? await downloadAndParseArtifact("ux-review", "ux-review.json")
            : null;

          const tcData = selectedTests.includes("tc")
            ? await downloadAndParseArtifact("test-cases-report", "tc-report.json")
            : null;

          // 결과 업데이트
          setResults(
            selectedTests.map((testId) => {
              if (testId === "performance" && lighthouseData) {
                const categories = lighthouseData.categories || {};
                return {
                  testId,
                  status: "completed",
                  data: {
                    performance: Math.round((categories.performance?.score || 0) * 100),
                    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
                    "best-practices": Math.round((categories["best-practices"]?.score || 0) * 100),
                    seo: Math.round((categories.seo?.score || 0) * 100),
                  },
                };
              } else if (testId === "responsive" && screenshotData) {
                return {
                  testId,
                  status: "completed",
                  data: screenshotData,
                };
              } else if (testId === "ux" && uxReviewData) {
                return {
                  testId,
                  status: "completed",
                  data: uxReviewData.reviews || [],
                };
              } else if (testId === "tc" && tcData) {
                return {
                  testId,
                  status: "completed",
                  data: {
                    testCases: tcData.testCases || [],
                    summary: tcData.summary || {},
                  },
                };
              } else {
                return {
                  testId,
                  status: "completed",
                  data: {},
                };
              }
            })
          );

          setIsLoading(false);
          toast.success("실행 완료되었습니다.", {
            description: "테스트 결과를 아래에서 확인하세요.",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isLoading, runId, selectedTests, checkRunStatusQuery, downloadArtifactMutation, parseArtifactJsonMutation]);

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

    setIsLoading(true);
    setResults(selectedTests.map((t) => ({ testId: t, status: "running" })));
    setPollCount(0);

    try {
      // 워크플로우 트리거
      await triggerWorkflowMutation.mutateAsync({
        targetUrl: normalizedUrl,
        tests: selectedTests.join(","),
      });

      // 최신 Run ID 조회
      setTimeout(async () => {
        try {
          const latestRunResult = await getLatestRunQuery.refetch();
          if (latestRunResult.data?.id) {
            setRunId(latestRunResult.data.id);
          } else {
            setIsLoading(false);
            alert("워크플로우 실행에 실패했습니다");
          }
        } catch (error) {
          setIsLoading(false);
          console.error("Latest run fetch error:", error);
        }
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      alert("테스트 실행 중 오류가 발생했습니다: " + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">QA 자동화 대시보드</h1>
          <p className="text-gray-600">
            웹사이트 품질을 한 번에 검증하세요. 성능, 반응형, UX, 기능 테스트를 자동으로 실행합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                테스트 설정
              </CardTitle>
              <CardDescription>테스트할 URL과 항목을 선택하세요</CardDescription>
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
                <p className="text-xs text-gray-500 mt-1">https:// 프로토콜 자동 추가됩니다</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">🧪 실행할 테스트</label>
                <div className="space-y-2">
                  {[
                    { id: "performance", label: "Lighthouse 성능 확인", desc: "웹사이트 성능, 급근성, SEO 점수 분석" },
                    { id: "responsive", label: "Responsive Viewer 화면 확인", desc: "데스크톱, 태블릿, 모바일 화면 캡처" },
                    { id: "ux", label: "AI UX 리뷰", desc: "사용자 경험 및 내게설 분석" },
                    { id: "tc", label: "TC 작성 및 수행", desc: "기능 테스트 케이스 자동 실행" },
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
                    실행 중... ({pollCount}초)
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
                      ) : results.find((r) => r.testId === "responsive")?.data ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>스크린샷 데이터가 준비 중입니다</p>
                        </div>
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
                      ) : results.find((r) => r.testId === "ux")?.data && results.find((r) => r.testId === "ux")?.data.length > 0 ? (
                        <div className="space-y-3">
                          {results.find((r) => r.testId === "ux")?.data.map((review: UXReview, idx: number) => (
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
                        TC 작성 및 수행
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {results.find((r) => r.testId === "tc")?.status === "running" ? (
                        <div className="flex items-center justify-center py-8">
                          <Clock className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                          <span>테스트 케이스 실행 중...</span>
                        </div>
                      ) : results.find((r) => r.testId === "tc")?.data?.testCases && results.find((r) => r.testId === "tc")?.data.testCases.length > 0 ? (
                        <TestCaseTable 
                          testCases={results.find((r) => r.testId === "tc")?.data.testCases}
                          summary={results.find((r) => r.testId === "tc")?.data.summary}
                        />
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
                    URL을 입력하고 테스트를 선택한 후 "테스트 실행" 버튼을 클릭하세요
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
