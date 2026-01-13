import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Smartphone,
  Brain,
  TestTube,
  ExternalLink,
  Download,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Design Philosophy: Modern Minimalism with Purposeful Clarity
 * - Clarity First: All UI elements communicate user intent clearly
 * - Progressive Disclosure: Essential info shown immediately, details on demand
 * - Human-Centric: Designed for non-developers
 * - Functional Beauty: Beauty emerges from function
 *
 * Color Palette:
 * - Primary Blue: #3B82F6 (Confidence & Trust)
 * - Success Green: #10B981 (Pass/Success)
 * - Warning Amber: #F59E0B (Attention Needed)
 * - Error Red: #EF4444 (Failure)
 * - Neutral Gray: #6B7280 (Secondary Info)
 */

type TestType = "performance" | "responsive" | "ux" | "tc";
type ExecutionStatus = "idle" | "running" | "completed" | "failed";
type TestStatus = "pending" | "running" | "completed" | "failed";

interface TestResult {
  type: TestType;
  status: TestStatus;
  title: string;
  icon: React.ReactNode;
  summary?: string;
  details?: string;
  link?: string;
}

const TEST_OPTIONS: Array<{ id: TestType; label: string; description: string }> = [
  {
    id: "performance",
    label: "Lighthouse 성능 확인",
    description: "웹사이트 성능, 접근성, SEO 점수 분석",
  },
  {
    id: "responsive",
    label: "Responsive Viewer 화면 확인",
    description: "데스크톱, 태블릿, 모바일 화면 캡처",
  },
  {
    id: "ux",
    label: "AI UX 리뷰",
    description: "사용자 경험 및 UI 개선점 분석",
  },
  {
    id: "tc",
    label: "TC 작성 및 수행",
    description: "기능 테스트 케이스 자동 생성 및 실행",
  },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [selectedTests, setSelectedTests] = useState<TestType[]>([]);
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState("");
  const [runId, setRunId] = useState<string | null>(null);

  // URL 유효성 검증
  const isValidUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString.startsWith("http") ? urlString : `https://${urlString}`);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  // 테스트 선택 토글
  const toggleTest = (testId: TestType) => {
    setSelectedTests((prev) =>
      prev.includes(testId) ? prev.filter((t) => t !== testId) : [...prev, testId]
    );
  };

  // 테스트 실행
  const handleRunTests = async () => {
    setError("");

    // 유효성 검증
    if (!url.trim()) {
      setError("테스트할 URL을 입력해주세요.");
      return;
    }

    if (!isValidUrl(url)) {
      setError("유효한 URL 형식이 아닙니다. (예: https://example.com)");
      return;
    }

    if (selectedTests.length === 0) {
      setError("최소 1개 이상의 테스트를 선택해주세요.");
      return;
    }

    setStatus("running");
    setResults(
      selectedTests.map((testId) => ({
        type: testId,
        status: "pending",
        title: TEST_OPTIONS.find((t) => t.id === testId)?.label || "",
        icon: getTestIcon(testId),
      }))
    );

    try {
      // API 호출로 GitHub Actions 트리거
      const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
      const response = await fetch("/api/run-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: normalizedUrl,
          tests: selectedTests,
        }),
      });

      if (!response.ok) {
        throw new Error("테스트 실행 요청 실패");
      }

      const data = await response.json();
      setRunId(data.runId);

      // 상태 폴링 시작
      pollTestStatus(data.runId);
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "테스트 실행 중 오류가 발생했습니다.");
    }
  };

  // GitHub Actions 상태 폴링
  const pollTestStatus = async (runId: string) => {
    const maxAttempts = 60; // 5분 (5초 * 60)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/test-status/${runId}`);
        if (!response.ok) throw new Error("상태 조회 실패");

        const data = await response.json();

        // 결과 업데이트
        if (data.results) {
          setResults(
            selectedTests.map((testId) => ({
              type: testId,
              status: data.results[testId]?.status || "pending",
              title: TEST_OPTIONS.find((t) => t.id === testId)?.label || "",
              icon: getTestIcon(testId),
              summary: data.results[testId]?.summary,
              details: data.results[testId]?.details,
              link: data.results[testId]?.link,
            }))
          );
        }

        // 완료 확인
        if (data.status === "completed" || data.status === "failed") {
          setStatus(data.status === "completed" ? "completed" : "failed");
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000); // 5초마다 폴링
        } else {
          setStatus("failed");
          setError("테스트 실행 시간 초과");
        }
      } catch (err) {
        setStatus("failed");
        setError(err instanceof Error ? err.message : "상태 조회 중 오류 발생");
      }
    };

    poll();
  };

  // 테스트 아이콘 반환
  const getTestIcon = (testId: TestType) => {
    const iconProps = { className: "w-5 h-5" };
    switch (testId) {
      case "performance":
        return <Zap {...iconProps} />;
      case "responsive":
        return <Smartphone {...iconProps} />;
      case "ux":
        return <Brain {...iconProps} />;
      case "tc":
        return <TestTube {...iconProps} />;
    }
  };

  // 상태 배지 반환
  const getStatusBadge = (testStatus: TestStatus) => {
    switch (testStatus) {
      case "pending":
        return <Clock className="w-4 h-4 text-gray-400" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container py-12">
        {/* 헤더 */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">QA 자동화 대시보드</h1>
          <p className="text-lg text-gray-600">
            웹사이트 품질을 한 번에 검증하세요. 성능, 반응형, UX, 기능 테스트를 자동으로 실행합니다.
          </p>
        </div>

        {/* 🟦 A. 입력 영역 (Trigger Zone) */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              테스트 설정
            </CardTitle>
            <CardDescription>테스트할 URL과 항목을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* URL 입력 필드 */}
            <div className="mb-6">
              <Label htmlFor="url" className="text-base font-semibold mb-2 block">
                🔗 테스트할 URL
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={status === "running"}
                className="text-base h-10"
              />
              <p className="text-sm text-gray-500 mt-2">
                https:// 프로토콜이 자동으로 추가됩니다.
              </p>
            </div>

            {/* 테스트 유형 선택 */}
            <div className="mb-8">
              <Label className="text-base font-semibold mb-4 block">🧪 실행할 테스트</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEST_OPTIONS.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => toggleTest(test.id)}
                  >
                    <Checkbox
                      id={test.id}
                      checked={selectedTests.includes(test.id)}
                      onCheckedChange={() => toggleTest(test.id)}
                      disabled={status === "running"}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={test.id}
                        className="font-medium text-gray-900 cursor-pointer block"
                      >
                        {test.label}
                      </Label>
                      <p className="text-sm text-gray-600">{test.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* 실행 버튼 */}
            <Button
              onClick={handleRunTests}
              disabled={status === "running" || selectedTests.length === 0}
              size="lg"
              className="w-full h-12 text-base font-semibold"
            >
              {status === "running" ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  테스트 실행 중...
                </>
              ) : (
                "테스트 실행"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 🟦 B. 실행 상태 영역 (Status Zone) */}
        {status !== "idle" && (
          <Card className="mb-8 shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b">
              <CardTitle className="flex items-center gap-2">
                {status === "running" ? (
                  <>
                    <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                    테스트 실행 중
                  </>
                ) : status === "completed" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    테스트 완료
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    테스트 실패
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {results.map((result) => (
                  <div key={result.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-600">{result.icon}</div>
                      <span className="font-medium text-gray-900">{result.title}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 🟦 C. 결과 요약 영역 (Summary Zone) - 핵심 */}
        {status === "completed" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">테스트 결과 요약</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((result) => (
                <Card key={result.type} className="shadow-md border-0 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-blue-600">{result.icon}</div>
                        <div>
                          <CardTitle className="text-lg">{result.title}</CardTitle>
                        </div>
                      </div>
                      {result.status === "completed" && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.summary && (
                      <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                        {result.summary}
                      </div>
                    )}

                    {result.details && (
                      <div className="text-sm text-gray-600 space-y-2">
                        {result.details.split("\n").map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    )}

                    {result.link && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(result.link, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        상세 리포트 보기
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 재실행 버튼 */}
            <Button
              onClick={() => {
                setStatus("idle");
                setResults([]);
                setError("");
              }}
              variant="outline"
              size="lg"
              className="w-full h-12"
            >
              다시 테스트하기
            </Button>
          </div>
        )}

        {/* 실패 상태 */}
        {status === "failed" && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              테스트 실행 중 오류가 발생했습니다. 다시 시도해주세요.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
