import Machine from "@/components/machine-components/machine-component";

export default async function Page({params}) {
    const {mid} = await params
  return <Machine id={mid} />;
}
