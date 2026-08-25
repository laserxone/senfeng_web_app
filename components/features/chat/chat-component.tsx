import { Button } from "@/components/ui/button";
import { useMessages } from "@/hooks/use-messages";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import exportToExcel from "@/lib/exportToExcel";
import { TriggerFirebase } from "@/lib/triggerFirebase";
import { Messages, UserConversation } from "@/lib/types";
import { Clock, Reply, Send, SmilePlus, X } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import exportToPdf, { PdfImageCell } from "@/lib/exportToPdf";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/config/firebase";
import { convertImageToPngDataUrl } from "../pos/order-stock-dialog";

type ChatComponentType = {
  id: number | undefined;
  user: UserConversation | null | undefined;
  onSetLoading: (val: boolean) => void;
  stateLoading: boolean;
};
const Chatcomponent = ({
  id,
  user = null,
  onSetLoading,
  stateLoading,
}: ChatComponentType) => {
  const { userID } = useUserDetail();
  const { messages: realMessages, loading } = useMessages(id);
  const [input, setInput] = useState("");
  const [tempMessages, setTempMessages] = useState<Messages[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [replyingTo, setReplyingTo] = useState<Messages | null>(null);
  const [reactionMenuFor, setReactionMenuFor] = useState<
    string | number | null
  >(null);

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
      }),
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
      (msg) => Number(msg.sender_id) !== Number(userID) && !msg.is_read,
    );

    if (unreadExists) {
      markAsRead();
    }
  }, [realMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const created = new Date();

    const tempId = `temp-${Date.now()}`;
    const replyToMessageId = replyingTo?.id;
    const tempMessage: Messages = {
      id: tempId,
      message: input,
      created_at: created,
      sender_id: userID,
      pending: true,
      reply_to_message_id: replyToMessageId ?? null,
      reply_to: replyingTo
        ? {
            id: replyingTo.id,
            sender_id: replyingTo.sender_id,
            message: replyingTo.message,
          }
        : null,
    };

    setTempMessages((prev) => [...prev, tempMessage]);
    setInput("");
    setReplyingTo(null);

    axios
      .post(`/${userID}/conversations/${id}`, {
        senderId: userID,
        message: input,
        created_at: created,
        replyToMessageId,
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

  const toggleReaction = async (messageId: string | number, emoji: string) => {
    const current = combinedMessages.find(
      (message) => message.id === messageId,
    );
    const mine = current?.reactions
      ?.find((reaction) => reaction.emoji === emoji)
      ?.userIds.some((id) => Number(id) === Number(userID));
    try {
      await axios({
        method: mine ? "delete" : "post",
        url: `/${userID}/conversations/${id}/reactions`,
        data: { messageId, userId: userID, emoji },
      });
      if (id && user?.id) {
        await TriggerFirebase(id.toString(), user.id.toString());
        await TriggerFirebase("", userID.toString());
      }
    } finally {
      setReactionMenuFor(null);
    }
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
    setVisibleCount((prev) => Math.min(prev + 20, realMessages.length));
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-muted/30">
      {stateLoading || loading ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Spinner />
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1 px-4 sm:px-6">
          {visibleCount < realMessages.length && (
            <div className="my-3 flex justify-center">
              <Button variant="outline" size="sm" onClick={handleLoadMore}>
                Load more messages
              </Button>
            </div>
          )}
          {combinedMessages.map((item, index) => {
            const isMe = item.sender_id === userID;
            return (
              <div
                key={index}
                className={`my-2 flex max-w-[80%] flex-col gap-1 ${
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`rounded-xl px-4 py-2 text-sm shadow-sm transition-all ${
                    isMe
                      ? "bg-primary text-white"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  {item.reply_to ? (
                    <div
                      className={`mb-2 border-l-2 pl-2 text-xs ${isMe ? "border-primary-foreground/60 text-primary-foreground/80" : "border-primary/60 text-muted-foreground"}`}
                    >
                      <p className="font-medium">
                        {Number(item.reply_to.sender_id) === Number(userID)
                          ? "You"
                          : user?.name}
                      </p>
                      <p className="line-clamp-1">{item.reply_to.message}</p>
                    </div>
                  ) : null}
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
                <div className="flex flex-wrap items-center gap-1">
                  {item.reactions?.map((reaction) => {
                    const reacted = reaction.userIds.some(
                      (reactionUserId) =>
                        Number(reactionUserId) === Number(userID),
                    );
                    return (
                      <button
                        key={reaction.emoji}
                        type="button"
                        onClick={() =>
                          void toggleReaction(item.id, reaction.emoji)
                        }
                        className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${reacted ? "border-primary/40 bg-primary/10" : "bg-background hover:bg-muted"}`}
                      >
                        {reaction.emoji} {reaction.userIds.length}
                      </button>
                    );
                  })}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="size-6"
                      onClick={() =>
                        setReactionMenuFor(
                          reactionMenuFor === item.id ? null : item.id,
                        )
                      }
                      aria-label="Add reaction"
                    >
                      <SmilePlus className="size-3.5" />
                    </Button>
                    {reactionMenuFor === item.id ? (
                      <div className="absolute z-10 mt-1 flex gap-1 rounded-lg border bg-popover p-1 shadow-md">
                        {[
                          "\u{1F44D}",
                          "\u2764\uFE0F",
                          "\u{1F602}",
                          "\u{1F389}",
                          "\u{1F440}",
                        ].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="grid size-7 place-items-center rounded hover:bg-muted"
                            onClick={() => void toggleReaction(item.id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-6"
                    onClick={() => setReplyingTo(item)}
                    aria-label="Reply to message"
                  >
                    <Reply className="size-3.5" />
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {item.pending ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 animate-pulse" />
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

      <div className="w-full border-t bg-background px-4 py-3 sm:px-5">
        {replyingTo ? (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
            <div className="min-w-0">
              <p className="font-medium">
                Replying to{" "}
                {Number(replyingTo.sender_id) === Number(userID)
                  ? "yourself"
                  : user?.name}
              </p>
              <p className="truncate text-muted-foreground">
                {replyingTo.message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setReplyingTo(null)}
              aria-label="Cancel reply"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : null}
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

const RenderSelectedContent = ({
  visible,
  onClose,
  data,
  type,
}: {
  visible: boolean;
  onClose: (val: boolean) => void;
  data: any | null;
  type: string;
}) => {
  const [loading, setLoading] = useState(false);
  const { base_route, userID } = useUserDetail();

  async function handleCreatePdf() {
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
          toast.info("No items selected");
          return;
        }
  
        const formattedData = await Promise.all(
          data.map(async (item : any) => {
            let image: PdfImageCell = { type: "image", alt: "No image found" };
  
            if (item.img) {
              try {
                const url = await getDownloadURL(
                  ref(storage, `products/${item.img}`),
                );
                image = {
                  type: "image",
                  url,
                  data: await convertImageToPngDataUrl(url),
                  alt: "Product image",
                };
              } catch {
                // The PDF renderer shows a consistent fallback when an image URL
                // is unavailable or Firebase cannot resolve it.
              }
            }
  
            return [
              item.chinese_name || "No chinese name",
              item.name || "Unnamed product",
              item.new_order ?? 0,
              item.buying ?? 0,
              image,
            ];
          }),
        );
  
        await exportToPdf(headers, formattedData, "New Order.pdf", userID);
      } catch (error) {
        console.log(error);
        toast.error("Error creating PDF");
      } finally {
        setLoading(false);
      }
    }

  // async function handleCreateExcel() {
  //   setLoading(true);

  //   const headers = [
  //     "Name",
  //     "English Name",
  //     "New Order",
  //     "Buying Price",
  //     "Image",
  //   ];

  //   try {
  //     if (data.length === 0) {
  //       toast.info("Please select items first.");
  //       return;
  //     }
  //     await exportToExcel(
  //       headers,
  //       data.map((item: any) => [
  //         item.chinese_name,
  //         item.name,
  //         item.new_order,
  //         item.buying,
  //         item.img,
  //       ]),
  //       "New Order.xlsx",
  //       true,
  //       "",
  //       true,
  //       userID,
  //     );
  //   } catch (error) {
  //     toast.error("Error creating excel");
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  if (type === "feedback")
    return (
      <Sheet open={visible} onOpenChange={onClose}>
        <SheetContent
          style={{ width: "100%", maxWidth: "95vw", alignItems: "flex-start" }}
        >
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl">Report</SheetTitle>
              <Label className="text-lg text-muted-foreground">
                Entries: {data.length}
              </Label>
            </div>
            <ScrollArea className="h-[80vh] px-4">
              {data.length == 0 ? (
                <div className="flex flex-1 flex-col gap-2">
                  <p>No data to display</p>
                </div>
              ) : (
                <div className="relative space-y-2 border-l-2 border-muted px-4 py-6">
                  {data.map((fb: any) => (
                    <div key={fb.id} className="relative pl-6">
                      {/* Dot on the timeline */}
                      <div className="absolute top-2 left-[-9px] h-3 w-3 rounded-full border-2 border-background bg-primary shadow-md" />

                      {/* Card content */}
                      <Card className="border border-border bg-background shadow-sm">
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

                        <CardContent className="grid grid-cols-1 gap-4 pt-2 text-sm sm:grid-cols-2">
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

                          <div className="col-span-full mt-2 border-t pt-2 whitespace-pre-line text-foreground">
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
          <SheetHeader className="w-full">
            <div className="flex items-center justify-between w-full pr-6">
              <SheetTitle className="text-2xl">New Stock Order</SheetTitle>
              <Label className="text-lg text-muted-foreground">
                Entries: {data.length}
              </Label>
              <Button disabled={data.length === 0 || loading} onClick={handleCreatePdf}>
                {loading && <Spinner className="mr-2" />}
                Export PDF
              </Button>
            </div>
            
          </SheetHeader>
          <ScrollArea className="h-[80vh] px-4 w-full">
              {data.length == 0 ? (
                <div className="flex flex-1 flex-col gap-2">
                  <p>No data to display</p>
                </div>
              ) : (
                <div className="relative space-y-2 border-l-2 border-muted px-4 py-6">
                  {data.map((item: any, index: number) => (
                    <RenderOtherStockItems key={index} item={item} />
                  ))}
                </div>
              )}
            </ScrollArea>
        </SheetContent>
      </Sheet>
    );
};

const RenderOtherStockItems = ({ item }: { item: any }) => {
  return (
    <div
      className={`flex w-full flex-col rounded-lg border border-gray-300 p-5 shadow-md`}
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
