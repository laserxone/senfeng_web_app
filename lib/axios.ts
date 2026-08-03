import axiosInstance from "axios"
import { BASE_URL } from "@/constants/data"
import { toast } from "sonner"

declare module "axios" {
  interface AxiosRequestConfig {
    cancelKey?: string
  }

  interface InternalAxiosRequestConfig {
    cancelKey?: string
  }
}

let userOffice = ""
const pendingRequests = new Map<string, AbortController>()

export const cancelRequest = (cancelKey: string) => {
  pendingRequests.get(cancelKey)?.abort()
  pendingRequests.delete(cancelKey)
}

export const setUserOffice = (office: string) => {
  userOffice = office?.toLowerCase() || ""
}

const axios = axiosInstance.create({
  baseURL: BASE_URL,
})

axios.interceptors.request.use((config) => {
  const requestUrl = config.url || ""

  const isUserDetailRequest =
    requestUrl.includes("/userdetail") ||
    requestUrl.startsWith("userdetail") ||
    requestUrl.startsWith("/userdetail")

  config.baseURL = isUserDetailRequest ? BASE_URL : `${BASE_URL}${userOffice}`

  config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
  config.headers["Pragma"] = "no-cache"
  config.headers["Expires"] = "0"

  if (config.cancelKey) {
    pendingRequests.get(config.cancelKey)?.abort()

    const controller = new AbortController()
    pendingRequests.set(config.cancelKey, controller)
    config.signal = controller.signal
  }

  return config
})

function clearPendingRequest(config?: {
  cancelKey?: string
  signal?: unknown
}) {
  if (!config?.cancelKey) return

  const currentController = pendingRequests.get(config.cancelKey)
  if (currentController?.signal === config.signal) {
    pendingRequests.delete(config.cancelKey)
  }
}

axios.interceptors.response.use(
  (response) => {
    clearPendingRequest(response.config)
    return response
  },
  (error) => {
    clearPendingRequest(error?.config)
    if (axiosInstance.isCancel(error) || error?.code === "ERR_CANCELED") {
      return Promise.reject(error)
    }

    const message =
      error?.response?.data?.message || error?.message || "Something went wrong"
    toast.error(message)

    return Promise.reject(error)
  }
)

export default axios
