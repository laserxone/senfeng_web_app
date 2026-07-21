"use client"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "axios"
import { useEffect, useState, type ElementType } from "react"
import ResumesTable from "./resumes-table"
import { Card, CardContent } from "@/components/ui/card"
import { ResumesResponse } from "@/lib/types"
import { useDebounce } from "@/hooks/use-debounce"
import { Input } from "@/components/ui/input"
import { BriefcaseBusiness, FileText, Search, UsersRound } from "lucide-react"

export default function CareerPage() {

  const { userID } = useUserDetail()
  const [data, setData] = useState<ResumesResponse | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    if (userID) {
      fetchData()
    }
  }, [userID])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await axios.get('/api/careers/applications')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = data?.resumes?.filter((item) => {
    const search = debouncedSearch.toLowerCase();

    return Object.values(item).some((value) => {
      if (typeof value === "object" && value !== null) {
        return Object.values(value).some((nestedValue) =>
          String(nestedValue).toLowerCase().includes(search)
        );
      }

      return String(value).toLowerCase().includes(search);
    });
  });

  const totalResumes = data?.resumes?.length ?? 0;
  const withCv = data?.resumes?.filter((item) => item.cvDownloadUrl).length ?? 0;
  const positions = new Set(
    data?.resumes
      ?.map((item) => item.position_applied_for)
      .filter(Boolean)
  ).size;

  return (
    <div className="flex flex-1 flex-col gap-4 pb-4">
      <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BriefcaseBusiness className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Resume Applications</h1>
                <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase sm:inline-flex">Workspace</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Review submitted applications and uploaded CVs.</p>
            </div>
          </div>

        </div>

          <div className="grid border-t bg-muted/20 sm:grid-cols-3 sm:divide-x">
            <CareerStatCard
              title="Total Resumes"
              value={totalResumes}
              icon={UsersRound}
              iconClassName="text-blue-600 dark:text-blue-400"
            />
            <CareerStatCard
              title="With CV"
              value={withCv}
              icon={FileText}
              iconClassName="text-emerald-600 dark:text-emerald-400"
            />
            <CareerStatCard
              title="Positions"
              value={positions}
              icon={BriefcaseBusiness}
              iconClassName="text-violet-600 dark:text-violet-400"
            />
          </div>
      </section>

      <Card className="rounded-2xl border-border/70 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Application Search</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Search by name, phone, location, position, status, or nested resume fields.
              </p>
            </div>
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search resume"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ResumesTable resumes={filteredData || []} onRefresh={fetchData} loading={loading} />
    </div>
  )
}

function CareerStatCard({
  title,
  value,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: number;
  icon: ElementType;
  iconClassName: string;
}) {
  return (
    <div className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0 sm:border-t-0 sm:px-5">
      <Icon className={`size-4 ${iconClassName}`} />
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{title}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>
    </div>
  )
}
