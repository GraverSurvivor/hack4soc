// Structure-aware file extraction for uploaded course materials before AI enrichment.
import { createRequire } from "module";
import fs from "fs/promises";
import mammoth from "mammoth";
import pdf from "pdf-parse";
import type { StructuredContent } from "@/types/course";

const require = createRequire(import.meta.url);

const SUPPORTED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
};

interface ParserSection {
  heading: string;
  content: string;
  level: number;
}

interface PptxSlide {
  texts?: string[];
  title?: string;
  notes?: string[];
}

interface PptxParserInstance {
  parse(path: string): Promise<PptxSlide[]>;
}

type PptxParserConstructor = new () => PptxParserInstance;

export function getFileType(mimeType: string, fileName: string): string | null {
  if (SUPPORTED_TYPES[mimeType]) return SUPPORTED_TYPES[mimeType];
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "pptx") return "pptx";
  if (ext === "txt") return "txt";
  return null;
}

export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<StructuredContent> {
  const fileType = getFileType(mimeType, fileName);

  switch (fileType) {
    case "pdf":
      return extractFromPDF(buffer, fileName);
    case "docx":
      return extractFromDOCX(buffer, fileName);
    case "pptx":
      return extractFromPPTX(buffer, fileName);
    case "txt":
      return buildStructuredContent(buffer.toString("utf-8"), fileName);
    default:
      throw new Error(
        "We couldn't read that file. Try a different format (PDF, DOCX, PPTX, or TXT)."
      );
  }
}

async function extractFromPDF(
  buffer: Buffer,
  fileName: string
): Promise<StructuredContent> {
  const data = await pdf(buffer, {
    pagerender: (pageData) =>
      pageData.getTextContent({ normalizeWhitespace: true }).then((textContent) => {
        const strings = textContent.items
          .map((item) => ("str" in item ? String(item.str) : ""))
          .filter(Boolean);
        return strings.join(" ");
      }),
  });

  if (!data.text?.trim()) {
    throw new Error("We couldn't read that file. Try a different format.");
  }

  return buildStructuredContent(data.text, fileName);
}

async function extractFromDOCX(
  buffer: Buffer,
  fileName: string
): Promise<StructuredContent> {
  const htmlResult = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
    }
  );
  const rawResult = await mammoth.extractRawText({ buffer });
  const rawText = rawResult.value || stripHtml(htmlResult.value);

  if (!rawText.trim()) {
    throw new Error("We couldn't read that file. Try a different format.");
  }

  const sections = sectionsFromHtml(htmlResult.value);
  return buildStructuredContent(rawText, fileName, { sections });
}

async function extractFromPPTX(
  buffer: Buffer,
  fileName: string
): Promise<StructuredContent> {
  const tempPath = `./uploads/temp_${Date.now()}_${sanitizeFileName(fileName)}`;
  await fs.mkdir("./uploads", { recursive: true });
  await fs.writeFile(tempPath, buffer);

  try {
    const PptxParser = require("pptx-parser") as PptxParserConstructor;
    const parser = new PptxParser();
    const slides = await parser.parse(tempPath);
    const sections = slides.flatMap((slide, index) => {
      const texts = slide.texts?.map((text) => text.trim()).filter(Boolean) || [];
      if (texts.length === 0 && !slide.title) return [];

      const heading = slide.title?.trim() || texts[0] || `Slide ${index + 1}`;
      const bullets = texts.slice(slide.title ? 0 : 1);
      return [
        {
          heading,
          content: bullets.map((text) => `- ${text}`).join("\n"),
          level: 1,
        },
      ];
    });
    const rawText = sections
      .map((section) => `${section.heading}\n${section.content}`)
      .join("\n\n");

    if (!rawText.trim()) {
      throw new Error("No text found in presentation");
    }

    return buildStructuredContent(rawText, fileName, { sections });
  } catch {
    throw new Error("We couldn't read that file. Try a different format.");
  } finally {
    await fs.unlink(tempPath).catch(() => undefined);
  }
}

function buildStructuredContent(
  rawText: string,
  fileName: string,
  overrides: Partial<Pick<StructuredContent, "sections" | "figures" | "tables">> = {}
): StructuredContent {
  const normalized = normalizeText(rawText);
  const sections =
    overrides.sections && overrides.sections.length > 0
      ? overrides.sections
      : sectionsFromText(normalized);

  return {
    title: inferTitle(sections, normalized, fileName),
    subjectArea: inferSubjectArea(normalized),
    sections,
    keyTerms: inferKeyTerms(normalized),
    figures: overrides.figures || inferFigures(normalized),
    tables: overrides.tables || inferTables(normalized),
    rawText: normalized,
  };
}

