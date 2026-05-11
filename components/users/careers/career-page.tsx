"use client"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "axios"
import { useEffect, useState } from "react"
import ResumesTable from "./resumes-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResumesResponse } from "@/lib/types"
import { useDebounce } from "@/hooks/use-debounce"
import { Input } from "@/components/ui/input"

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

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between gap-4 mt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Resume Applications
          </h1>
          <p className="text-sm text-muted-foreground">
            View submitted applications and open uploaded CVs.
          </p>
        </div>


        <Card className="w-[190px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Resumes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data?.resumes?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Input placeholder="Search resume" className="max-w-xl" value={search} onChange={(e) => setSearch(e.target.value)} />


      <ResumesTable resumes={filteredData || []} onRefresh={fetchData} loading={loading} />
    </div>
  )
}