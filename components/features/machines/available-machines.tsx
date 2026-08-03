"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { AvailableMachinesProps } from "@/lib/types"
import { cn } from "@/lib/utils"

type LocalAvailableMachines = AvailableMachinesProps & {
  baseLabel: string
  value: number
  label: string
  colorFlag: string
  bgColorClass: string
  textColorClass: string
}

export function AvailableMachines({
  value,
  onReturn,
  placeholder = "Select machine...",

  onReturnItem = () => {},
}: {
  value: number | null
  onReturn: React.Dispatch<React.SetStateAction<number | null>>
  onReturnItem: (val: LocalAvailableMachines) => void
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<LocalAvailableMachines[]>([])
  const { userID } = useUserDetail()
  React.useEffect(() => {
    async function fetchData() {
      axios
        .get(`/${userID}/available-machines`)
        .then((response: { data: AvailableMachinesProps[] }) => {
          if (response.data.length > 0) {
            const apiData = response.data

            let finalData = apiData.map((item) => ({
              ...item,
              baseLabel: `${item.machine_model} ${item.machine_power} ${item.machine_source}`,
              value: item.id,
            }))

            finalData = finalData.sort((a, b) =>
              a.baseLabel.localeCompare(b.baseLabel)
            )

            const labelColorMap = new Map()
            const labelCounter = new Map()

            const colorClasses = [
              { bg: "bg-red-100", text: "text-red-800" },
              { bg: "bg-blue-100", text: "text-blue-800" },
              { bg: "bg-green-100", text: "text-green-800" },
              { bg: "bg-yellow-100", text: "text-yellow-800" },
              { bg: "bg-purple-100", text: "text-purple-800" },
              { bg: "bg-pink-100", text: "text-pink-800" },
              { bg: "bg-indigo-100", text: "text-indigo-800" },
              { bg: "bg-teal-100", text: "text-teal-800" },
              { bg: "bg-orange-100", text: "text-orange-800" },
              { bg: "bg-gray-100", text: "text-gray-800" },
            ]

            let colorIndex = 0

            finalData = finalData.map((item) => {
              const labelKey = item.baseLabel

              if (!labelColorMap.has(labelKey)) {
                labelColorMap.set(
                  labelKey,
                  colorClasses[colorIndex % colorClasses.length]
                )
                colorIndex++
              }

              const count = (labelCounter.get(labelKey) || 0) + 1
              labelCounter.set(labelKey, count)

              const color = labelColorMap.get(labelKey)

              return {
                ...item,
                label: `${count} - ${labelKey}`,
                colorFlag: `${color.bg} ${color.text}`,
                bgColorClass: color.bg,
                textColorClass: color.text,
              }
            })

            setData(finalData as LocalAvailableMachines[])
          }
        })
    }
    if (userID) {
      fetchData()
    }
  }, [userID])

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={(e) => {
          e.preventDefault()
          setOpen(!open)
        }}
      >
        {value ? data.find((item) => item.value === value)?.label : placeholder}
        <ChevronsUpDown className="opacity-50" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search machine..." className="h-9" />
          <CommandList>
            <CommandEmpty>No machine found.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  className={item.colorFlag}
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onReturn(Number(item.value))
                    onReturnItem(item)
                    setOpen(false)
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
