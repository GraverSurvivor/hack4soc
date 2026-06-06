"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1A2F52",
              border: "1px solid #3D5C8C",
              color: "#fff",
            },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
