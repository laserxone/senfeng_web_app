import Machine from "@/components/customer-components/machine/machine-component";

export default async function Page({params}) {
    const {mid} = await params
  return <Machine params={params} id={mid}/>;
}
