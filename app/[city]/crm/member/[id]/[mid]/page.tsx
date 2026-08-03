import Machine from "@/components/features/machines/machine-component"

export default async function Page({ params }) {
  const { mid } = await params
  return <Machine id={mid} />
}
