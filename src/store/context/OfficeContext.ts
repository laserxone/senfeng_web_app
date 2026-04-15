"use client";

import { createContext, useReducer } from "react";
import { SET_OFFICE } from "../action/OfficeAction";
import { myOfficeReducer } from "../reducer/OfficeReducer";

export const OfficeContext = createContext<any>(null);

export const OfficeContextProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(myOfficeReducer, {
    value: { data: [] },
  });

  const setOffice = (data: any[]) => {
    dispatch({ type: SET_OFFICE, payload: { data } });
  };

  return (
    <OfficeContext.Provider value={{ state, setOffice }}>
      {children}
    </OfficeContext.Provider>
  );
};

export default OfficeContextProvider