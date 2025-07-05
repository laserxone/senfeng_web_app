import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import Link from "next/link";
import { useContext, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "./ui/card";
import { Label } from "./ui/label";

const AutoScrollMembers = () => {
  const { state: UserState } = useContext(UserContext);
  const [localData, setLocalData] = useState([]);
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(
          `/${UserState.value.data?.id}/scroll`
        );
        const customers = res.data || [];

        const temp = [...customers]
          .filter((item) => item.name?.trim() || item.owner?.trim())
          .map((item) => ({
            ...item,
            name:
              item.name?.trim() ||
              `${item.owner?.trim() || ""} ${
                item.location?.trim() || ""
              }`.trim(),
          }))
          .filter((item) => !!item.name)
          .sort((a, b) => a.name.localeCompare(b.name));

        setLocalData(temp);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    }

    if (UserState.value.data?.id) {
      fetchData();
    }
  }, [UserState.value.data?.id]);

  useEffect(() => {
    if (localData.length === 0) return;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollSpeed = 1;
    let direction = 1;
    let interval;

    const scroll = () => {
      if (!isHovered) {
        if (
          scrollContainer.scrollTop + scrollContainer.clientHeight >=
          scrollContainer.scrollHeight
        ) {
          scrollContainer.scrollTop = 0;
        } else {
          scrollContainer.scrollTop += scrollSpeed * direction;
        }
      }
    };

    const startScrolling = () => {
      interval = setInterval(scroll, 10);
    };

    const stopScrolling = () => {
      clearInterval(interval);
    };

    scrollContainer.addEventListener("mouseenter", () => {
      setIsHovered(true);
      stopScrolling();
    });

    scrollContainer.addEventListener("mouseleave", () => {
      setIsHovered(false);
      startScrolling();
    });

    startScrolling();

    return () => {
      stopScrolling();
      scrollContainer.removeEventListener("mouseenter", stopScrolling);
      scrollContainer.removeEventListener("mouseleave", startScrolling);
    };
  }, [isHovered, localData]);

  const colors = [
    "bg-red-300",
    "bg-blue-300",
    "bg-green-300",
    "bg-yellow-300",
    "bg-purple-300",
    "bg-pink-300",
    "bg-teal-300",
    "bg-orange-300",
  ];

  if (localData.length == 0) return null;

  const duplicatedList = [...localData, ...localData];
  return (
    <Card style={{ height: "100%" }}>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={scrollRef} className="h-[calc(100dvh-200px)] no-scrollbar overflow-y-auto">
          {duplicatedList.map((item, index) => {
            const randomColor = colors[index % colors.length];
            return (
              <Link
                key={index}
                className="flex items-center m-2 cursor-pointer"
                href={`/${UserState.value.data?.base_route}/${
                  item.member ? "member" : "customer"
                }/${item.id}`}
              >
                <Avatar className="w-12 h-12 mr-4 ">
                  <AvatarImage src="/" alt="Customer Picture" />
                  <AvatarFallback className={`text-white ${randomColor}`}>
                    {item?.name?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <Label style={{ fontWeight: "600" }}>
                  {item?.name?.substring(0, 20)}
                </Label>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoScrollMembers;
