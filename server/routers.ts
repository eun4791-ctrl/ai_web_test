import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { ENV } from "./_core/env";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  qa: router({
    triggerWorkflow: publicProcedure
      .input(z.object({
        targetUrl: z.string().url(),
        tests: z.string(),
      }))
      .mutation(async ({ input }) => {
        const GITHUB_REPO = "eun4791-ctrl/ai_web_test";

        if (!ENV.githubToken) {
          throw new Error("GitHub token not configured");
        }

        try {
          const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/qa-tests.yml/dispatches`,
            {
              method: "POST",
              headers: {
                Authorization: `token ${ENV.githubToken}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.github.v3+json",
              },
              body: JSON.stringify({
                ref: "main",
                inputs: {
                  target_url: input.targetUrl,
                  tests: input.tests,
                },
              }),
            }
          );

          if (!response.ok) {
            const error = await response.text();
            console.error("Workflow trigger failed:", response.status, error);
            throw new Error(`Failed to trigger workflow: ${response.status}`);
          }

          return { success: true };
        } catch (error) {
          console.error("Trigger error:", error);
          throw error;
        }
      }),

    getLatestRun: publicProcedure.query(async () => {
      // Use ENV.githubToken instead
      const GITHUB_REPO = "eun4791-ctrl/ai_web_test";

      if (!ENV.githubToken) {
        throw new Error("GitHub token not configured");
      }

      try {
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=1`,
          {
            headers: {
              Authorization: `token ${ENV.githubToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch runs");

        const data = await response.json();
        const latestRun = data.workflow_runs?.[0];
        return { id: latestRun?.id || null };
      } catch (error) {
        console.error("Error fetching run ID:", error);
        throw error;
      }
    }),

    checkRunStatus: publicProcedure
      .input(z.object({ runId: z.number() }))
      .query(async ({ input }) => {
        // Use ENV.githubToken instead
        const GITHUB_REPO = "eun4791-ctrl/ai_web_test";

        if (!ENV.githubToken) {
          throw new Error("GitHub token not configured");
        }

        try {
          const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${input.runId}`,
            {
              headers: {
                Authorization: `token ${ENV.githubToken}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          if (!response.ok) throw new Error("Failed to fetch run status");

          const data = await response.json();
          return { status: data.status, conclusion: data.conclusion };
        } catch (error) {
          console.error("Error checking status:", error);
          throw error;
        }
      }),

    getArtifacts: publicProcedure
      .input(z.object({ runId: z.number() }))
      .query(async ({ input }) => {
        // Use ENV.githubToken instead
        const GITHUB_REPO = "eun4791-ctrl/ai_web_test";

        if (!ENV.githubToken) {
          throw new Error("GitHub token not configured");
        }

        try {
          const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${input.runId}/artifacts`,
            {
              headers: {
                Authorization: `token ${ENV.githubToken}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          if (!response.ok) throw new Error("Failed to fetch artifacts");

          const data = await response.json();
          return { artifacts: data.artifacts || [] };
        } catch (error) {
          console.error("Error fetching artifacts:", error);
          throw error;
        }
      }),

    downloadArtifact: publicProcedure
      .input(z.object({ 
        runId: z.number(),
        artifactName: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Use ENV.githubToken instead
        const GITHUB_REPO = "eun4791-ctrl/ai_web_test";

        if (!ENV.githubToken) {
          throw new Error("GitHub token not configured");
        }

        try {
          // Artifacts 목록 조회
          const artifactsResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${input.runId}/artifacts`,
            {
              headers: {
                Authorization: `token ${ENV.githubToken}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          if (!artifactsResponse.ok) throw new Error("Failed to fetch artifacts");

          const artifactsData = await artifactsResponse.json();
          const artifact = artifactsData.artifacts?.find((a: any) => a.name === input.artifactName);

          if (!artifact) {
            return { success: false, data: null, error: `Artifact ${input.artifactName} not found` };
          }

          // Artifact 다운로드
          const downloadResponse = await fetch(artifact.archive_download_url, {
            headers: {
              Authorization: `token ${ENV.githubToken}`,
            },
          });

          if (!downloadResponse.ok) throw new Error("Failed to download artifact");

          const arrayBuffer = await downloadResponse.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');

          return { success: true, data: base64, error: null };
        } catch (error) {
          console.error("Error downloading artifact:", error);
          return { success: false, data: null, error: (error as Error).message };
        }
      }),

    parseArtifactJson: publicProcedure
      .input(z.object({
        base64Data: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          // JSZip을 사용하지 않고 간단한 JSON 파싱
          // base64 데이터를 Buffer로 변환
          const buffer = Buffer.from(input.base64Data, 'base64');
          
          // ZIP 파일 헤더 확인
          if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
            // ZIP 파일이면 동적으로 JSZip 로드
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            await zip.loadAsync(buffer);
            
            // JSON 파일 찾기
            let jsonContent: any = null;
            for (const [filename, file] of Object.entries(zip.files)) {
              if (filename.includes(input.fileName)) {
                const content = await (file as any).async("text");
                jsonContent = JSON.parse(content);
                break;
              }
            }
            
            return { success: true, data: jsonContent, error: null };
          } else {
            // 직접 JSON 파싱 시도
            const text = buffer.toString('utf-8');
            const data = JSON.parse(text);
            return { success: true, data, error: null };
          }
        } catch (error) {
          console.error("Error parsing artifact:", error);
          return { success: false, data: null, error: (error as Error).message };
        }
      }),

    parseScreenshots: publicProcedure
      .input(z.object({
        base64Data: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const buffer = Buffer.from(input.base64Data, 'base64');
          
          // ZIP 파일 헤더 확인
          if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            await zip.loadAsync(buffer);
            
            const screenshots: any = {};
            
            for (const [filename, file] of Object.entries(zip.files)) {
              if (filename.includes('.png')) {
                const arrayBuf = await (file as any).async("arraybuffer");
                const base64 = Buffer.from(arrayBuf).toString('base64');
                const dataUrl = `data:image/png;base64,${base64}`;
                
                if (filename.includes('desktop')) {
                  screenshots.desktop = dataUrl;
                } else if (filename.includes('tablet')) {
                  screenshots.tablet = dataUrl;
                } else if (filename.includes('mobile')) {
                  screenshots.mobile = dataUrl;
                }
              }
            }
            
            return { success: true, data: screenshots, error: null };
          }
          
          return { success: false, data: null, error: "Not a valid ZIP file" };
        } catch (error) {
          console.error("Error parsing screenshots:", error);
          return { success: false, data: null, error: (error as Error).message };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
