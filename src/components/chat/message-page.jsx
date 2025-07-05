"use client";
import { db } from "@/config/firebase";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { doc, onSnapshot } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import Spinner from "../ui/spinner";
import UserChatIcon from "./chatIcon";
import Chatcomponent from "./chat-component";

export default function MessagePage() {
  const { state: UserState } = useContext(UserContext);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async (item) => {
    const info = { name: item.name, dp: item.dp, id: item.id };
    const response = await axios.post(
      `/${UserState.value.data?.id}/conversations`,
      {
        user1: UserState.value.data?.id,
        user2: item.id,
      }
    );

    if (response.data.id) {
      setSelectedConversation({
        id: response.data.id,
        user: info,
      });
    }
  };

  return (
    <>
      <div className="flex w-full">
        <div className="w-1/4 border-r p-4 overflow-y-auto">
          <h2 className="text-lg font-bold mb-4">Messages</h2>
          <div className="space-y-2">
            <UserChatIcon
              myId={UserState.value.data?.id}
              onChatSelected={(item) => {
                if (item?.id === selectedConversation?.user?.id) return;
                setLoading(true);
                handleStartConversation(item);
              }}
            />
          </div>
        </div>

        <div className="w-3/4 flex">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              No chat selected
            </div>
          ) : (
            <>
              <Chatcomponent
                id={selectedConversation?.id}
                user={{
                  name: selectedConversation?.user?.name,
                  dp: selectedConversation?.user?.dp,
                  id: selectedConversation?.user?.id,
                }}
                stateLoading={loading}
                onSetLoading={() => setLoading(false)}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
