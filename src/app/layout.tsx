import type { Metadata } from "next";
import { Theme } from "@radix-ui/themes";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "AIClass - Student Performance Management",
  description: "AI-powered student performance tracking and recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Theme
            accentColor="blue"
            grayColor="slate"
            radius="medium"
            scaling="100%"
          >
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "var(--color-panel-solid)",
                  color: "var(--gray-12)",
                  border: "1px solid var(--gray-6)",
                },
                success: {
                  iconTheme: {
                    primary: "var(--accent-9)",
                    secondary: "white",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "var(--red-9)",
                    secondary: "white",
                  },
                },
              }}
            />
          </Theme>
        </Providers>
      </body>
    </html>
  );
}
