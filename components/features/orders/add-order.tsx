import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"

import { RequiredStar } from "@/components/shared/common/RequiredStar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ListPlus } from "lucide-react"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Spinner from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import axios from "@/lib/axios"
import { InventoryItem, StockProps } from "@/lib/types"
import { InventorySearch } from "@/components/shared/search/inventory-select"
import MachineModels from "@/components/features/machines/machine-models"

type InventoryErrors = Partial<Record<keyof InventoryItem, string>>[]

const AddOrderDialog = ({
  visible,
  onClose,
  user_id,
  onRefresh,
  id,
}: {
  visible: boolean
  onClose: (val: boolean) => void
  onRefresh: () => Promise<void>
  user_id: number | string
  id?: number | null
}) => {
  const [items, setItems] = useState<InventoryItem[]>([
    {
      name: "",
      qty: 1,
      price: 0,
      buying_price: 0,
      threshold: 0,
      new_order: 0,
      is_machine: true,
      machine_serial: "",
      machine_model: "",
      machine_source: "",
      machine_power: "",
      status: "Order Placed",
      isExisting: false,
      inventory_id: null,
      show: true,
    },
  ])
  const [errors, setErrors] = useState<InventoryErrors>([])
  const [loading, setLoading] = useState(false)
  const [existingInventory, setExistingInventory] = useState<StockProps[]>([])

  const [manual, setManual] = useState(false)

  useEffect(() => {
    if (visible && user_id) {
      fetchPOSInventory()
    }
  }, [visible, user_id])

  async function fetchPOSInventory() {
    axios.get(`/${user_id}/pos`).then((response) => {
      if (response.data.stock.length > 0) {
        let resultedData = [...response.data.stock]
        setExistingInventory([...resultedData])
      }
    })
  }

  const handleItemChange = <K extends keyof InventoryItem>(
    index: number,
    field: K,
    value: InventoryItem[K]
  ) => {
    setItems((prevItems) => {
      const newItems = [...prevItems]

      newItems[index] = {
        ...newItems[index],
        [field]: value,
      }

      return newItems
    })

    setErrors((prevErrors) => {
      const newErrors = [...prevErrors]

      if (newErrors[index]) {
        newErrors[index] = {
          ...newErrors[index],
          [field]: "",
        }
      }

      return newErrors
    })
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        name: "",
        qty: 1,
        price: 0,
        buying_price: 0,
        threshold: 0,
        new_order: 0,
        is_machine: true,
        machine_serial: "",
        machine_model: "",
        machine_source: "",
        machine_power: "",
        status: "Order Placed",
        isExisting: false,
        inventory_id: null,
        show: true,
      },
    ])
  }

  const removeItem = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)

    const newErrors = [...errors]
    newErrors.splice(index, 1)
    setErrors(newErrors)
  }

  const validateItems = () => {
    const newErrors: any[] = []

    items.forEach((item) => {
      const itemErrors: any = {}

      // qty required and positive
      if (!item.qty || item.qty <= 0) {
        itemErrors.qty = "Quantity is required and must be greater than 0"
      }

      if (item.isExisting) {
        // inventory_id required for existing items
        if (!item.inventory_id) {
          itemErrors.inventory_id = "Please select an existing inventory item"
        }
      } else {
        if (!item.is_machine)
          if (!item.name || item.name.trim() === "") {
            itemErrors.name = "Name is required for new items"
          }
      }

      // if machine, all machine fields required
      if (item.is_machine) {
        if (!item.machine_serial || item.machine_serial.trim() === "") {
          itemErrors.machine_serial = "Machine serial is required"
        }
        if (!item.machine_model) {
          itemErrors.machine_model = "Machine model is required"
        }
        if (!item.machine_source) {
          itemErrors.machine_source = "Machine source is required"
        }
        if (!item.machine_power) {
          itemErrors.machine_power = "Machine power is required"
        }
      }

      newErrors.push(itemErrors)
    })

    setErrors(newErrors)

    // Return true if no errors
    return newErrors.every((err) => Object.keys(err).length === 0)
  }

  const handleSubmit = async () => {
    if (validateItems()) {
      let processedItems: any[] = []

      items.forEach((item) => {
        if (item.is_machine && item.qty > 1) {
          let prefix = ""
          let baseSerial = NaN

          if (/^\d+$/.test(item.machine_serial)) {
            // Case 1: Entirely numeric
            baseSerial = parseInt(item.machine_serial, 10)
          } else {
            // Case 2: Alphanumeric, extract last number after dash
            const parts = item.machine_serial.split("-")
            const last = parts[parts.length - 1]
            const parsed = parseInt(last, 10)

            if (!isNaN(parsed)) {
              baseSerial = parsed
              prefix = parts.slice(0, parts.length - 1).join("-")
            }
          }

          if (!isNaN(baseSerial)) {
            for (let i = 0; i < item.qty; i++) {
              const newSerial = prefix
                ? `${prefix}-${baseSerial + i}`
                : (baseSerial + i).toString()

              processedItems.push({
                ...item,
                qty: 1,
                machine_serial: newSerial,
                name: newSerial,
              })
            }
          } else {
            processedItems.push(item) // Invalid base serial
          }
        } else {
          processedItems.push(item) // Not a machine or qty === 1
        }
      })

      processedItems.sort((a, b) => {
        if (a.is_machine === b.is_machine) return 0
        return a.is_machine ? 1 : -1
      })

      const payload = {
        user_id: user_id,
        status: "Order Placed",
        items: processedItems,
      }
      setLoading(true)
      try {
        const response = await axios.post(`/${user_id}/neworder/${id}`, payload)
        await onRefresh()
        handleClose(false)
      } finally {
        setLoading(false)
      }
    }
  }

  function handleClose(val: boolean) {
    onClose(val)
    setItems([
      {
        name: "",
        qty: 1,
        price: 0,
        buying_price: 0,
        threshold: 0,
        new_order: 0,
        is_machine: true,
        machine_serial: "",
        machine_model: "",
        machine_source: "",
        machine_power: "",
        status: "Order Placed",
        isExisting: false,
        inventory_id: null,
        show: true,
      },
    ])

    setErrors([])
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-3xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <ListPlus className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Add to Existing Order
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add and configure new inventory items for this order.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-3 p-3.5 pb-4 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-muted-foreground [&_label]:uppercase">
            {items.map((item, index) => (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-border bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Item #{index + 1}
                  </Label>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.isExisting}
                    onCheckedChange={(val) =>
                      handleItemChange(index, "isExisting", val)
                    }
                  />
                  <Label>
                    {item.isExisting ? "Existing Item" : "New Item"}
                  </Label>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Switch
                    checked={item.is_machine}
                    onCheckedChange={(val) =>
                      handleItemChange(index, "is_machine", val)
                    }
                  />
                  <Label>Is Machine?</Label>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Switch
                    checked={item.show}
                    onCheckedChange={(val) =>
                      handleItemChange(index, "show", val)
                    }
                  />
                  <Label>{item.show ? "Show" : "Hide"}</Label>
                </div>

                {item.isExisting ? (
                  <>
                    <div>
                      <Label>Select from Inventory</Label>

                      <InventorySearch
                        data={existingInventory}
                        value={item.inventory_id}
                        onReturn={(val) => {
                          handleItemChange(
                            index,
                            "inventory_id",
                            val?.id ?? null
                          )
                          handleItemChange(index, "name", val?.name ?? "")
                          handleItemChange(
                            index,
                            "price",
                            parseFloat(val?.price || "0")
                          )
                          handleItemChange(
                            index,
                            "buying_price",
                            parseFloat(val?.buying || "0")
                          )
                          handleItemChange(
                            index,
                            "threshold",
                            parseInt(String(val?.threshold) || "0")
                          )
                          handleItemChange(
                            index,
                            "new_order",
                            parseInt(String(val?.new_order) || "0")
                          )
                        }}
                      />
                      {errors[index]?.inventory_id && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[index].inventory_id}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => {
                          if (!isNaN(Number(e.target.value))) {
                            handleItemChange(
                              index,
                              "qty",
                              parseInt(e.target.value)
                            )
                          }
                        }}
                      />
                      {errors[index]?.qty && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[index].qty}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {!item.is_machine && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(index, "name", e.target.value)
                              }
                            />
                            {errors[index]?.name && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors[index].name}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) => {
                                if (!isNaN(Number(e.target.value))) {
                                  handleItemChange(
                                    index,
                                    "qty",
                                    parseInt(e.target.value)
                                  )
                                }
                              }}
                            />
                            {errors[index]?.qty && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors[index].qty}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Price</Label>
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => {
                                if (!isNaN(Number(e.target.value))) {
                                  handleItemChange(
                                    index,
                                    "price",
                                    parseInt(e.target.value)
                                  )
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Buying Price</Label>
                            <Input
                              type="number"
                              value={item.buying_price}
                              onChange={(e) => {
                                if (!isNaN(Number(e.target.value))) {
                                  handleItemChange(
                                    index,
                                    "buying_price",
                                    parseInt(e.target.value)
                                  )
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Threshold</Label>
                            <Input
                              type="number"
                              value={item.threshold}
                              onChange={(e) => {
                                if (!isNaN(Number(e.target.value))) {
                                  handleItemChange(
                                    index,
                                    "threshold",
                                    parseInt(e.target.value)
                                  )
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>New Order</Label>
                            <Input
                              type="number"
                              value={item.new_order}
                              onChange={(e) => {
                                if (!isNaN(Number(e.target.value))) {
                                  handleItemChange(
                                    index,
                                    "new_order",
                                    parseInt(e.target.value)
                                  )
                                }
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {item.is_machine && (
                      <div className="mt-2 flex items-center gap-2">
                        <Switch
                          checked={manual}
                          onCheckedChange={(val) => setManual(val)}
                        />
                        <Label>Manual?</Label>
                      </div>
                    )}

                    {item.is_machine && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>
                            Machine Serial <RequiredStar />
                          </Label>
                          <Input
                            value={item.machine_serial}
                            onChange={(e) => {
                              handleItemChange(
                                index,
                                "machine_serial",
                                e.target.value
                              )
                            }}
                          />
                          {errors[index]?.machine_serial && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[index].machine_serial}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>
                            Model <RequiredStar />
                          </Label>
                          {manual ? (
                            <Input
                              value={item.machine_model}
                              onChange={(e) => {
                                handleItemChange(
                                  index,
                                  "machine_model",
                                  e.target.value
                                )
                              }}
                            />
                          ) : (
                            <MachineModels
                              value={item.machine_model}
                              onValueChange={(val) =>
                                handleItemChange(index, "machine_model", val)
                              }
                            />
                          )}
                          {errors[index]?.machine_model && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[index].machine_model}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>
                            Source <RequiredStar />
                          </Label>
                          {manual ? (
                            <Input
                              value={item.machine_source}
                              onChange={(e) => {
                                handleItemChange(
                                  index,
                                  "machine_source",
                                  e.target.value?.toString()?.toUpperCase()
                                )
                              }}
                            />
                          ) : (
                            <Select
                              value={item.machine_source}
                              onValueChange={(val) =>
                                handleItemChange(index, "machine_source", val)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="RAYCUS">RAYCUS</SelectItem>
                                <SelectItem value="MAX">MAX</SelectItem>
                                <SelectItem value="IPG">IPG</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {errors[index]?.machine_source && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[index].machine_source}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>
                            Power <RequiredStar />
                          </Label>

                          {manual ? (
                            <Input
                              value={item.machine_power}
                              onChange={(e) => {
                                handleItemChange(
                                  index,
                                  "machine_power",
                                  e.target.value
                                )
                              }}
                            />
                          ) : (
                            <Select
                              value={item.machine_power}
                              onValueChange={(val) =>
                                handleItemChange(index, "machine_power", val)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Power" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1500W">1500W</SelectItem>
                                <SelectItem value="3000W">3000W</SelectItem>
                                <SelectItem value="6000W">6000W</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {errors[index]?.machine_power && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[index].machine_power}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => {
                              if (!isNaN(Number(e.target.value))) {
                                handleItemChange(
                                  index,
                                  "qty",
                                  parseInt(e.target.value)
                                )
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <Button onClick={addItem} className="mx-3.5 mt-3">
            Add New Item
          </Button>

          <div className="mx-3.5 mt-3 mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button disabled={loading} onClick={handleSubmit}>
              {loading && <Spinner />}Add Order Items
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default AddOrderDialog
