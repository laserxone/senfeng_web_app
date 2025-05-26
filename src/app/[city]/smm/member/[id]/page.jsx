import MemberDetail from '@/components/customer-components/detail/member-detail'

export default async function page({params}) {
    const {id} = await params
  return (
  <MemberDetail from={"member"} ownership={true} customer_id={id}/>
  )
}