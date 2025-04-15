// lib/axios.js
import axios from 'axios'
import { BASE_URL } from '@/constants/data'
import { toast } from '@/hooks/use-toast'

const axiosInstance = axios.create({
  baseURL: BASE_URL
 
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
