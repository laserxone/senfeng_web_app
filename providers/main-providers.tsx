"use client"
import ThemeProvider from "@/components/ThemeToggle/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/store/context/NotificationContext";
import OfficeContextProvider from "@/store/context/OfficeContext";
import { AuthProvider } from "@/store/context/UserAuthContext";
import UserContextProvider from "@/store/context/UserContext";
import NextTopLoader from 'nextjs-toploader';

import { ReactNode } from "react";


export default function MainProviders({ children }: { children: ReactNode }) {


    return (
        <AuthProvider>
            <UserContextProvider>
                <OfficeContextProvider>
                    <NotificationProvider>
                        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
                            <TooltipProvider>
                                <NextTopLoader
                                    showSpinner={false} />
                                {children}
                            </TooltipProvider>
                        </ThemeProvider>
                    </NotificationProvider>
                </OfficeContextProvider>
            </UserContextProvider>
        </AuthProvider>
    )
}