import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signed — Email signatures, centrally managed",
  description: "Deploy branded email signatures across your entire organisation. No client installs, no IT headaches. A product of xshield.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
