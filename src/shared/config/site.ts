export const siteConfig = {
  name: "My App",
  description: "Next.js 16 with FSD architecture",
  url: "http://localhost:3000",
} as const;

export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
} as const;
