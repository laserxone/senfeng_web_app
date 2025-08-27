"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full text-center">
      <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load data: {error.message}
        </AlertDescription>
      </Alert>
      <Button onClick={() => reset()}>Try Again</Button>
      </div>
    </div>
  );
}
