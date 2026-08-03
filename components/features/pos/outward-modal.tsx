import PageTable from "@/components/shared/tables/app-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { InvoiceItem, OutwardProps } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit } from "lucide-react"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { FaRegFilePdf } from "react-icons/fa"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import Spinner from "@/components/ui/spinner"

const OutwardModal = ({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: Dispatch<SetStateAction<boolean>>
}) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OutwardProps[]>([])
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [createOutward, setCreateOutward] = useState<OutwardProps | null>(null)
  const { userID } = useUserDetail()

  useEffect(() => {
    if (userID && visible) {
      fetchData()
    }
    return () => {
      resetData()
    }
  }, [userID, visible])

  function resetData() {
    setLoading(false)
    setData([])
    setItems([])
    setCreateOutward(null)
  }

  async function fetchData() {
    setLoading(true)
    try {
      const res = await axios.get(`/${userID}/pos/outward`)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<OutwardProps>[] = [
    {
      accessorKey: "invoicenumber",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Gatepass No.
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="ml-2">{row.getValue("invoicenumber")}</div>
      ),
    },
    {
      accessorKey: "company",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("company")}</div>,
    },

    {
      accessorKey: "manager",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Manager
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("manager")}</div>,
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original

        return (
          <div className="flex gap-1">
            <Accordion
              type="single"
              collapsible
              className="w-[220px] rounded-xl border bg-background px-3"
            >
              <AccordionItem value="fields" className="border-none">
                <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
                  Items ({currentItem?.fields?.length ?? 0})
                </AccordionTrigger>

                <AccordionContent className="space-y-2">
                  {currentItem?.fields &&
                    currentItem?.fields?.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border px-2 py-1.5 text-xs"
                      >
                        <div className="space-y-2">
                          <Label className="text-xs">{item.description}</Label>

                          <Label className="text-sm text-muted-foreground">
                            Qty: {item.qty}
                          </Label>

                          <Label className="text-md font-semibold">
                            Rs. {item.total}
                          </Label>
                        </div>
                      </div>
                    ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {currentItem?.outward_gatepass ? (
              <Button
                variant={"ghost"}
                size={"icon"}
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const PDFData = {
                      from: currentItem?.outward_gatepass?.from_by ?? "",
                      vehicle_no:
                        currentItem?.outward_gatepass?.vehicle_no ?? "",
                      driver_name:
                        currentItem?.outward_gatepass?.driver_name ?? "",
                      received_by:
                        currentItem?.outward_gatepass?.received_by ?? "",
                      manager: currentItem?.outward_gatepass?.manager ?? "",
                      gatepass: String(currentItem?.outward_gatepass?.id ?? 0),
                      gatepassType: "Outward Gate Pass",
                      items: currentItem?.outward_gatepass?.fields ?? [],
                      created_at: currentItem?.outward_gatepass?.created_at,
                    }

                    const pdfRes = await axios.post(
                      `/${userID}/pos/outward/pdf`,
                      {
                        data: PDFData,
                      },
                      {
                        responseType: "blob",
                        headers: {
                          "Content-Type": "application/json",
                        },
                      }
                    )

                    const blob = new Blob([pdfRes.data], {
                      type: "application/pdf",
                    })

                    const url = URL.createObjectURL(blob)
                    window.open(url, "_blank")
                    setTimeout(() => URL.revokeObjectURL(url), 600000)
                  } catch (e) {
                    console.log(e)
                  }
                }}
              >
                <FaRegFilePdf className="text-red-500" />
              </Button>
            ) : (
              <Button
                variant={"ghost"}
                size={"icon"}
                onClick={() => {
                  setCreateOutward(currentItem)
                  setItems(
                    currentItem?.fields?.map((item) => ({
                      ...item,
                      name: item?.name || item?.description,
                    }))
                  )
                }}
              >
                <Edit />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      from_by: formData.get("from") as string,
      vehicle_no: formData.get("vehicle_no") as string,
      driver_name: formData.get("driver_name") as string,
      manager: formData.get("manager") as string,
      received_by: formData.get("received_by") as string,
      savedinvoice_id: createOutward?.id,
      user_id: userID,
      fields: JSON.stringify(items),
    }

    try {
      const response = await axios.post(`/${userID}/pos/outward`, data)
      const PDFData = {
        from: data.from_by,
        vehicle_no: data.vehicle_no,
        driver_name: data.driver_name,
        received_by: data.received_by,
        manager: data.manager,
        gatepass: response.data.id,
        gatepassType: "Outward Gate Pass",
        created_at: response?.data?.created_at,
        items: items || [],
      }

      const pdfRes = await axios.post(
        `/${userID}/pos/outward/pdf`,
        {
          data: PDFData,
        },
        {
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const blob = new Blob([pdfRes.data], {
        type: "application/pdf",
      })

      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
      setTimeout(() => URL.revokeObjectURL(url), 600000)
      await fetchData()
      setCreateOutward(null)
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const handleItemChange = (
    index: number,
    field: string,
    value: string | boolean | number
  ) => {
    if (field === "isExisting") {
      const copy = [...items]
      copy[index] = {
        ...copy[index],
        [field as string]: value,
        name: "",
        qty: 0,
        remarks: "",
        unit: "",
      }
      setItems(copy)
    } else {
      const copy = [...items]
      copy[index] = { ...copy[index], [field]: value }
      setItems(copy)
    }
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground transition-all duration-300 ${
          createOutward ? "sm:max-w-[90vw]" : "sm:max-w-4xl"
        }`}
      >
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <DialogTitle className="text-sm font-semibold text-foreground">
            Outward Gatepass
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)] w-full">
          <div className="w-full p-3.5 pb-4">
            <div
              className={`flex gap-6 ${
                createOutward ? "flex-row" : "flex-col"
              } w-full`}
            >
              <div
                className={`${createOutward ? "w-2/3" : "w-full"} space-y-2 px-2`}
              >
                <PageTable columns={columns} data={data} loading={loading} />
              </div>
              {createOutward && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 px-2">
                    <div>
                      <label className="text-sm font-medium">From</label>
                      <Input name="from" placeholder="Enter From" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Vehicle No</label>
                      <Input
                        name="vehicle_no"
                        placeholder="Enter Vehicle No"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Driver Name</label>
                      <Input
                        name="driver_name"
                        placeholder="Enter Driver Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Manager</label>
                      <Input
                        name="manager"
                        placeholder="Enter Manager"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Received By</label>
                      <Input
                        name="received_by"
                        placeholder="Enter Receiver Name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="space-y-4 rounded-md border p-4"
                      >
                        <div className="flex items-center justify-between">
                          <Label>Item #{index + 1}</Label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              disabled={true}
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(index, "name", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <Label>Quantity</Label>
                            <Input
                              disabled={true}
                              type="number"
                              value={item.qty ? item.qty : ""}
                              onChange={(e) => {
                                if (!isNaN(Number(e.target.value)))
                                  handleItemChange(
                                    index,
                                    "qty",
                                    Number(e.target.value)
                                  )
                              }}
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Input
                              value={item.unit}
                              onChange={(e) =>
                                handleItemChange(index, "unit", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label>Remarks</Label>
                            <Input
                              value={item.remarks ?? ""}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "remarks",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button disabled={loading} type="submit" className="w-full">
                    {loading && <Spinner />} Submit
                  </Button>
                </form>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default OutwardModal
