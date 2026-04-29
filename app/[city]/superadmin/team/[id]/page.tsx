import DetailComponent from "@/components/salary/user-detatils";

export default async function Page({params} : {params : Promise<{id : string}>}){
  const {id} = await params
  return <DetailComponent id={id}/>
}