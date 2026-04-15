'use client'

import { createContext, useReducer, ReactNode } from "react";
import { SET_User } from "../action/UserAction";
import { myUserReducer } from "../reducer/UserReducer";

/* ---------------- Types ---------------- */

type UserData = any; // replace with real user type if you have it

type StateType = {
  value: {
    data: UserData | null;
  };
};

type ActionType = {
  type: string;
  payload: {
    data: UserData;
  };
};

type UserContextType = {
  state: StateType;
  setUser: (data: UserData) => void;
};

/* ---------------- Context ---------------- */

export const UserContext = createContext<UserContextType | undefined>(undefined);

/* ---------------- Provider ---------------- */

const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(myUserReducer, {
    value: { data: null },
  });

  const setUser = (data: UserData) => {
    dispatch({ type: SET_User, payload: { data } });
  };

  return (
    <UserContext.Provider value={{ state, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;