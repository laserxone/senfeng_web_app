import { SET_OFFICE } from "../action/OfficeAction";

export interface OfficeState {
  value: {
    data: string | null;
  };
}

export interface SetOfficeAction {
  type: typeof SET_OFFICE;
  payload: {
    data: string | null;
  };
}

export type OfficeAction = SetOfficeAction;

export const myOfficeReducer = (
  state: OfficeState,
  action: OfficeAction,
): OfficeState => {
  switch (action.type) {
    case SET_OFFICE:
      return {
        ...state,
        value: {
          ...state.value,
          data: action.payload.data,
        },
      };

    default:
      return state;
  }
};
