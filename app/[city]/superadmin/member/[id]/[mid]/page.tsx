import Machine from "@/components/features/machines/machine-component";

export default async function Page({params} : {params : Promise<{mid : string}>}) {
    const {mid} = await params
  return <Machine id={mid} />;
}
