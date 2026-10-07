"use client";

import { Card, CardContent } from "@/components/ui/card";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { Banknote, Landmark, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";

type Balances = { cash: string; bank: string };

const amountFormatter = new Intl.NumberFormat("en-PK", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function OfficeFundBalance({

  total,
}: {

  total?: number;
}) {
  const { userID, isAdmin } = useUserDetail();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [failed, setFailed] = useState(false);
  const loading = !balances && !failed;

  useEffect(() => {
    if (!userID) return;

    let active = true;
    axios
      .get<Balances>(`/${userID}/office-funds`)
      .then(({ data }) => {
        if (active) setBalances(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [userID]);

  const displayAmount = (amount: string | undefined) => {
    if (loading) return "Loading...";
    if (failed || amount === undefined) return "Unavailable";
    return `PKR ${amountFormatter.format(Number(amount))}`;
  };

  const showValues = (isAdmin ? 2 : 1) + (total === undefined ? 0 : 1);
  const grid = `sm:grid-cols-${showValues}`

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className={`grid gap-3 ${grid} `}>
        {total !== undefined && <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <WalletCards className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total Cash Flow</p>
              <p className="truncate text-lg font-semibold tabular-nums">
                PKR {amountFormatter.format(total)}
              </p>
            </div>
          </CardContent>
        </Card>}
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Banknote className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Available cash balance
              </p>
              <p className="truncate text-lg font-semibold tabular-nums">
                {displayAmount(balances?.cash)}
              </p>
            </div>
          </CardContent>
        </Card>

        {isAdmin && <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Landmark className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Available bank balance
              </p>
              <p className="truncate text-lg font-semibold tabular-nums">
                {displayAmount(balances?.bank)}
              </p>
            </div>
          </CardContent>
        </Card>}
      </div>
    </div>
  );
}
