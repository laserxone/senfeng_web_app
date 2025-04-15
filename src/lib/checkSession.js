import { app, auth, db } from "@/config/firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useContext, useRef, useState, useEffect } from "react";
import axios from "@/lib/axios";
import { BASE_URL } from "@/constants/data";
import { startHolyLoader } from "holy-loader";
import { useToast } from "@/hooks/use-toast";

export default function useCheckSession() {
    const router = useRouter();
    const pathname = usePathname();
    const [isCheckingSession, setIsCheckingSession] = useState(false);
    const unsubscribeRef = useRef(null);
    const { toast } = useToast()

    const debouncedData = useCallback(
        debounce(async (user) => {
            return await checkData(user);
        }, 500),
        []
    );

    async function checkData(user) {
        try {
            const response = await axios.get(`/userdetail/${user.email}`);
            const userData = response.data;

            if (userData?.designation) {

                if (userData.full_access) {
                    if (!pathname.includes("superadmin")) {
                        startHolyLoader()
                        router.push("/superadmin/dashboard")
                    }
                }

                else if (userData.designation === 'Owner') {
                    if (!pathname.includes("superadmin")) {
                        startHolyLoader()
                        router.push("/superadmin/dashboard")
                    }
                }
                else if (userData.designation === 'Social Media Manager') {
                    if (!pathname.includes("smm")) {
                        startHolyLoader()
                        router.push("/smm/dashboard")
                    }
                }

                else if (userData.designation === 'Sales') {
                    if (!pathname.includes("sales")) {
                        startHolyLoader()
                        router.push("/sales/dashboard")
                    }
                }

                else if (userData.designation === 'Engineer') {
                    if (!pathname.includes("engineer")) {
                        startHolyLoader()
                        router.push("/engineer/dashboard")
                    }
                }

                else if (userData.designation === 'Manager') {
                    if (!pathname.includes("manager")) {
                        startHolyLoader()
                        router.push("/manager/dashboard")
                    }
                }

                else if (userData.designation === 'Customer Relationship Manager') {
                    if (!pathname.includes("crm")) {
                        startHolyLoader()
                        router.push("/crm/dashboard")
                    }
                }

                else if (userData.designation === 'Customer Relationship Manager (After Sales)') {
                    if (!pathname.includes("aftersales")) {
                        startHolyLoader()
                        router.push("/aftersales/dashboard")
                    }
                }
                else {
                    signOut(auth);
                }

                return { user: { ...userData, ...user } };
            } else {
                toast({ title: "User does not exist in the system", variant: "destructive" })
                signOut(auth);
                return { error: "User not found" };
            }
        } catch (e) {
            signOut(auth);
            return { error: e.message };
        }
    }

    const checkSession = useCallback(async () => {
        if (isCheckingSession) return { status: false };

        return new Promise((resolve) => {
            setIsCheckingSession(true);

            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user && user.email) {
                    const result = await debouncedData(user);
                    resolve(result);
                } else {
                    if (!pathname.includes('login') && !pathname.includes('signup') && !pathname.includes('forgetpassword')) {
                        router.push('/login');
                    }
                    resolve({ status: false });
                }
                setIsCheckingSession(false);
            });

            unsubscribeRef.current = unsubscribe;
        });
    }, [isCheckingSession, debouncedData, pathname, router]);

    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    return checkSession;
}


function debounce(func, delay = 1000) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        return new Promise((resolve, reject) => {
            timeout = setTimeout(async () => {
                try {
                    const result = await func(...args);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, delay);
        });
    };
}