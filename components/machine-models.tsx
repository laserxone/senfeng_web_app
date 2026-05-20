import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import Spinner from "./ui/spinner";


export default function MachineModels({ value, onValueChange }: { value?: string, onValueChange: (val: string) => void }) {

    const { userID } = useUserDetail()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (userID) fetchData()
    }, [userID])

    async function fetchData() {
        setLoading(true)

        try {
            const res = await axios.get(`/${userID}/settings`)
            setItems(res.data?.machine_models || [])
        } finally {
            setLoading(false)
        }

    }

    return (
        loading ? <Spinner /> :
            <Select
                value={value}
                onValueChange={onValueChange}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                    {items.map((item) => (

                        <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
    )
}