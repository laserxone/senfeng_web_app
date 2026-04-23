"use client";

import { auth } from "@/config/firebase";
import axios from "@/lib/axios";
import {
    onAuthStateChanged,
    signOut,
} from "firebase/auth";
import { usePathname } from "next/navigation";
import { useRouter } from 'nextjs-toploader/app';
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type AuthContextType = {
    loading: boolean;
    authData: any | null
};

const AuthContext = createContext<AuthContextType>({

    loading: true,
    authData: null

});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const [authData, setAuthData] = useState<any | null>(null)
    const lastUserRef = useRef<string | null>(null);
    const cacheRef = useRef<Record<string, any>>({});


    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            const email = fbUser?.email ?? null;
            if (lastUserRef.current === email) return;
            lastUserRef.current = email;
            setLoading(true);
            try {
                if (email) {

                    if (!cacheRef.current[email]) {
                        const res = await axios.get(`/userdetail/${email}`);
                        cacheRef.current[email] = res.data;
                    }
                    const userData = cacheRef.current[email];
                    if (userData?.designation) {
                        setAuthData({ ...userData, ...fbUser })
                    } else {
                        toast.error("User does not exist in the system")
                        signOut(auth);
                    }
                } else {
                    setAuthData(null)
                    if (!pathname.includes('login') && !pathname.includes('signup') && !pathname.includes('forgetpassword')) {
                        router.replace('/login');
                    }
                }
            } catch (error) {
                setAuthData(null);
                signOut(auth)
                router.replace("/login");
            } finally {
                setLoading(false)
            }
        });

        return () => unsub()

    }, []);

    return (
        <AuthContext.Provider value={{ loading, authData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
