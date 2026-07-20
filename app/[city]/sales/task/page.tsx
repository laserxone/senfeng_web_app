"use client";

import TaskEmployee from "@/components/features/tasks/task";
import useUserDetail from "@/hooks/use-user-detail";

export default function Page() {
  const { userID } = useUserDetail();
  return <TaskEmployee id={userID} />;
}
