"use client";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { X } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCount } from "./NotificationBadge";
import { ScrollArea } from "./ui/scroll-area";

type InfoProps = {
  id: number
  link: string
  title: string
  date: string
}

const FloatingInformation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [info, setInfo] = useState<InfoProps[]>([]);
  const { base_route, userID } = useUserDetail();
  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    axios.get(`/${userID}/reminders`).then((response) => {
      setInfo(response.data);
    });
  }

  const today = moment().startOf("day");

  const grouped = {
    today: info.filter((t) => moment(t.date).isSame(today, "day")),
    passed: info.filter((t) => moment(t.date).isBefore(today, "day")),
    upcoming: info.filter((t) => moment(t.date).isAfter(today, "day")),
  };

  return (
    <>
      <FloatingInfoButton
        onClick={() => setIsOpen(!isOpen)}
        pending={info.length}
        visible={info.length > 0}
      />

      <div
        className={`absolute bottom-0 right-0  w-[calc(100vw-30px)] sm:w-96 h-[600px]
    bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col
    overflow-hidden border transition-all duration-200 z-10 sm:mx-0 ${isOpen ? "block" : "hidden"
          }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
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

const FloatingInfoButton = ({ pending, onClick, visible }: { pending: number, visible: boolean, onClick: () => void }) => {
  if (visible)
    return (
      <div>
        <BadgeCount count={pending} offset={{ top: 0, right: 0 }}>
          <div
            onClick={onClick}
            className="cursor-pointer
    bg-gradient-to-br from-orange-500 via-pink-500 to-red-500
    text-white h-[50px] w-[50px] shadow-2xl flex items-center justify-center
    hover:scale-90 active:scale-95 transition-transform duration-200 ease-in-out
    rounded-full rounded-bl-2xl relative"
          >
            <span className="relative drop-shadow-lg text-xl">⏰</span>
          </div>
        </BadgeCount>
      </div>
    );
};

export default FloatingInformation;
