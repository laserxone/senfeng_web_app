// lib/axios.js
import axiosInstance from "axios";
import { BASE_URL } from "@/constants/data";
import { toast } from "@/hooks/use-toast";

let userOffice = "";

export const setUserOffice = (office) => {
  userOffice = office?.toLowerCase() || "";
};

const axios = axiosInstance.create({
  baseURL: BASE_URL,
});

axios.interceptors.request.use((config) => {
  const requestUrl = config.url || "";

  const isUserDetailRequest =
    requestUrl.includes("/userdetail") ||
    requestUrl.startsWith("userdetail") ||
    requestUrl.startsWith("/userdetail");

  config.baseURL = isUserDetailRequest ? BASE_URL : `${BASE_URL}${userOffice}`;

  config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  config.headers["Pragma"] = "no-cache";
  config.headers["Expires"] = "0";

  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";
    console.log(2);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });

    return Promise.reject(error);
  },
);

export default axios;
