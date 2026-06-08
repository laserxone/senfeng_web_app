'use client'

import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { createContext, ReactNode, useEffect, useReducer, useState } from "react";
import { SET_User } from "../action/UserAction";
import { myUserReducer } from "../reducer/UserReducer";
import { auth } from "@/config/firebase";
import axios from "@/lib/axios";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { toast } from "sonner";
import { User } from "firebase/auth";
import { NavItems } from "@/lib/types";

export interface AppUser {
  id: number;
  name: string;
  email: string;
  designation: string;
  base_route: string;
  full_access: boolean;
  office : string
  limited_access : boolean,
  complaint_assigned : boolean
  dms_write_access: boolean
customer_add_access: boolean
  customer_delete_access: boolean
  nav_items : NavItems[]
  branch_expenses_assigned: boolean
  branch_expenses_write_access: boolean
  branch_expenses_delete_access: boolean
  superadmin_cloud_access: boolean
customer_full_access: boolean
dp : string
reimbursement_approval : boolean
team_attendance_marking : boolean
father ?: string
number?: string
official_number ?: string
kin_number ?: string
address ?: string
pin ?: string
basic_salary ?: string
monthly_target ?: string
total_salary ?: string
cnic ?: string
education ?: string
police ?: string
resume ?: string
appointment_letter ?: string
father_cnic ?: string
other_docs ?: string[]
}

export interface UserState {
  value: {
    data: (AppUser & Partial<User>) | null;
  };
}

export interface UserContextType {
  state: UserState;
  setUser: (data: (AppUser & Partial<User>) | null) => void;
  loading: boolean;
}

export const UserContext = createContext<UserContextType>({
  state: { value: { data: null } },
  setUser: () => { },
 loading : false
});

const UserContextProvider = ({ children }: { children: ReactNode }) => {
 const [state, dispatch] = useReducer(myUserReducer, {
  value: { data: null },
} as UserState);

  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
 const [authData, setAuthData] = useState<
  (AppUser & Partial<User>) | null
>(null);
 

const setUser = (data: (AppUser & Partial<User>) | null) => {
  dispatch({ type: SET_User, payload: { data } });
};

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      const email = fbUser?.email ?? null;
      setLoading(true);
      try {
        if (email) {
          const res = await axios.get(`/userdetail/${email}`);
          const userData = res.data
          if (userData?.designation) {
            setAuthData({ ...userData, ...fbUser })
          } else {
            toast.error("User does not exist in the system")
            signOut(auth);
          }
        } else {
          setAuthData(null)
          if (!pathname.includes('login') && !pathname.includes('signup') && !pathname.includes('forgetpassword') && !pathname.includes('passwordcreation')) {
            setLoading(false)
            router.replace('/login');
          }
        }
      } catch (error) {
        setLoading(false)
        setAuthData(null);
        signOut(auth)
        router.replace("/login");
      } finally {
        setLoading(false)
      }
    });

    return () => unsub()

  }, [pathname]);

  useEffect(() => {
    if (authData?.id) {
      if (authData.full_access || authData.designation === 'Owner') {
        if (!pathname.includes("superadmin")) {
          router.replace(`/${authData.base_route.toLowerCase()}/dashboard`)
          return
        }
      } else {
        if (!pathname.includes(authData.base_route)) {
          router.replace(`/${authData.base_route}/dashboard`)
          return
        }
      }
      setUser(authData)
    }
  }, [authData, pathname])

  return (
    <UserContext.Provider value={{ state, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;