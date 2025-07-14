import { SET_OFFICE } from '../action/OfficeAction'

export const myOfficeReducer = (state, action) => {
  switch (action.type) {
    case SET_OFFICE:
      let newOfficeState = { ...state }
      newOfficeState.value.data = action.payload.data       
      return newOfficeState
      break
    default:
      return state
  }
}

