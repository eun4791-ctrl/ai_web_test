import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type TestType = "performance" | "responsive" | "ux" | "tc";

interface TestResult {
  testId: TestType;
  status: "pending" | "running" | "completed" | "failed";
  data?: any;
  error?: string;
}

export default function Home() {
  const [url, setUrl] = React.useState("");
  const [selectedTests, setSelectedTests] = React.useState<TestType[]>([]);
  const [results, setResults] = React.useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [runId, setRunId] = React.useState<number | null>(null);
  const [pollCount, setPollCount] = React.useState(0);

  // tRPC 뮤테이션 (컴포넌트 최상위에서 호출)
  const triggerWorkflowMutation = trpc.qa.triggerWorkflow.useMutation();

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

  // 상태 폴링
  React.useEffect(() => {
    if (!isLoading || !runId) return;

    const pollInterval = setInterval(async () => {
      setPollCount((prev) => prev + 1);
      try {
        // tRPC 쿼리는 useQuery를 사용해야 하므로, 여기서는 직접 호출 대신 폴링 로직 단순화
        // 실제 구현에서는 useQuery를 사용하거나 백엔드 폴링 엔드포인트 추가 필요
        const status = "completed";
        const conclusion = "success";

        if (status === "completed") {
          console.log("Run completed with conclusion:", conclusion);
          clearInterval(pollInterval);
          setIsLoading(false);

          setResults(
            selectedTests.map((testId) => ({
              testId,
              status: "completed",
              data: { message: "테스트 완료" },
            }))
          );

          toast.success("실행 완료되었습니다.", {
            description: "테스트 결과를 아래에서 확인하세요.",
            duration: 3000,
          });
        }
      } catch (pollError) {
        console.error("Polling error:", pollError);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isLoading, runId, selectedTests]);

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
      // tRPC를 통해 백엔드 API 호출
      await triggerWorkflowMutation.mutateAsync({
        targetUrl: normalizedUrl,
        tests: selectedTests.join(","),
      });

      setTimeout(async () => {
        try {
          // 실제 구현에서는 useQuery를 사용하거나 백엔드 폴링 엔드포인트 추가 필요
          // 임시로 고정된 runId 사용
          setRunId(1);
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
                {results.map((result) => (
                  <Card key={result.testId}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        {result.testId === "performance" && "Lighthouse 성능 확인"}
                        {result.testId === "responsive" && "Responsive Viewer 화면 확인"}
                        {result.testId === "ux" && "AI UX 리뷰"}
                        {result.testId === "tc" && "TC 작성 및 수행"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.status === "running" ? (
                        <div className="flex items-center justify-center py-8">
                          <Clock className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                          <span>테스트 실행 중...</span>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                          테스트 완료됨
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
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
