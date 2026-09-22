import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SplashScreen from "@/components/ui/SplashScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cây Tình Yêu",
  description: "Khu vườn riêng tư của hai người",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cây Tình Yêu",
  },
  formatDetection: {
    telephone: false,
  }
};

export const viewport: Viewport = {
  themeColor: "#be185d", // pink-700
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Ngăn zoom trên di động để giống app thật
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
