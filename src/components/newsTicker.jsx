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
    });
  }

  return (
  data.length > 0 && (
    <div className="bg-red-600 text-white font-bold py-2 px-4 overflow-hidden relative">
      <div className="flex whitespace-nowrap animate-marquee">
        {data.concat(data).map((item, index) => (
          <span
            key={index}
            className="mx-4 before:content-['•'] before:mr-2 before:text-white"
          >
            {item.news}
          </span>
        ))}
      </div>
    </div>
  )
);

}
