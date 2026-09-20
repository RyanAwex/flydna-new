import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyDnA",
  description: "Connect. Chat. Explore.",
};

export default function LobbyNestedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

