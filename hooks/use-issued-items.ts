import { useEffect, useState } from "react";
import useUserDetail from "./use-user-detail";
import axios from "@/lib/axios";


export default function useIssuedItem() {
    const [issuedItems, setIssuedItems] = useState([])
    const { userID } = useUserDetail()

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