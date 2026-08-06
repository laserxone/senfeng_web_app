"use client";
import { useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import RecordComponent from "@/components/features/salary/salary-record";
import SalaryComponent from "@/components/features/salary/salary-user";
import DetailComponent from "@/components/features/salary/user-detatils";

export default function Page() {
  const [userID, setUserID] = useState<number | null>(null);
  const [value, setValue] = useState("salary");

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <Tabs
        onValueChange={setValue}
        defaultValue="salary"
        className="flex flex-1 flex-col"
      >
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="record">Record</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <div hidden={value !== "salary"}>
          <SalaryComponent onSelectedId={setUserID} />
        </div>
        <div hidden={value !== "record"}>
          <RecordComponent />
        </div>
        <div hidden={value !== "details"}>
          <DetailComponent id={userID ? String(userID) : null} />
        </div>
      </Tabs>
    </div>
  );
}
