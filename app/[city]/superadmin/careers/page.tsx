"use client"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "axios"
import { useEffect, useState } from "react"
import ResumesTable from "./resumes-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResumesResponse } from "@/lib/types"

export default function Page() {

  const { userID } = useUserDetail()
  const [data, setData] = useState<ResumesResponse | null>(null)

  useEffect(() => {
    if (userID) {
      fetchData()
    }
  }, [userID])

  async function fetchData() {
    try {
      const res = await axios.get('/api/careers/applications')
      setData(res.data)
    } catch (error) {

    }
  }

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

      <ResumesTable resumes={data?.resumes || []} />
    </div>
  )
}