function sectionsFromHtml(html: string): ParserSection[] {
  const tokenPattern = /<(h[1-6]|p|li)[^>]*>(.*?)<\/\1>/gis;
  const sections: ParserSection[] = [];
  let current: ParserSection | null = null;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const text = stripHtml(match[2]).trim();
    if (!text) continue;

    if (tag.startsWith("h")) {
      if (current) sections.push(current);
      current = {
        heading: text,
        content: "",
        level: Number(tag.slice(1)),
      };
    } else {
      if (!current) {
        current = { heading: "Overview", content: "", level: 1 };
      }
      current.content += `${current.content ? "\n" : ""}${tag === "li" ? "- " : ""}${text}`;
    }
  }

  if (current) sections.push(current);
  return sections.length > 0 ? sections : [];
}

function sectionsFromText(text: string): ParserSection[] {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const sections: ParserSection[] = [];
  let current: ParserSection = { heading: "Overview", content: "", level: 1 };

  for (const line of lines) {
    if (looksLikeHeading(line)) {
      if (current.content.trim() || current.heading !== "Overview") sections.push(current);
      current = { heading: cleanHeading(line), content: "", level: inferHeadingLevel(line) };
    } else {
      current.content += `${current.content ? "\n" : ""}${line}`;
    }
  }

  if (current.content.trim() || sections.length === 0) sections.push(current);
  return sections;
}

function looksLikeHeading(line: string): boolean {
  if (line.length > 90) return false;
  if (/^#{1,6}\s+/.test(line)) return true;
  if (/^(chapter|unit|lesson|section|part)\s+\d+/i.test(line)) return true;
  if (/^\d+(\.\d+)*\s+[\w\s-]+$/.test(line)) return true;
  return /^[A-Z][A-Za-z0-9\s:,-]+$/.test(line) && !/[.!?]$/.test(line);
}

function inferHeadingLevel(line: string): number {
  const markdown = line.match(/^(#{1,6})\s+/);
  if (markdown) return markdown[1].length;
  if (/^\d+\.\d+/.test(line)) return 2;
  return 1;
}

function cleanHeading(line: string): string {
  return line.replace(/^#{1,6}\s+/, "").trim();
}

function inferTitle(
  sections: ParserSection[],
  rawText: string,
  fileName: string
): string {
  const firstHeading = sections.find((section) => section.heading !== "Overview")?.heading;
  if (firstHeading) return firstHeading;
  const firstLine = rawText.split(/\n+/).find((line) => line.trim().length > 0);
  return firstLine?.slice(0, 90) || fileName.replace(/\.[^.]+$/, "");
}

function inferSubjectArea(text: string): string {
  const lower = text.toLowerCase();
  const scores: Array<[string, string[]]> = [
    ["Biology", ["cell", "organism", "photosynthesis", "plant", "animal", "dna", "ecosystem"]],
    ["Chemistry", ["atom", "molecule", "reaction", "acid", "base", "compound", "element"]],
    ["Physics", ["force", "motion", "energy", "velocity", "gravity", "wave", "electricity"]],
    ["History", ["empire", "war", "revolution", "civilization", "primary source", "century"]],
    ["Mathematics", ["equation", "fraction", "geometry", "algebra", "graph", "ratio"]],
    ["Earth Science", ["rock", "weather", "climate", "erosion", "plate tectonics", "ocean"]],
  ];

  const best = scores
    .map(([subject, words]) => ({
      subject,
      count: words.filter((word) => lower.includes(word)).length,
    }))
    .sort((a, b) => b.count - a.count)[0];

  return best && best.count > 0 ? best.subject : "General Studies";
}

function inferKeyTerms(text: string): string[] {
  const candidates = new Set<string>();
  const boldTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
  for (const term of boldTerms) {
    if (!COMMON_TITLE_WORDS.has(term.toLowerCase())) candidates.add(term);
  }
  const definitionTerms = text.match(/\b[A-Za-z][A-Za-z\s-]{2,40}(?=\s+is\s+)/g) || [];
  for (const term of definitionTerms) candidates.add(term.trim());
  return Array.from(candidates).slice(0, 15);
}

function inferFigures(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^(figure|fig\.|diagram|image|caption)\s*[:\d]/i.test(line))
    .slice(0, 12);
}

function inferTables(text: string): Array<Array<string>> {
  return text
    .split(/\n+/)
    .filter((line) => line.includes("|") || line.includes("\t"))
    .map((line) => line.split(line.includes("|") ? "|" : "\t").map((cell) => cell.trim()))
    .filter((row) => row.length > 1)
    .slice(0, 20);
}

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/h[1-6]>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-z0-9_.-]/gi, "_");
}

const COMMON_TITLE_WORDS = new Set([
  "chapter",
  "lesson",
  "unit",
  "overview",
  "introduction",
  "the",
  "and",
  "for",
]);
