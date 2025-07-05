"use client";

import axios from "@/lib/axios";
import { doc, onSnapshot } from "firebase/firestore";
import moment from "moment";
import { useEffect, useState } from "react";
import { ProfilePicture } from "../users/ProfilePicture";
import { db } from "@/config/firebase";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";

export default function UserChatIcon({ myId, onChatSelected }) {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");

  const fetchConversations = async () => {
    const response = await axios.get(`/${myId}/chat`);
    const convs = response.data;

    setConversations(convs);
  };

  useEffect(() => {
    if (!myId) return;

    fetchConversations();

    const unsub = onSnapshot(
      doc(db, "conversations_meta", myId.toString()),
      () => {
        fetchConversations();
      }
    );

    return () => unsub();
  }, [myId]);

  const filtered = conversations.filter((item) =>
    item?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="px-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search uesr..."
        />
      </div>
      <ScrollArea className="h-[calc(100dvh-190px)]">
        {filtered.map((item, index) => (
          <div
            key={index}
            className="w-full py-4 hover:cursor-pointer px-4 hover:bg-muted rounded"
            onClick={() => onChatSelected(item)}
          >
            <div className="flex justify-between items-start w-full">
              <div className="flex gap-3">
                <ProfilePicture
                  img={item?.dp}
                  name={item?.name}
                  className="w-10 h-10"
                />
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">{item?.name}</p>

                  <p className="text-xs font-medium truncate max-w-[160px]">
                    {item?.conversation?.last_message
                      ? `${item?.conversation?.last_message.slice(0, 25)}...`
                      : "No Message"}
                  </p>
                </div>
              </div>
              <div className="text-xs text-right">
                <p>
                  {item?.converstion?.last_updated
                    ? moment(new Date(item?.converstion?.last_updated)).format(
                        "YYYY-MM-DD hh:mm A"
                      )
                    : null}
                </p>
                <RenderReadCount unread={item?.conversation?.unreadCount} />
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </>
  );
}

const RenderReadCount = ({ unread }) => {
  if (unread && Number(unread) > 0)
    return (
      <div className="h-4 w-4 bg-red-500 text-white rounded grid place-items-center text-[10px] font-semibold">
        {unread}
      </div>
    );
};
