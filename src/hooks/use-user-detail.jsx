"use client";

const { UserContext } = require("@/store/context/UserContext");
const { useContext } = require("react");

const useUserDetail = () => {
  const { state: UserState } = useContext(UserContext);

  const isAdmin = UserState.value.data?.designation === 'Owner' || UserState.value.data?.full_access;
  const userID = UserState.value.data?.id;
  const base_route = UserState.value.data?.base_route;
  const designation = UserState.value.data?.designation;
  const limited_access = UserState.value.data?.limited_access;

  return { isAdmin, userID, base_route, designation, limited_access };
};

export default useUserDetail;
