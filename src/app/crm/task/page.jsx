"use client";


import TaskEmployee from "@/components/users/task";
import { UserContext } from "@/store/context/UserContext";
import { useContext } from "react";


export default function Page() {
  const {state : UserState} = useContext(UserContext)
 return (
  <TaskEmployee id={UserState?.value?.data?.id}/>
 )
}


