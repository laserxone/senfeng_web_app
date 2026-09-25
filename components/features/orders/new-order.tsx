import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContext, useState } from "react";

import { RequiredStar } from "@/components/shared/common/RequiredStar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { InventoryItem } from "@/lib/types";
import MachineModels from "@/components/features/machines/machine-models";
import { OfficeContext } from "@/store/context/OfficeContext";

type OrderItem = Omit<InventoryItem, "isExisting" | "inventory_id"> & {
  part_serials: string[];
};

type InventoryErrors = Partial<Record<keyof OrderItem, string>>[];

const emptyItem = (partsOnly = false, location = "Lahore"): OrderItem => ({
  name: "",
  qty: 1,
  price: 0,
  buying_price: 0,
  threshold: 0,
  new_order: 0,
  is_machine: !partsOnly,
  machine_serial: "",
  machine_model: "",
  machine_source: "",
  machine_power: "",
  status: "Order Placed",
  show: true,
  location,
  part_serials: [""],
});

const withoutPartFields = ({ part_serials, ...item }: OrderItem) => item;

const CreateOrderDialog = ({
  visible,
  onClose,
  user_id,
  onRefresh,
  partsOnly = false,
}: {
  visible: boolean;
  onClose: (val: boolean) => void;
  user_id: number | string;
  onRefresh: () => Promise<void>;
  partsOnly?: boolean;
}) => {
  const { state: officeState } = useContext(OfficeContext)!;
  const officeName = officeState.value.data || "Lahore";
  const officeLocation =
    officeName.charAt(0).toUpperCase() + officeName.slice(1).toLowerCase();
  const [items, setItems] = useState<OrderItem[]>([
    emptyItem(partsOnly, officeLocation),
  ]);
  const [errors, setErrors] = useState<InventoryErrors>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const { userID } = useUserDetail();
  const [manualModes, setManualModes] = useState<boolean[]>([false]);

  const handleItemChange = <K extends keyof OrderItem>(
    index: number,
    field: K,
    value: OrderItem[K],
  ) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];

      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      return newItems;
    });

    setErrors((prevErrors) => {
      const newErrors = [...prevErrors];

      if (newErrors[index]) {
        newErrors[index] = {
          ...newErrors[index],
          [field]: "",
        };
      }

      return newErrors;
    });
  };

  const addItem = () => {
    const show = items
      .filter((item) => item.is_machine)
      .every((item) => item.show);

    setItems([...items, { ...emptyItem(partsOnly, officeLocation), show }]);
    setManualModes((prevModes) => [...prevModes, false]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);

    const newErrors = [...errors];
    newErrors.splice(index, 1);
    setErrors(newErrors);
    setManualModes((prevModes) =>
      prevModes.filter((_, modeIndex) => modeIndex !== index),
    );
  };

  const machineItems = items.filter((item) => item.is_machine);
  const areAllMachinesShown =
    machineItems.length > 0 && machineItems.every((item) => item.show);

  const setAllMachinesVisibility = (show: boolean) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.is_machine ? { ...item, show } : item)),
    );
  };

  const validateItems = () => {
    const newErrors: any[] = [];

    items.forEach((item) => {
      const itemErrors: any = {};

      // qty required and positive
      if (!item.qty || item.qty <= 0) {
        itemErrors.qty = "Quantity is required and must be greater than 0";
      }

      if (!item.is_machine) {
        if (!item.name.trim()) itemErrors.name = "Part name is required";
        if (!item.machine_model.trim())
          itemErrors.machine_model = "Model is required";
        if (!item.machine_power.trim())
          itemErrors.machine_power = "Power is required";
        if (item.part_serials.some((serialNo) => !serialNo.trim())) {
          itemErrors.part_serials =
            "A serial number is required for every part";
        }
      }

      // if machine, all machine fields required
      if (item.is_machine) {
        if (!item.machine_serial || item.machine_serial.trim() === "") {
          itemErrors.machine_serial = "Machine serial is required";
        }
        if (!item.machine_model) {
          itemErrors.machine_model = "Machine model is required";
        }
        if (!item.machine_source) {
          itemErrors.machine_source = "Machine source is required";
        }
        if (!item.machine_power) {
          itemErrors.machine_power = "Machine power is required";
        }
      }

      newErrors.push(itemErrors);
    });

    setErrors(newErrors);

    // Return true if no errors
    return newErrors.every((err) => Object.keys(err).length === 0);
  };

  const handleSubmit = async () => {
    if (validateItems()) {
      let processedItems: any[] = [];

      items.forEach((item) => {
        if (item.is_machine && item.qty > 1) {
          const baseSerial = parseInt(item.machine_serial, 10);

          if (!isNaN(baseSerial)) {
            for (let i = 0; i < item.qty; i++) {
              processedItems.push({
                ...withoutPartFields(item),
                qty: 1,
                machine_serial: (baseSerial + i).toString(),
                name: (baseSerial + i).toString(),
              });
            }
          } else {
            processedItems.push(withoutPartFields(item));
          }
        } else if (!item.is_machine) {
          const { part_serials, ...part } = item;
          item.part_serials.forEach((machine_serial) => {
            processedItems.push({
              ...part,
              qty: 1,
              machine_serial,
            });
          });
        } else {
          processedItems.push(withoutPartFields(item));
        }
      });

      processedItems.sort((a, b) => {
        if (a.is_machine === b.is_machine) return 0;
        return a.is_machine ? 1 : -1;
      });

      const payload = {
        user_id: user_id,
        status: "Order Placed",
        items: processedItems,
        title: title,
      };
      setLoading(true);
      try {
        const response = await axios.post(`/${userID}/neworder`, payload);
        await onRefresh();
        handleClose(false);
      } finally {
        setLoading(false);
      }
    }
  };

  function handleClose(val: boolean) {
    onClose(val);
    setItems([emptyItem(partsOnly, officeLocation)]);

    setErrors([]);
    setManualModes([false]);
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-3xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <ShoppingCart className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Create New Order
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Create an order and configure its inventory items.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-3 p-3.5 pb-4 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-muted-foreground [&_label]:uppercase">
            <div className="px-2">
              <Label>Shipment name</Label>
              <Input
                className="mb-2"
                placeholder="Enter shipment name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2.5">
              <div>
                <Label>Machine visibility</Label>
                <p className="mt-0.5 text-xs normal-case tracking-normal text-muted-foreground">
                  Apply visibility to every machine in this shipment.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={areAllMachinesShown}
                  disabled={machineItems.length === 0}
                  onCheckedChange={setAllMachinesVisibility}
                />
                <Label>{areAllMachinesShown ? "Show all" : "Hide all"}</Label>
              </div>
            </div>
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

                {!partsOnly && (
                  <div>
                    <Label>
                      Location <RequiredStar />
                    </Label>
                    <Select
                      value={item?.location}
                      onValueChange={(val) =>
                        handleItemChange(index, "location", val)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lahore">Lahore</SelectItem>
                        <SelectItem value="Karachi">Karachi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!partsOnly && (
                  <div className="mt-2 flex items-center gap-2">
                    <Switch
                      checked={item.is_machine}
                      onCheckedChange={(val) =>
                        handleItemChange(index, "is_machine", val)
                      }
                    />
                    <Label>
                      {item.is_machine ? "Is Machine?" : "Is Part?"}
                    </Label>
                  </div>
                )}

                <div className="mt-2 flex items-center gap-2">
                  <Switch
                    checked={item.show}
                    onCheckedChange={(val) =>
                      handleItemChange(index, "show", val)
                    }
                  />
                  <Label>{item.show ? "Show" : "Hide"}</Label>
                </div>

                {!item.is_machine && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      {(
                        ["name", "machine_model", "machine_power"] as const
                      ).map((field) => (
                        <div key={field}>
                          <Label>
                            {field === "machine_model"
                              ? "Model"
                              : field === "machine_power"
                                ? "Power"
                                : "Name"}{" "}
                            <RequiredStar />
                          </Label>
                          <Input
                            value={item[field]}
                            onChange={(event) =>
                              handleItemChange(index, field, event.target.value)
                            }
                          />
                          {errors[index]?.[field] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[index][field]}
                            </p>
                          )}
                        </div>
                      ))}
                      <div>
                        <Label>
                          Quantity <RequiredStar />
                        </Label>
                        <Input
                          min="1"
                          type="number"
                          value={item.qty}
                          onChange={(event) => {
                            const qty = Math.max(
                              1,
                              Number.parseInt(event.target.value, 10) || 1,
                            );
                            handleItemChange(index, "qty", qty);
                            handleItemChange(
                              index,
                              "part_serials",
                              Array.from(
                                { length: qty },
                                (_, serialIndex) =>
                                  item.part_serials[serialIndex] ?? "",
                              ),
                            );
                          }}
                        />
                        {errors[index]?.qty && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors[index].qty}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>
                        Machine serial numbers <RequiredStar />
                      </Label>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        {item.part_serials.map((serialNo, serialIndex) => (
                          <div key={serialIndex}>
                            <Label className="normal-case">
                              Machine serial {serialIndex + 1}
                            </Label>
                            <Input
                              value={serialNo}
                              onChange={(event) => {
                                const part_serials = [...item.part_serials];
                                part_serials[serialIndex] = event.target.value;
                                handleItemChange(
                                  index,
                                  "part_serials",
                                  part_serials,
                                );
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      {errors[index]?.part_serials && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[index].part_serials}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {item.is_machine && (
                  <div className="mt-2 flex items-center gap-2">
                    <Switch
                      checked={manualModes[index] ?? false}
                      onCheckedChange={(val) =>
                        setManualModes((prevModes) =>
                          prevModes.map((mode, modeIndex) =>
                            modeIndex === index ? val : mode,
                          ),
                        )
                      }
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
                            e.target.value,
                          );
                          // handleItemChange(index, "name", e.target.value);
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
                      {manualModes[index] ? (
                        <Input
                          value={item.machine_model}
                          onChange={(e) => {
                            handleItemChange(
                              index,
                              "machine_model",
                              e.target.value,
                            );
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
                      {manualModes[index] ? (
                        <Input
                          value={item.machine_source}
                          onChange={(e) => {
                            handleItemChange(
                              index,
                              "machine_source",
                              e.target.value?.toString()?.toUpperCase(),
                            );
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

                      {manualModes[index] ? (
                        <Input
                          value={item.machine_power}
                          onChange={(e) => {
                            handleItemChange(
                              index,
                              "machine_power",
                              e.target.value,
                            );
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
                              parseInt(e.target.value),
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
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
            <Button disabled={!title || loading} onClick={handleSubmit}>
              {loading && <Spinner />}Create Order
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderDialog;
