import MemberDetail from '@/components/customer-components/detail/member-detail'

export default async function page({params}) {
    const {id} = await params
  return (
  <MemberDetail from={"customer"} ownership={true} customer_id={id} base="superadmin" height={"h-[calc(100dvh-300px)]"} route={true}/>
  )
}