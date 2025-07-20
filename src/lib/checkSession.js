import { auth } from "@/config/firebase";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { startHolyLoader } from "holy-loader";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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


                if (userData.full_access || userData.designation === 'Owner') {
                    if (!pathname.includes("superadmin")) {
                        startHolyLoader()
                        router.push(`/${userData.office.toLowerCase()}/superadmin`)
                    }
                } else {
                    if (!pathname.includes(userData.base_route)) {
                        startHolyLoader()
                        router.replace(`/${userData.base_route}/dashboard`)
                    }
                }

                return { user: { ...userData, ...user } };
            } else {
                toast({ title: "User does not exist in the system", variant: "destructive" })
                signOut(auth);
                return { error: "User not found" };
            }
        } catch (e) {
            if (e?.message instanceof FirebaseError) {
                toast({ title: e?.message || "Error occured", variant: "destructive" })
            }
            signOut(auth);
            return { error: e?.message || "Error occured" };
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

//     const checkSession = useCallback(async () => {
//     if (isCheckingSession) return { status: false };

//     setIsCheckingSession(true);

//     try {
//         // Read from localStorage (or cookies if needed)
//         const email = localStorage.getItem('user_email');
      

//         if (email) {
//             // Send to backend to verify session
//             const result = await debouncedData({ email });
//             return result;
//         } else {
//             if (!pathname.includes('login') && !pathname.includes('signup') && !pathname.includes('forgetpassword')) {
//                 router.push('/login');
//             }
//             return { status: false };
//         }
//     } finally {
//         setIsCheckingSession(false);
//     }
// }, [isCheckingSession, debouncedData, pathname, router]);

    
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