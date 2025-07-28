import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContext, useEffect, useState } from "react";

import { RequiredStar } from "@/components/RequiredStar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import axios from "@/lib/axios";
import "react-medium-image-zoom/dist/styles.css";
import { InventorySearch } from "./inventory-select";
import { UserContext } from "@/store/context/UserContext";

const AddOrderDialog = ({ visible, onClose, user_id, onRefresh, id }) => {
  const [items, setItems] = useState([
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
    },
  ]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingInventory, setExistingInventory] = useState([]);
  const [title, setTitle] = useState("");
  const { state: UserState } = useContext(UserContext);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (visible && UserState.value.data?.id) {
      fetchPOSInventory();
    }
  }, [visible, UserState]);

  async function fetchPOSInventory() {
    axios.get(`/${UserState.value.data?.id}/pos`).then((response) => {
      if (response.data.stock.length > 0) {
        let resultedData = [...response.data.stock];
        setExistingInventory([...resultedData]);
      }
    });
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);

    setErrors((prevErrors) => {
      const newErrors = [...prevErrors];
      if (newErrors[index]) {
        newErrors[index][field] = "";
      }
      return newErrors;
    });
  };

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
      },
    ]);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);

    const newErrors = [...errors];
    newErrors.splice(index, 1);
    setErrors(newErrors);
  };

  const validateItems = () => {
    const newErrors = [];

    items.forEach((item, index) => {
      const itemErrors = {};

      // qty required and positive
      if (!item.qty || item.qty <= 0) {
        itemErrors.qty = "Quantity is required and must be greater than 0";
      }

      if (item.isExisting) {
        // inventory_id required for existing items
        if (!item.inventory_id) {
          itemErrors.inventory_id = "Please select an existing inventory item";
        }
      } else {
        if (!item.is_machine)
          if (!item.name || item.name.trim() === "") {
            itemErrors.name = "Name is required for new items";
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
      let processedItems = [];

      items.forEach((item) => {
        if (item.is_machine && item.qty > 1) {
          let prefix = "";
          let baseSerial = NaN;

          if (/^\d+$/.test(item.machine_serial)) {
            // Case 1: Entirely numeric
            baseSerial = parseInt(item.machine_serial, 10);
          } else {
            // Case 2: Alphanumeric, extract last number after dash
            const parts = item.machine_serial.split("-");
            const last = parts[parts.length - 1];
            const parsed = parseInt(last, 10);

            if (!isNaN(parsed)) {
              baseSerial = parsed;
              prefix = parts.slice(0, parts.length - 1).join("-");
            }
          }

          if (!isNaN(baseSerial)) {
            for (let i = 0; i < item.qty; i++) {
              const newSerial = prefix
                ? `${prefix}-${baseSerial + i}`
                : (baseSerial + i).toString();

              processedItems.push({
                ...item,
                qty: 1,
                machine_serial: newSerial,
                name: newSerial,
              });
            }
          } else {
            processedItems.push(item); // Invalid base serial
          }
        } else {
          processedItems.push(item); // Not a machine or qty === 1
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
        const response = await axios.post(
          `/${UserState.value.data?.id}/neworder/${id}`,
          payload
        );
        await onRefresh();
        handleClose();
      } finally {
        setLoading(false);
      }
    }
  };

  function handleClose(val) {
    onClose(val);
    setItems([
      {
        name: "",
        qty: 1,
        price: 0,
        buying_price: 0,
        threshold: 0,
        new_order: 0,
        is_machine: false,
        machine_serial: "",
        machine_model: "",
        machine_source: "",
        machine_power: "",
        status: "Order Placed",
        isExisting: false,
        inventory_id: null,
      },
    ]);

    setErrors([]);
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add in existing order</DialogTitle>
        </DialogHeader>

        <ScrollArea className="min-h-[500px] max-h-[70vh] pr-4">
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="border p-4 rounded-md space-y-4">
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

                {item.isExisting ? (
                  <>
                    <div>
                      <Label>Select from Inventory</Label>

                      <InventorySearch
                        data={existingInventory}
                        value={item.inventory_id}
                        onReturn={(val) => {
                          handleItemChange(index, "inventory_id", val.id);
                          handleItemChange(index, "name", val.name);
                          handleItemChange(
                            index,
                            "price",
                            parseFloat(val?.price || 0)
                          );
                          handleItemChange(
                            index,
                            "buying_price",
                            parseFloat(val?.buying || 0)
                          );
                          handleItemChange(
                            index,
                            "threshold",
                            parseInt(val?.threshold || 0)
                          );
                          handleItemChange(
                            index,
                            "new_order",
                            parseInt(val?.new_order || 0)
                          );
                        }}
                      />
                      {errors[index]?.inventory_id && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors[index].inventory_id}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "qty",
                            isNaN(e.target.value)
                              ? ""
                              : parseInt(e.target.value)
                          )
                        }
                      />
                      {errors[index]?.qty && (
                        <p className="text-red-600 text-sm mt-1">
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
                              <p className="text-red-600 text-sm mt-1">
                                {errors[index].name}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "qty",
                                  parseInt(e.target.value)
                                )
                              }
                            />
                            {errors[index]?.qty && (
                              <p className="text-red-600 text-sm mt-1">
                                {errors[index].qty}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Price</Label>
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "price",
                                  isNaN(e.target.value)
                                    ? ""
                                    : parseFloat(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Buying Price</Label>
                            <Input
                              type="number"
                              value={item.buying_price}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "buying_price",
                                  isNaN(e.target.value)
                                    ? ""
                                    : parseFloat(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Threshold</Label>
                            <Input
                              type="number"
                              value={item.threshold}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "threshold",
                                  isNaN(e.target.value)
                                    ? ""
                                    : parseInt(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>New Order</Label>
                            <Input
                              type="number"
                              value={item.new_order}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "new_order",
                                  isNaN(e.target.value)
                                    ? ""
                                    : parseInt(e.target.value)
                                )
                              }
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={item.is_machine}
                        onCheckedChange={(val) =>
                          handleItemChange(index, "is_machine", val)
                        }
                      />
                      <Label>Is Machine?</Label>
                    </div>

                    {item.is_machine && (
                      <div className="flex items-center gap-2 mt-2">
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
                              );
                              handleItemChange(index, "name", e.target.value);
                            }}
                          />
                          {errors[index]?.machine_serial && (
                            <p className="text-red-600 text-sm mt-1">
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
                                );
                              }}
                            />
                          ) : (
                            <Select
                              value={item.machine_model}
                              onValueChange={(val) =>
                                handleItemChange(index, "machine_model", val)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Model" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SF3015G">SF3015G</SelectItem>
                                <SelectItem value="SF4015G">SF4015G</SelectItem>
                                <SelectItem value="SF6015G">SF6015G</SelectItem>
                                <SelectItem value="SF3015N">SF3015N</SelectItem>
                                <SelectItem value="SF4015N">SF4015N</SelectItem>
                                <SelectItem value="SF6015N">SF6015N</SelectItem>
                                <SelectItem value="SF3015C">SF3015C</SelectItem>
                                <SelectItem value="SF4015C">SF4015C</SelectItem>
                                <SelectItem value="SF6015C">SF6015C</SelectItem>
                                <SelectItem value="SF1500HW">
                                  SF1500HW
                                </SelectItem>
                                <SelectItem value="SF2000HW">
                                  SF2000HW
                                </SelectItem>
                                <SelectItem value="SF3000HW">
                                  SF3000HW
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {errors[index]?.machine_model && (
                            <p className="text-red-600 text-sm mt-1">
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
                              <SelectTrigger>
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
                            <p className="text-red-600 text-sm mt-1">
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
                              <SelectTrigger>
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
                            <p className="text-red-600 text-sm mt-1">
                              {errors[index].machine_power}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "qty",
                                e.target.value
                                  ? isNaN(e.target.value)
                                    ? ""
                                    : parseInt(e.target.value)
                                  : ""
                              )
                            }
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button onClick={addItem} className="mt-4">
          Add New Item
        </Button>

        <DialogFooter className="mt-6">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={handleSubmit}>
            {loading && <Spinner />}Add Order Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
