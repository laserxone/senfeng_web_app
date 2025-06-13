"use client";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function Page() {
  async function handleClick() {
    await axios.get("/api/test").then((response) => {
       
      const data = response.data;
      console.log("done")

    //   downloadFile(data.duplicates, "payment_duplicates.json");
    //   downloadFile(data.matched, "matched_psql_entries.json");
    //   downloadFile(data.unmatched, "unmatched_firebase_entries.json");
    });
  }

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
      <Button onClick={handleClick} className="mt-4">
        Click Me
      </Button>
    </div>
  );
}
