import dotenv from "dotenv";
dotenv.config();

// GitHub 토큰이 없으면 경고
if (!process.env.GITHUB_TOKEN && process.env.NODE_ENV === "production") {
  console.warn("[WARNING] GITHUB_TOKEN environment variable is not set");
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  githubToken: process.env.GITHUB_TOKEN ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o",
  mcpHeadless: process.env.MCP_HEADLESS === "false",
};
