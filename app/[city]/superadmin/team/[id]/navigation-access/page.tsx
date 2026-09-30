import { NavigationAccessEditor } from "@/components/features/users/navigation-access-editor";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ designation?: string }>;
}) {
  const { id } = await params;
  const { designation = "Sales" } = await searchParams;
  return <NavigationAccessEditor key={id} designation={designation} />;
}
