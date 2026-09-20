import type { Metadata } from "next";
import "./(lobby)/globals.css";
import AuthGate from "@/components/auth/AuthGate";
import { ThemeProvider } from "@/context/ThemeContext";
import { CallProvider } from "@/context/CallContext";

export const metadata: Metadata = {
  title: "FlyDnA",
  description: "Connect. Chat. Explore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('flydna_theme');
                  var root = document.documentElement;
                  if (storedTheme === 'light') {
                    root.classList.remove('dark');
                    root.setAttribute('data-theme', 'light');
                  } else {
                    root.classList.add('dark');
                    root.setAttribute('data-theme', 'dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <AuthGate>
            <CallProvider>{children}</CallProvider>
          </AuthGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
