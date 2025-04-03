"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThreadsProvider } from "@/components/agent-inbox/contexts/ThreadContext";
import React, { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, AppSidebarTrigger } from "@/components/app-sidebar";
import { BreadCrumb } from "@/components/agent-inbox/components/breadcrumb";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  
  // Set page title based on route
  useEffect(() => {
    document.title = isDashboard 
      ? "SK Cognitive Hub | Dashboard" 
      : "SK Cognitive Hub";
  }, [isDashboard]);

  return (
    <html lang="en">
      <body className={inter.className}>
        <React.Suspense fallback={<div>Loading (layout)...</div>}>
          <Toaster />
          {!isDashboard ? (
            // Landing page - render without layout elements
            <>{children}</>
          ) : (
            // Main app - render with full layout
            <ThreadsProvider>
              <SidebarProvider>
                <AppSidebar />
                <main className="flex flex-row w-full min-h-full pt-6 pl-6 gap-6">
                  <AppSidebarTrigger isOutside={true} />
                  <div className="flex flex-col gap-6 w-full min-h-full">
                    <BreadCrumb className="pl-5" />
                    <div
                      className={cn(
                        "h-full bg-white rounded-tl-[58px]",
                        "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                      )}
                    >
                      {children}
                    </div>
                  </div>
                </main>
              </SidebarProvider>
            </ThreadsProvider>
          )}
        </React.Suspense>
      </body>
    </html>
  );
}
