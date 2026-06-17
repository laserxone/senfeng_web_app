import { useEffect, useState } from "react";
import useUserDetail from "./use-user-detail";
import axios from "@/lib/axios";
import { UserReturnableType } from "@/lib/types";


export default function useIssuedItem(userID : number | string) {
    const [issuedItems, setIssuedItems] = useState<UserReturnableType[]>([])
  
    useEffect(() => {

        function fetchData() {
            axios.get(`/${userID}/issued`).then((response) => {
                setIssuedItems(response.data)
            }).catch((e) => {
                console.log(e)
            })
        }

        if (userID) {
            fetchData()
        }
    }, [userID])

    return { issuedItems }
}