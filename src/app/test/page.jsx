"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useState } from "react";

export default function Page() {
  const [val, setVal] = useState("");
  async function handleClick() {
    axios.post("/api/test", { id: val }).then((response) => {
      console.log(response.data);
    });
    // await axios.get("/api/test").then((response) => {
    //   const data = response.data;
    //   console.log("done")
    // //   downloadFile(data.duplicates, "payment_duplicates.json");
    // //   downloadFile(data.matched, "matched_psql_entries.json");
    // //   downloadFile(data.unmatched, "unmatched_firebase_entries.json");
    // });
    // const groupedData = getUniqueMachineIds(myData)
    // axios.get("/api/test").then((response) => {
    //   console.log("done");
    //   const data = response.data;
    //   downloadFile(
    //     data.unmatchedWithCustomerInfo,
    //     "unmatched_non_duplicates_with_customer.json"
    //   );
    // });
  }

  //  function getUniqueMachineIds(data) {
  //   const machineIdSet = new Set();

  //   for (const group of data) {
  //     for (const payment of group.payments) {
  //       machineIdSet.add(payment.machine_id);
  //     }
  //   }

  //   return Array.from(machineIdSet).map(machine_id => ({ machine_id }));
  // }

  const downloadFile = (jsonData, fileName) => {
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p className="text-gray-700">This is a test page.</p>
      <div className="max-w-3xl">
      <Input value={val} onChange={(e) => setVal(e.target.value)} />
      </div>
      <Button onClick={handleClick} className="mt-4">
        Click Me
      </Button>
    </div>
  );
}
