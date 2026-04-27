"use client";
import {
  useState
} from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "react-medium-image-zoom/dist/styles.css";

import RecordComponent from "@/components/salary/salary-record";
import DetailComponent from "@/components/salary/user-detatils";
import SalaryComponent from "@/components/salary/salary-user";

export default function Page() {

  const [userID, setUserID] = useState(null)

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <Tabs defaultValue="salary" className="flex flex-1 flex-col">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="record">Record</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="salary" >
          <SalaryComponent onSelectedId={setUserID} />
        </TabsContent>
        <TabsContent value="record">
          <RecordComponent />
        </TabsContent>
        <TabsContent value="details" >
          <DetailComponent id={userID} />
        </TabsContent>
      </Tabs>
    </div>
  );
}





