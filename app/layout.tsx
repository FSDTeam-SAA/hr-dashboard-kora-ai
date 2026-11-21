import type { Metadata } from "next";

import "./globals.css";
import "./novya.css";
import "./support.css";
import "./assistant.css";
import "./learn.css";
import "./ops.css";
import "./hr.css";
import { Providers } from "@/components/providers";



export const metadata: Metadata = {
  title: "NOVYA · HR",
  description: "Your people, learning and workflows, connected. NOVYA HR workspace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
