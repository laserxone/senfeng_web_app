import MaintenanceWrapper from "@/components/maintenance-wrapper";
import SenfengLogoLoader from "@/components/senfengLogoLoader";
import { cn } from "@/lib/utils";
import MainProviders from "@/providers/main-providers";
import { Geist_Mono, Inter, Nunito_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const nunitoSansHeading = Nunito_Sans({ subsets: ['latin'], variable: '--font-heading' });

export const metadata = {
  title: "SENFENG",
  description: "SENFENG APP",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable, nunitoSansHeading.variable)}
      
    >
      <body>
        <Suspense fallback={<SenfengLogoLoader />}>
          <MainProviders>
            <MaintenanceWrapper>
              {children}
            </MaintenanceWrapper>
          </MainProviders>
        </Suspense>
      </body>
    </html>
  )
}
