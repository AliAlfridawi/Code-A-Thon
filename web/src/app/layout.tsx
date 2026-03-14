import type { Metadata } from "next";
import { Sora, IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeProvider";
import { RoleProvider } from "@/context/RoleProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Maventor – Mentorship Coordination Platform",
  description:
    "Structured mentor-mentee coordination for clubs. Track pairings, goals, check-ins, and analytics in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${ibmPlexSans.variable} antialiased`}>
        <ThemeProvider>
          <RoleProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="ml-64 flex-1 p-6 lg:p-8">
                {children}
              </main>
            </div>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
