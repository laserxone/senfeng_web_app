import { SET_Notification } from '../action/NotificationAction'

export const myNotificationReducer = (state, action) => {
  switch (action.type) {
    case SET_Notification:
      let newNotificationState = { ...state }
      newNotificationState.value.data = action.payload.data       
      return newNotificationState
      break
    default:
      return state
  }
}

