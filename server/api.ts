import express, { Request, Response } from "express";

const router = express.Router();

/**
 * GitHub Actions 트리거 및 상태 조회 API
 *
 * 설정 필요:
 * - GITHUB_TOKEN: GitHub 개인 액세스 토큰
 * - GITHUB_REPO_OWNER: 저장소 소유자
 * - GITHUB_REPO_NAME: 저장소 이름
 * - GITHUB_WORKFLOW_ID: 워크플로우 파일명 또는 ID (예: qa-tests.yml)
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || "your-org";
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || "qa-automation";
const GITHUB_WORKFLOW_ID = process.env.GITHUB_WORKFLOW_ID || "qa-tests.yml";

interface RunTestRequest {
  targetUrl: string;
  tests: string[];
}

interface TestResult {
  [key: string]: {
    status: "pending" | "running" | "completed" | "failed";
    summary?: string;
    details?: string;
    link?: string;
  };
}

/**
 * POST /api/run-test
 * GitHub Actions 워크플로우 트리거
 */
router.post("/run-test", async (req: Request, res: Response) => {
  try {
    const { targetUrl, tests } = req.body as RunTestRequest;

    if (!targetUrl || !tests || tests.length === 0) {
      return res.status(400).json({ error: "targetUrl과 tests는 필수입니다." });
    }

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ error: "GitHub 토큰이 설정되지 않았습니다." });
    }

    // GitHub Actions workflow_dispatch 호출
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/${GITHUB_WORKFLOW_ID}/dispatches`,
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
            tests: tests.join(","),
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("GitHub API Error:", error);
      return res.status(response.status).json({ error: "워크플로우 트리거 실패" });
    }

    // 최근 실행 ID 조회
    const runsResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/runs?per_page=1`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!runsResponse.ok) {
      return res.status(500).json({ error: "실행 ID 조회 실패" });
    }

    const runsData = await runsResponse.json();
    const runId = runsData.workflow_runs?.[0]?.id;

    if (!runId) {
      return res.status(500).json({ error: "실행 ID를 찾을 수 없습니다." });
    }

    res.json({
      success: true,
      runId: runId.toString(),
      message: "테스트가 시작되었습니다.",
    });
  } catch (error) {
    console.error("Error in /api/run-test:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

/**
 * GET /api/test-status/:runId
 * GitHub Actions 실행 상태 및 결과 조회
 */
router.get("/test-status/:runId", async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ error: "GitHub 토큰이 설정되지 않았습니다." });
    }

    // 워크플로우 실행 상태 조회
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/runs/${runId}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "상태 조회 실패" });
    }

    const runData = await response.json();
    const status = runData.status === "completed" ? "completed" : "running";
    const conclusion = runData.conclusion; // success, failure, neutral, cancelled

    // 결과 데이터 (실제 구현에서는 artifacts에서 가져옴)
    const results: TestResult = {
      performance: {
        status: status === "completed" ? "completed" : "running",
        summary: "Lighthouse 점수: 82점 (개선 필요: 3건)",
        details: "• 성능: 85점\n• 접근성: 90점\n• SEO: 100점",
        link: `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/runs/${runId}`,
      },
      responsive: {
        status: status === "completed" ? "completed" : "running",
        summary: "데스크톱 / 태블릿 / 모바일 캡처 완료",
        details: "• 데스크톱: 1920x1080\n• 태블릿: 768x1024\n• 모바일: 375x667",
        link: `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/runs/${runId}`,
      },
      ux: {
        status: status === "completed" ? "completed" : "running",
        summary: "AI UX 리뷰 완료",
        details: "• CTA 가시성 낮음\n• 폰트 대비 부족\n• 레이아웃 일관성 우수",
        link: `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/runs/${runId}`,
      },
      tc: {
        status: status === "completed" ? "completed" : "running",
        summary: "테스트 케이스: 통과 12건, 실패 1건 (성공률: 92%)",
        details: "• 로그인 기능: 통과\n• 검색 기능: 통과\n• 결제 기능: 실패",
        link: `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/runs/${runId}`,
      },
    };

    res.json({
      status: status,
      conclusion: conclusion,
      results: results,
      runUrl: `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/runs/${runId}`,
    });
  } catch (error) {
    console.error("Error in /api/test-status:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

export default router;
