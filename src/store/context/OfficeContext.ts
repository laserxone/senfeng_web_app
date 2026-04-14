'use client'
import { createContext, useReducer } from "react";
import { SET_OFFICE} from '../action/OfficeAction'
import { myOfficeReducer } from '../reducer/OfficeReducer'

export const OfficeContext = createContext()

const OfficeContextProvider = (props) => {

    const [state, dispatch] = useReducer(myOfficeReducer, { value: { data: [] }})

    const setOffice = (data) => {
        dispatch({ type: SET_OFFICE, payload: { data: data } })
    }

    return (
        <OfficeContext.Provider
            value={{ state, setOffice }}
        >
            {props.children}
        </OfficeContext.Provider>
    )
}

export default OfficeContextProvider