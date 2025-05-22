import axiosInstance from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { useContext, useEffect, useState } from "react";

export default function NewsTicker() {
  const { state: UserState } = useContext(UserContext);
  const [data, setData] = useState([]);
  useEffect(() => {
    if (UserState.value.data?.id) {
      fetchData();
    }
  }, [UserState]);

  async function fetchData() {
    axiosInstance.get("/news").then((response) => {
      const apiData = response.data;
      setData(apiData);
      let temp = "";
      apiData.map((item) => {
        temp += ` ${item.news}`;
      });
      //   setData(temp)
    });
  }

  return (
    <div className="bg-red-600 text-white font-bold py-2 px-4 flex items-center overflow-hidden relative">
      <div className="animate-marquee whitespace-nowrap">
        {data.map((item, index) => (
          <span
            key={index}
            className="mx-4 before:content-['•'] before:mr-2 before:text-white"
          >
            {item.news}
          </span>
        ))}
      </div>
    </div>
  );
}
