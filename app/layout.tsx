import type { Metadata } from "next";
import { Providers } from "@/components/shared/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroSpark — Inclusive AI Learning",
  description:
    "AI-powered inclusive learning platform for students with ADHD, Dyslexia, and Autism Spectrum conditions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
