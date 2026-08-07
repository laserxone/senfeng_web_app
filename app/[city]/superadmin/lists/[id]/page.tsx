import ListDetailPage from "@/components/features/lists/list-detail-page";

export default async function page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListDetailPage id={id as string} />;
}
