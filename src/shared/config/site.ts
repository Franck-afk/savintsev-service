export const siteConfig = {
  name: "Шинный Мастер",
  description: "Профессиональный шиномонтаж, хранение шин и ремонт дисков",
  url: "http://localhost:3000",
} as const;

export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
} as const;
