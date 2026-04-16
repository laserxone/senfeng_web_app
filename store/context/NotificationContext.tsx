"use client";

import { createContext, useReducer, ReactNode, Dispatch } from "react";
import { SET_Notification } from "../action/NotificationAction";
import { myNotificationReducer } from "../reducer/NotificationReducer";

type NotificationItem = any; 

type State = {
  value: {
    data: NotificationItem[];
  };
};

type Action = {
  type: string;
  payload: {
    data: NotificationItem[];
  };
};

type ContextType = {
  state: State;
  setNotification: (data: NotificationItem[]) => void;
};

export const NotificationContext = createContext<ContextType | undefined>(
  undefined
);

type Props = {
  children: ReactNode;
};

const NotificationContextProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(myNotificationReducer, {
    value: { data: [] },
  });

  const setNotification = (data: NotificationItem[]) => {
    dispatch({ type: SET_Notification, payload: { data } });
  };

  return (
    <NotificationContext.Provider value={{ state, setNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContextProvider;