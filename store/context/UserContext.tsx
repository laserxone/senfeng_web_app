'use client'

import { createContext, useReducer, ReactNode, useEffect } from "react";
import { SET_User } from "../action/UserAction";
import { myUserReducer } from "../reducer/UserReducer";
import { useAuth } from "./UserAuthContext";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";

export const UserContext = createContext<any>(undefined);

const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(myUserReducer, {
    value: { data: null },
  });
  const pathname = usePathname()
  const router = useRouter()

  const { authData } = useAuth()

  const setUser = (data: any) => {
    dispatch({ type: SET_User, payload: { data } });
  };

  useEffect(() => {
    if (authData?.id) {
      if (authData.full_access || authData.designation === 'Owner') {
        if (!pathname.includes("superadmin")) {
          router.replace(`/${authData.office.toLowerCase()}/superadmin/dashboard`)
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
    <UserContext.Provider value={{ state, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;