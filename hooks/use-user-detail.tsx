"use client";

import { OfficeContext } from "@/store/context/OfficeContext";
import { UserContext } from "@/store/context/UserContext";
import { useContext } from "react";

const useUserDetail = () => {
  const { state: UserState } = useContext(UserContext);
  const {state : OfficeState} = useContext(OfficeContext)

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
  const userDp = data?.dp ?? ""
  const superadmin_cloud_access = data.superadmin_cloud_access ?? false
  const customer_full_access = data?.customer_full_access ?? false

  const route_branch = OfficeState?.value?.data ?? null


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
    superadmin_cloud_access,
    customer_full_access,
    route_branch
  };
};

export default useUserDetail;
