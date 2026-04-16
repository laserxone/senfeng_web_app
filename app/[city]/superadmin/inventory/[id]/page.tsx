import InventoryDetail from "@/components/inventory-components/inventory-detail";

export default async function Page({params}) {
  const {id} = await params
  return <InventoryDetail booking_id={id} />;
}
