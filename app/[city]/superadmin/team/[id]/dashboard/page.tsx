import UserDashboard from "@/components/page-compositions/general/user-dashboard"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    if (!id) return

    return (
        <UserDashboard id={id as string} />
    )
}