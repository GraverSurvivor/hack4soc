import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysSince(date: Date | string | null): number {
  if (!date) return Infinity;
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getTrendArrow(
  current: number,
  previous: number
): "up" | "down" | "stable" {
  const diff = current - previous;
  if (diff > 5) return "up";
  if (diff < -5) return "down";
  return "stable";
}

export function parseClaudeJSON<T>(text: string): T {
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

export function splitIntoPages(content: string, maxLines = 4): string[] {
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());
  const pages: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const lines = para.split("\n").length;
    if (current && (current.split("\n").length + lines > maxLines * 3)) {
      pages.push(current.trim());
      current = para;
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }
  if (current.trim()) pages.push(current.trim());
  return pages.length > 0 ? pages : [content];
}

export function splitIntoLevels(content: string): { title: string; body: string }[] {
  const sections = content.split(/(?=Level \d+|Challenge \d+|## )/i).filter((s) => s.trim());
  if (sections.length <= 1) {
    const chunks = content.split(/\n\n+/);
    return chunks.map((chunk, i) => ({
      title: `Level ${i + 1}`,
      body: chunk,
    }));
  }
  return sections.map((section, i) => {
    const lines = section.trim().split("\n");
    const titleMatch = lines[0].match(/^(Level \d+[^:\n]*|Challenge \d+[^:\n]*|## .+)/i);
    return {
      title: titleMatch ? titleMatch[1].replace(/^## /, "") : `Level ${i + 1}`,
      body: titleMatch ? lines.slice(1).join("\n").trim() : section.trim(),
    };
  });
}

export function splitIntoCards(content: string): { title: string; body: string; icon: string }[] {
  const icons = ["📘", "💡", "🔍", "✨", "🎯", "📊", "🧩", "🌟"];
  const sections = content.split(/(?=^#{1,3} )/m).filter((s) => s.trim());
  if (sections.length <= 1) {
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());
    return paragraphs.map((p, i) => ({
      title: `Concept ${i + 1}`,
      body: p,
      icon: icons[i % icons.length],
    }));
  }
  return sections.map((section, i) => {
    const lines = section.trim().split("\n");
    const title = lines[0].replace(/^#{1,3}\s*/, "").trim();
    return {
      title: title || `Concept ${i + 1}`,
      body: lines.slice(1).join("\n").trim(),
      icon: icons[i % icons.length],
    };
  });
}
