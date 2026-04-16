"use client";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { useState } from "react";
import Chatcomponent from "./chat-component";
import UserChatIcon from "./chatIcon";

export default function MessagePage() {
  const {userID} = useUserDetail()
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async (item) => {
  
    const response = await axios.post(
      `/${userID}/conversations`,
      {
        user1: userID,
        user2: item.id,
      }
    );

    if (response.data.id) {
      setSelectedConversation({
        id: response.data.id,
       user: response.data?.otherUser
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
              myId={userID}
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
