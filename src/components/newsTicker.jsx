"use client";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axiosInstance from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { useContext, useEffect, useState } from "react";
import Marquee from "react-fast-marquee";

export default function NewsTicker() {
  const { userID } = useUserDetail();
  const isMobile = useIsMobile();
  const [data, setData] = useState([]);

  const debouncedUserId = useDebounce(userID, 1000);

  useEffect(() => {
    if (debouncedUserId) {
      fetchData();
    }
  }, [debouncedUserId]);

  async function fetchData() {
    axiosInstance
      .get(`/${debouncedUserId}/news?expiry=true`)
      .then((response) => {
        const apiData = response.data;
        setData(apiData);
      });
  }
  if (!isMobile)
    return (
      data.length > 0 && (
        <Marquee
          className="bg-red-500 text-white"
          speed={100}
          style={{ fontSize: "17px" }}
        >
          {data.map((item, index) => (
            <div key={index} className="mx-2">
              {item.news}
            </div>
          ))}
        </Marquee>
      )
    );
}
