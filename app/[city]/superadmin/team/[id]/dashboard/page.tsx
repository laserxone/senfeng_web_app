import UserDashboard from "@/components/user-dashboard"
import { useParams } from "next/navigation"

export default function Page() {
    const { id } = useParams()

    if (!id) return

    return (
        <UserDashboard id={id} owner={true} />
    )
}