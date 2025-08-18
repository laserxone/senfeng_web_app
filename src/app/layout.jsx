import MaintenanceWrapper from "@/components/maintenance-wrapper";
import Providers from "@/components/providers";
import SenfengLogoLoader from "@/components/senfengLogoLoader";
import { Toaster } from "@/components/ui/toaster";
import HolyLoader from "holy-loader";
import { Lato } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import PwaInstallButton from "@/components/install-pwa";

export const metadata = {
  title: "SENFENG",
  description: "SENFENG APP",
  manifest: '/manifest.json',
};

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

export default async function RootLayout({ children }) {
  return (
    
      <html lang="en" className={`${lato.className}`} suppressHydrationWarning>
        <body className={"overflow-hidden"}>
          {/* <NextTopLoader showSpinner={false} /> */}

          <HolyLoader />
          <Suspense fallback={<SenfengLogoLoader />}>
            <Providers>
              {/* <MobileScreenWrapper> */}
              <MaintenanceWrapper>{children}</MaintenanceWrapper>
              {/* </MobileScreenWrapper> */}
                <PwaInstallButton />
            </Providers>
          </Suspense>
       
          <Toaster />
        </body>
      </html>
    
  );
}
