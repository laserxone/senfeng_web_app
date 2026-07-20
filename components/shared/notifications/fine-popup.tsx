"use client";

import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useFines } from "@/hooks/use-fine";
import axios from "@/lib/axios";
import useUserDetail from "@/hooks/use-user-detail";

export default function FinePopup() {
  const [open, setOpen] = useState(false);
  const { userID } = useUserDetail();
  const { fine } = useFines();

  useEffect(() => {
    if (fine?.id) {
      // setOpen(true);
    }
  }, [fine]);

  async function handleRead(id : number | undefined) {
    if(!id) return
    setOpen(false);
    axios.put(`/${userID}/fine/${id}`, { is_read: true });
  }
  return (
    <Dialog open={open}>
      <DialogOverlay />
      <DialogContent className="max-w-lg p-10 text-center rounded-2xl">
        <DialogTitle className="text-2xl font-bold text-red-600 mb-4">
          🚨 You Have Been Fined!
        </DialogTitle>

        <p className="text-lg mb-2">
          <span className="font-semibold">Amount:</span> {fine?.amount}
        </p>
        <p className="text-lg mb-6">
          <span className="font-semibold">Reason:</span> {fine?.reason}
        </p>
        <Button onClick={() => handleRead(fine?.id)} className="w-full">
          OK, Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
