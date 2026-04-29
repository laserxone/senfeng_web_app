import { Button } from "@/components/ui/button";
import { useMessages } from "@/hooks/use-messages";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import exportToExcel from "@/lib/exportToExcel";
import { TriggerFirebase } from "@/lib/triggerFirebase";
import { Messages, UserConversation } from "@/lib/types";
import { Clock, Send } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import Spinner from "../ui/spinner";

type ChatComponentType = {
  id: number | undefined
  user: UserConversation | null | undefined
  onSetLoading: (val: boolean) => void
  stateLoading: boolean
}
const Chatcomponent = ({ id, user = null, onSetLoading, stateLoading }: ChatComponentType) => {

  const { userID } = useUserDetail()
  const { messages: realMessages, loading } = useMessages(id);
  const [input, setInput] = useState("");
  const [tempMessages, setTempMessages] = useState<Messages[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    if (!id) return;
    onSetLoading(loading);
    setTempMessages((prev) =>
      prev.filter((tempMsg) => {
        const existsInReal = realMessages.some((realMsg) => {
          const realTime = new Date(realMsg.created_at).toISOString();
          const tempTime = new Date(tempMsg.created_at).toISOString();

          return (
            realMsg.sender_id === tempMsg.sender_id &&
            realMsg.message === tempMsg.message &&
            realTime === tempTime
          );
        });

        return !existsInReal;
      })
    );
  }, [realMessages]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [realMessages, tempMessages]);

  useEffect(() => {
    if (!userID || !realMessages.length) return;
    const unreadExists = realMessages.some(
      (msg) => Number(msg.sender_id) !== Number(userID) && !msg.is_read
    );

    if (unreadExists) {
      markAsRead();
    }
  }, [realMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const created = new Date();

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      message: input,
      created_at: created,
      sender_id: userID,
      pending: true,
    };

    setTempMessages((prev) => [...prev, tempMessage]);
    setInput("");

    axios
      .post(`/${userID}/conversations/${id}`, {
        senderId: userID,
        message: input,
        created_at: created,
      })
      .then(() => {
        if (id && user?.id) {
          TriggerFirebase(id.toString(), user?.id?.toString());
          TriggerFirebase("", userID.toString());
        }
      })
      .catch(() => {
        setTempMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      });
  };

  const markAsRead = async () => {
    try {
      await axios.put(`/${userID}/conversations/${id}/read`, {
        userId: user?.id,
      });
    } catch (err) {
      console.error("Failed to mark as read", err);
    }

    // TriggerFirebase(id.toString(), user?.id?.toString());
    // TriggerFirebase(id.toString(), userID?.toString());
  };

  const visibleRealMessages = useMemo(() => {
    return realMessages.slice(-visibleCount);
  }, [realMessages, visibleCount]);

  const combinedMessages = [...visibleRealMessages, ...tempMessages];


  const handleLoadMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + 20, realMessages.length)
    );
  };



  return (
    <div className="flex flex-col w-full h-full bg-muted/40 z-99999">
      {stateLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <Spinner />
        </div>
      ) : (
        <ScrollArea className="h-[calc(100dvh-320px)] px-5" >
          {visibleCount < realMessages.length && (
            <div className="flex justify-center my-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
              >
                Load more messages
              </Button>
            </div>
          )}
          {combinedMessages.map((item, index) => {
            const isMe = item.sender_id === userID;
            return (
              <div
                key={index}
                className={`flex flex-col gap-1 max-w-[80%] my-2 ${isMe ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
              >
                <div
                  className={`rounded-xl px-4 py-2 text-sm shadow-sm transition-all ${isMe
                    ? "bg-primary text-white"
                    : "bg-accent text-accent-foreground"
                    }`}
                >
                  <div className="text-sm">{item.message}</div>
                  {item.data && item.data.trim() && (
                    <Button
                      onClick={() => {
                        setSelectedContent(JSON.parse(item.data));
                      }}
                      variant="secondary"
                      size="sm"
                      className="m-2"
                    >
                      Open
                    </Button>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {item.pending ? (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-pulse" />
                      Sending...
                    </div>
                  ) : (
                    moment(item.created_at).format("MMM D, YYYY, h:mm A")
                  )}
                </span>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </ScrollArea>
      )}

      <div className="w-full px-5 py-4 bg-background border-t">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim()} size="icon">
            <Send size={16} />
          </Button>
        </div>
      </div>

      <RenderSelectedContent
        visible={!!selectedContent}
        data={selectedContent ? selectedContent?.content : []}
        onClose={() => setSelectedContent(null)}
        type={selectedContent ? selectedContent?.type : ""}
      />
    </div>
  );
};

const RenderSelectedContent = ({ visible, onClose, data, type }: { visible: boolean, onClose: (val: boolean) => void, data: any | null, type: string }) => {

  const [loading, setLoading] = useState(false);
  const { base_route } = useUserDetail()

  async function handleCreateExcel() {
    setLoading(true);

    const headers = [
      "Name",
      "English Name",
      "New Order",
      "Buying Price",
      "Image",
    ];

    try {
      if (data.length === 0) {
        toast.info("Please select items first.");
        return;
      }
      await exportToExcel(
        headers,
        data.map((item: any) => [
          item.chinese_name,
          item.name,
          item.new_order,
          item.buying,
          item.img,
        ]),
        "New Order.xlsx",
        true,
        "",
        true
      );
    } catch (error) {
      toast.error("Error creating excel");
    } finally {
      setLoading(false);
    }
  }

  if (type === "feedback")
    return (
      <Sheet open={visible} onOpenChange={onClose}>
        <SheetContent
          style={{ width: "100%", maxWidth: "95vw", alignItems: "flex-start" }}
        >
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl">Report</SheetTitle>
              <Label className="text-muted-foreground text-lg">
                Entries: {data.length}
              </Label>
            </div>
            <ScrollArea className="h-[80vh] px-4">
              {data.length == 0 ? (
                <div className="flex flex-1 flex-col gap-2">
                  <p>No data to display</p>
                </div>
              ) : (
                <div className="px-4 py-6 space-y-2 border-l-2 border-muted relative">
                  {data.map((fb: any) => (
                    <div key={fb.id} className="relative pl-6">
                      {/* Dot on the timeline */}
                      <div className="absolute left-[-9px] top-2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-md" />

                      {/* Card content */}
                      <Card className="bg-background border border-border shadow-sm">
                        <CardHeader className="pb-0">
                          <div className="text-sm text-muted-foreground">
                            <span className="mr-2">{fb?.user_name}</span>
                            {moment(fb.feedback_date).format("YYYY-MM-DD")}
                          </div>
                          <Link
                            target="blank"
                            href={`/${base_route}/member/${fb.customer_id}`}
                          >
                            <div className="text-base font-semibold text-foreground hover:underline">
                              {`${fb.name} - ${fb.owner} - ${fb.location}`}
                            </div>
                          </Link>
                        </CardHeader>

                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm">
                          <div>
                            <span className="font-medium text-foreground">
                              Manager:
                            </span>{" "}
                            {fb?.ownership_name || "NIL"}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">
                              Number:
                            </span>{" "}
                            {fb.number}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">
                              Status:
                            </span>{" "}
                            {fb.status}
                          </div>

                          <div className="col-span-full pt-2 border-t mt-2 text-foreground whitespace-pre-line">
                            <p className="mt-2">
                              {fb.feedback || (
                                <em className="text-muted-foreground">
                                  No feedback provided.
                                </em>
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  if (type === "neworder")
    return (
      <Sheet open={visible} onOpenChange={onClose}>
        <SheetContent
          style={{ width: "100%", maxWidth: "95vw", alignItems: "flex-start" }}
        >
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl">New Stock Order</SheetTitle>
              <Label className="text-muted-foreground text-lg">
                Entries: {data.length}
              </Label>
              <Button disabled={data.length === 0} onClick={handleCreateExcel}>
                {loading && <Spinner className="mr-2" />}
                Export
              </Button>
            </div>
            <ScrollArea className="h-[80vh] px-4">
              {data.length == 0 ? (
                <div className="flex flex-1 flex-col gap-2">
                  <p>No data to display</p>
                </div>
              ) : (
                <div className="px-4 py-6 space-y-2 border-l-2 border-muted relative">
                  {data.map((item: any, index: number) => (
                    <RenderOtherStockItems key={index} item={item} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
};

const RenderOtherStockItems = ({ item }: { item: any }) => {
  return (
    <div
      className={`w-full border border-gray-300 rounded-lg shadow-md p-5 flex flex-col`}
    >
      <div className="flex flex-1 flex-row justify-between">
        <div className="w-1/3">
          <p>{item.name}</p>
          <p>{item.chinese_name}</p>
        </div>
        <p className="w-1/3">New order: {item.new_order}</p>
        <p className="w-1/3">Buying ¥: {item.buying}</p>
      </div>
    </div>
  );
};

export default Chatcomponent;
