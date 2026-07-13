"use client";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { AlarmClock, X } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { MouseEventHandler, useEffect, useState } from "react";
import { BellNotification } from "./NotificationBadge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useChequeAlerts } from "@/hooks/use-cheque-alerts";



const FloatingInformation = () => {
  const [isOpen, setIsOpen] = useState(false);
 const {count, grouped} = useChequeAlerts()
  const { base_route } = useUserDetail();
  

  return (
    <>
      <FloatingInfoButton
        onClick={() => setIsOpen(!isOpen)}
        pending={count}
      />

      <div
        className={`absolute bottom-0 right-0  w-[calc(100vw-30px)] sm:w-96 h-[600px]
    bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col
    overflow-hidden border transition-all z-99 duration-200 z-10 sm:mx-0 ${isOpen ? "block" : "hidden"
          }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-200">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">Reminders</p>
          </div>
          <div
            className="cursor-pointer hover:text-red-500"
            onClick={() => {
              setIsOpen(!isOpen);
            }}
          >
            <X size={18} />
          </div>
        </div>

        <div className="flex-1 p-2">
          <ScrollArea className="flex-1 h-[480px] my-2 pr-4">
            <div className="space-y-6">
              <div>
                <ul className="mt-2 space-y-2">
                  {grouped.today.length > 0 && (
                    <>
                      <li className="font-semibold text-sm text-green-600">
                        Today
                      </li>
                      {grouped.today.map((t) => (
                        <Link
                          href={`/${base_route}/${t.link}`}
                          key={t.id}
                          className="flex rounded-lg border p-2 hover:bg-accent transition"
                          onClick={() => setIsOpen(!isOpen)}
                        >
                          <span>{`${t.title} to be submitted on ${moment(
                            t.date
                          ).format("YYYY-MM-DD")}`}</span>
                        </Link>
                      ))}
                    </>
                  )}

                  {grouped.passed.length > 0 && (
                    <>
                      <li className="font-semibold text-sm text-red-600">
                        Date Passed
                      </li>
                      {grouped.passed.map((t) => (
                        <Link
                          href={`/${base_route}${t.link}`}
                          key={t.id}
                          className="flex rounded-lg border p-2 hover:bg-accent transition"
                          onClick={() => setIsOpen(!isOpen)}
                        >
                          <span>{`${t.title} to be submitted on ${moment(
                            t.date
                          ).format("YYYY-MM-DD")}`}</span>
                        </Link>
                      ))}
                    </>
                  )}

                  {grouped.upcoming.length > 0 && (
                    <>
                      <li className="font-semibold text-sm text-blue-600">
                        Upcoming
                      </li>
                      {grouped.upcoming.map((t) => (
                        <Link
                          href={`/${base_route}/${t.link}`}
                          key={t.id}
                          className="flex rounded-lg border p-2 hover:bg-accent transition"
                          onClick={() => setIsOpen(!isOpen)}
                        >
                          <span>{`${t.title} to be submitted on ${moment(
                            t.date
                          ).format("YYYY-MM-DD")}`}</span>
                        </Link>
                      ))}
                    </>
                  )}
                </ul>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export const FloatingInfoButton = ({ pending, onClick }: { pending: number, onClick: MouseEventHandler<HTMLButtonElement> }) => {
  return (
    <Button size="icon" variant="outline" onClick={onClick}>
      <BellNotification Icon={AlarmClock} count={pending} />
    </Button>
  )
};

export default FloatingInformation;
