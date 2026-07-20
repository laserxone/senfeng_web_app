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
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
              <BriefcaseBusiness className="h-3.5 w-3.5 text-blue-600" />
              Hiring pipeline
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Resume Applications
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              View submitted applications, review cover letters, and open uploaded CVs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <CareerStatCard
              title="Total Resumes"
              value={totalResumes}
              icon={UsersRound}
              iconClassName="bg-blue-50 text-blue-700 ring-blue-100"
            />
            <CareerStatCard
              title="With CV"
              value={withCv}
              icon={FileText}
              iconClassName="bg-emerald-50 text-emerald-700 ring-emerald-100"
            />
            <CareerStatCard
              title="Positions"
              value={positions}
              icon={BriefcaseBusiness}
              iconClassName="bg-violet-50 text-violet-700 ring-violet-100"
            />
          </div>
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
    <div className="rounded-2xl border bg-muted/15 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${iconClassName}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
