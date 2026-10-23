"use client";

import NotificationBadge from "@/components/shared/notifications/NotificationBadge";
import { Button } from "@/components/ui/button";
import axios from "@/lib/axios";
import { ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function TransferStockAction({
  userID,
  baseRoute,
}: {
  userID: number | string;
  baseRoute: string;
}) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!userID) return;
    let active = true;
    axios
      .get(`/${userID}/pos/transfer?view=count`)
      .then(({ data }) => {
        if (active) setPendingCount(Number(data.pending_count) || 0);
      })
      .catch(() => {
        if (active) setPendingCount(0);
      });
    return () => {
      active = false;
    };
  }, [userID]);

  return (
    <Link href={`/${baseRoute}/pos/transfer-stock`} className="block">
      <Button
        variant="outline"
        className="h-12 w-full justify-start gap-2 rounded-lg border-border bg-card px-2.5 text-left shadow-none hover:border-primary/35 hover:bg-primary/[0.04]"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
          <ArrowLeftRight className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
          Transfer Stock
        </span>
        <NotificationBadge count={pendingCount} />
      </Button>
    </Link>
  );
}
