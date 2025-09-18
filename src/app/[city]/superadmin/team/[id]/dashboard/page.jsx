import UserDashboard from "@/components/user-dashboard"
import { use } from "react"

export default function Page ({params}){
const {id} = use(params)

if(!id) return 

return (
    <UserDashboard id={id}/>
)
}