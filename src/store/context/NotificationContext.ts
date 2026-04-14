'use client'
import { createContext, useReducer } from "react";
import { SET_Notification} from '../action/NotificationAction'
import { myNotificationReducer } from '../reducer/NotificationReducer'

export const NotificationContext = createContext()

const NotificationContextProvider = (props) => {

    const [state, dispatch] = useReducer(myNotificationReducer, { value: { data: [] }})

    const setNotification = (data) => {
        dispatch({ type: SET_Notification, payload: { data: data } })
    }

    return (
        <NotificationContext.Provider
            value={{ state, setNotification }}
        >
            {props.children}
        </NotificationContext.Provider>
    )
}

export default NotificationContextProvider