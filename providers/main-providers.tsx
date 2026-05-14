"use client"
import ThemeProvider from "@/components/ThemeToggle/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/store/context/NotificationContext";
import OfficeContextProvider from "@/store/context/OfficeContext";
import UserContextProvider from "@/store/context/UserContext";
import NextTopLoader from 'nextjs-toploader';
import { ReactNode } from "react";
import { Toaster } from "sonner";


export default function MainProviders({ children }: { children: ReactNode }) {


    return (

        <UserContextProvider>
            <OfficeContextProvider>
                <NotificationProvider>
                    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
                        <TooltipProvider>
                            <NextTopLoader
                                showSpinner={false} />
                            {children}
                            <Toaster richColors />
                        </TooltipProvider>
                    </ThemeProvider>
                </NotificationProvider>
            </OfficeContextProvider>
        </UserContextProvider>

    )
}