"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import axiosInstance from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { useContext, useEffect, useState } from "react";
import Marquee from "react-fast-marquee";

export default function NewsTicker() {
  const { state: UserState } = useContext(UserContext);
  const isMobile = useIsMobile();
  const [data, setData] = useState([]);
  useEffect(() => {
    if (UserState.value.data?.id) {
      fetchData();
    }
  }, [UserState]);

  async function fetchData() {
    axiosInstance.get("/news?expiry=true").then((response) => {
      const apiData = response.data;
      setData(apiData);
    });
  }
  if (!isMobile)
    return (
      data.length > 0 && (
        <Marquee className="bg-red-500 text-white" speed={100} style={{fontSize:'18px'}}>
          {data.map((item, index) => <div key={index} className="mx-2">{item.news}</div>)}
        </Marquee>
      )
    );
}
