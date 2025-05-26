// lib/axios.js
import axios from 'axios'
import { BASE_URL } from '@/constants/data'
import { toast } from '@/hooks/use-toast'

let userOffice = '' // this will be injected from the component

export const setUserOffice = (office) => {
  userOffice = office?.toLowerCase() || ''
}

const axiosInstance = axios.create({
  // default baseURL – will be overridden by interceptor
  baseURL: BASE_URL
})

axiosInstance.interceptors.request.use(config => {
  config.baseURL = `${BASE_URL}${userOffice}`

  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';

  return config
})

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    const message =
      error?.response?.data?.message || error?.message || "Something went wrong"
    
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    })

    return Promise.reject(error)
  }
)

export default axiosInstance
