"use client";

const { UserContext } = require("@/store/context/UserContext");
const { useContext } = require("react");

const useUserDetail = () => {
  const { state: UserState } = useContext(UserContext);

 const data = UserState.value.data ?? {};
const isAdmin = (data.designation === "Owner" || data.full_access) ?? false;
const userID = data.id ?? "";
const base_route = data.base_route ?? "";
const designation = data.designation ?? "";
const limited_access = data.limited_access ?? false;
const full_access = data.full_access ?? false;
const office = data.office ?? "";
const name = data.name ?? "";
const email = data.email ?? "";
const complaint_assigned = data.complaint_assigned ?? false;
const dms_write_access = data.dms_write_access ?? false;
const customer_delete_access = data.customer_delete_access ?? false;
const customer_add_access = data.customer_add_access ?? false
const nav_items = data.nav_items ?? []
const branch_expenses_assigned = data.branch_expenses_assigned ?? false
const branch_expenses_write_access = data.branch_expenses_write_access ?? false
const branch_expenses_delete_access = data.branch_expenses_delete_access ?? false
const userDp = UserState.value.data?.dp ?? ""


  return {
    isAdmin,
    userID,
    base_route,
    designation,
    limited_access,
    office,
    full_access,
    name,
    email,
    complaint_assigned,
    dms_write_access,
    customer_delete_access,
    customer_add_access,
    nav_items,
    branch_expenses_assigned,
    branch_expenses_write_access,
    branch_expenses_delete_access,
    userDp,
  };
};

export default useUserDetail;
