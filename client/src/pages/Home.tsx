import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import JSZip from "jszip";

type TestType = "performance" | "responsive" | "ux" | "tc";

interface LighthouseScore {
  performance: number;
  accessibility: number;
  "best-practices": number;
  seo: number;
}

interface TestResult {
  testId: TestType;
  status: "pending" | "running" | "completed" | "failed";
  data?: any;
  error?: string;
}

interface ResponsiveScreenshots {
  desktop?: string;
  tablet?: string;
  mobile?: string;
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

// Lighthouse 점수 원형 차트
const ScoreCircle = ({ score, label }: { score: number; label: string }) => {
  // NaN 체크
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

export default function Home() {
  const [url, setUrl] = React.useState("");
  const [selectedTests, setSelectedTests] = React.useState<TestType[]>([]);
  const [results, setResults] = React.useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [runId, setRunId] = React.useState<number | null>(null);
  const [pollCount, setPollCount] = React.useState(0);
  const [screenshots, setScreenshots] = React.useState<ResponsiveScreenshots>({});
  const [screenshotBase64, setScreenshotBase64] = React.useState<ResponsiveScreenshots>({});

  const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  const GITHUB_REPO = "eun4791-ctrl/ai_web_test";

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

  // GitHub API: workflow 트리거
  const triggerWorkflow = async (targetUrl: string, tests: string): Promise<number | null> => {
    try {
      console.log("Triggering workflow with URL:", targetUrl, "Tests:", tests);

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/qa-tests.yml/dispatches`,
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
      return 1; // 즉시 반환
    } catch (error) {
      console.error("Trigger error:", error);
      throw error;
    }
  };

  // GitHub API: 최신 run ID 조회
  const getLatestRunId = async (): Promise<number | null> => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=1`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch runs");

      const data = await response.json();
      const latestRun = data.workflow_runs?.[0];
      console.log("Latest run:", latestRun?.id, "Status:", latestRun?.status);
      return latestRun?.id || null;
    } catch (error) {
      console.error("Error fetching run ID:", error);
      return null;
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
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      });

      if (!zipResponse.ok) throw new Error("Failed to download artifact");

      const arrayBuffer = await zipResponse.arrayBuffer();
      console.log("Downloaded ZIP file, size:", arrayBuffer.byteLength);

      // JSZip으로 ZIP 파일 파싱
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);

      // lighthouse-report.json 찾기
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

      console.log("Full Lighthouse JSON structure:", JSON.stringify(jsonContent, null, 2).substring(0, 500));

      // Lighthouse 점수 추출
      let lighthouseScores: LighthouseScore = {
        performance: 0,
        accessibility: 0,
        "best-practices": 0,
        seo: 0,
      };

      // v11 형식: categories 객체 내에 각 카테고리의 score 필드
      if (jsonContent.categories) {
        const categories = jsonContent.categories;
        lighthouseScores.performance = Math.round((categories.performance?.score || 0) * 100);
        lighthouseScores.accessibility = Math.round((categories.accessibility?.score || 0) * 100);
        lighthouseScores["best-practices"] = Math.round((categories["best-practices"]?.score || 0) * 100);
        lighthouseScores.seo = Math.round((categories.seo?.score || 0) * 100);
      }
      // v10 이하 형식: scores 객체 직접 사용
      else if (jsonContent.scores) {
        const scores = jsonContent.scores;
        lighthouseScores.performance = Math.round((scores.performance || 0) * 100);
        lighthouseScores.accessibility = Math.round((scores.accessibility || 0) * 100);
        lighthouseScores["best-practices"] = Math.round((scores["best-practices"] || 0) * 100);
        lighthouseScores.seo = Math.round((scores.seo || 0) * 100);
      }

      // 유효성 검증
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
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
      });

      if (!zipResponse.ok) throw new Error("Failed to download screenshot artifact");

      const arrayBuffer = await zipResponse.arrayBuffer();
      console.log("Downloaded screenshot ZIP, size:", arrayBuffer.byteLength);

      // JSZip으로 ZIP 파일 파싱
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);

      const screenshots: ResponsiveScreenshots = {};
      const base64Screenshots: ResponsiveScreenshots = {};

      // 각 스크린샷 파일 추출
      for (const [filename, file] of Object.entries(zip.files)) {
        console.log("Screenshot file:", filename);
        if (filename.includes("desktop.png")) {
              const blob = await (file as any).async("blob");
              const url = URL.createObjectURL(blob);
              screenshots.desktop = url;
              const arrayBuf = await (file as any).async("arraybuffer");
              const uint8Array = new Uint8Array(arrayBuf);
              let binaryString = "";
              for (let i = 0; i < uint8Array.length; i++) {
                binaryString += String.fromCharCode(uint8Array[i]);
              }
              base64Screenshots.desktop = "data:image/png;base64," + btoa(binaryString);
        } else if (filename.includes("tablet.png")) {
              const blob = await (file as any).async("blob");
              const url = URL.createObjectURL(blob);
              screenshots.tablet = url;
              const arrayBuf = await (file as any).async("arraybuffer");
              const uint8Array2 = new Uint8Array(arrayBuf);
              let binaryString2 = "";
              for (let i = 0; i < uint8Array2.length; i++) {
                binaryString2 += String.fromCharCode(uint8Array2[i]);
              }
              base64Screenshots.tablet = "data:image/png;base64," + btoa(binaryString2);
        } else if (filename.includes("mobile.png")) {
              const blob = await (file as any).async("blob");
              const url = URL.createObjectURL(blob);
              screenshots.mobile = url;
              const arrayBuf = await (file as any).async("arraybuffer");
              const uint8Array3 = new Uint8Array(arrayBuf);
              let binaryString3 = "";
              for (let i = 0; i < uint8Array3.length; i++) {
                binaryString3 += String.fromCharCode(uint8Array3[i]);
              }
              base64Screenshots.mobile = "data:image/png;base64," + btoa(binaryString3);
        }
      }

      console.log("Extracted screenshots:", Object.keys(screenshots));
      setScreenshots(screenshots);
      setScreenshotBase64(base64Screenshots);
      return screenshots;
    } catch (error) {
      console.error("Error fetching screenshots:", error);
      return {};
    }
  };

  // 상태 폴링
  React.useEffect(() => {
    if (!isLoading || !runId) return;

    const pollInterval = setInterval(async () => {
      setPollCount((prev) => prev + 1);
      const { status, conclusion } = await checkRunStatus(runId);

      if (status === "completed") {
        console.log("Run completed with conclusion:", conclusion);
        clearInterval(pollInterval);
        setIsLoading(false);

        // 결과 조회
        let lighthouseScores: LighthouseScore | undefined;
        if (selectedTests.includes("performance")) {
          const scores = await fetchLighthouseResults(runId);
          lighthouseScores = scores || undefined;
        }

        let responsiveScreenshots: ResponsiveScreenshots = {};
        if (selectedTests.includes("responsive")) {
          responsiveScreenshots = await fetchScreenshots(runId);
        }

        // 결과 업데이트
        setResults(
          selectedTests.map((testId) => {
            if (testId === "performance") {
              return {
                testId,
                status: "completed",
                data: lighthouseScores,
              };
            } else if (testId === "responsive") {
              return {
                testId,
                status: "completed",
                data: responsiveScreenshots,
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
      }
    }, 3000); // 3초마다 폴링

    return () => clearInterval(pollInterval);
  }, [isLoading, runId, selectedTests]);

  const handleRunTests = async () => {
    // 검증
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
      // Workflow 트리거
      await triggerWorkflow(normalizedUrl, selectedTests.join(","));

      // 최신 run ID 조회 (2초 대기 후)
      setTimeout(async () => {
        const id = await getLatestRunId();
        if (id) {
          setRunId(id);
        } else {
          setIsLoading(false);
          alert("워크플로우 실행에 실패했습니다");
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
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">QA 자동화 대시보드</h1>
          <p className="text-gray-600">
            웹사이트 품질을 한 번에 검증하세요. 성능, 반응형, UX, 기능 테스트를 자동으로 실행합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 입력 영역 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                테스트 설정
              </CardTitle>
              <CardDescription>테스트할 URL과 항목을 선택하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL 입력 */}
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

              {/* 테스트 선택 */}
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

              {/* 실행 버튼 */}
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

          {/* 결과 영역 */}
          <div className="lg:col-span-2 space-y-4">
            {results.length > 0 && (
              <>
                {/* Lighthouse 성능 */}
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

                {/* Responsive Viewer */}
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
                      ) : screenshotBase64.desktop || screenshotBase64.tablet || screenshotBase64.mobile ? (
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

                {/* UX 리뷰 */}
                {results.find((r) => r.testId === "ux") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        AI UX 리뷰
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">UX 리뷰 결과가 준비 중입니다</p>
                    </CardContent>
                  </Card>
                )}

                {/* TC 작성 및 수행 */}
                {results.find((r) => r.testId === "tc") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        TC 작성 및 수행
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">테스트 케이스 결과가 준비 중입니다</p>
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
