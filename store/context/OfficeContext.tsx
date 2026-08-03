// OfficeContext.tsx
"use client"

import { createContext, useReducer, ReactNode, Dispatch } from "react"
import { SET_OFFICE } from "../action/OfficeAction"
import {
  myOfficeReducer,
  OfficeState,
  OfficeAction,
} from "../reducer/OfficeReducer"

interface OfficeContextType {
  state: OfficeState
  setOffice: (data: string | null) => void
}

export const OfficeContext = createContext<OfficeContextType | null>(null)

interface Props {
  children: ReactNode
}

const initialState: OfficeState = {
  value: {
    data: null,
  },
}

export const OfficeContextProvider = ({ children }: Props) => {
  const [state, dispatch]: [OfficeState, Dispatch<OfficeAction>] = useReducer(
    myOfficeReducer,
    initialState
  )

  const setOffice = (data: string | null) => {
    dispatch({
      type: SET_OFFICE,
      payload: { data },
    })
  }

  return (
    <OfficeContext.Provider value={{ state, setOffice }}>
      {children}
    </OfficeContext.Provider>
  )
}

export default OfficeContextProvider
