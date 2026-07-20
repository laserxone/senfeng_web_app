import MemberDetail from '@/components/features/customers/components/detail/member-detail'

export default async function page({params} : {params : Promise<{id : string}>}) {
    const {id} = await params
  return (
  <MemberDetail from={"member"} ownership={true} customer_id={id} height={"h-[calc(100dvh-300px)]"} route={true}/>
  )
}