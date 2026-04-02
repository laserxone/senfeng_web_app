import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

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
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import "react-medium-image-zoom/dist/styles.css";
import { InventorySearch } from "./inventory-select";

const EditOrderDialog = ({
  visible,
  onClose,
  user_id,
  onRefresh,
  id,
  item,
}) => {
  const [items, setItems] = useState({
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
    location: "",
    show: true
  });

  useEffect(() => {
    if (item) {
      setItems({
        name: item.name,
        qty: item.qty,
        price: item.price,
        buying_price: item.buying_price,
        threshold: item.threshold,
        new_order: item.new_order,
        is_machine: item.is_machine,
        machine_serial: item.machine_serial,
        machine_model: item.machine_model,
        machine_source: item.machine_source,
        machine_power: item.machine_power,
        status: item.status,
        isExisting: item.inventory_id ? true : false,
        inventory_id: item.inventory_id,
        location: item.location,
        show: item.show
      });
    }
  }, [item]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [existingInventory, setExistingInventory] = useState([]);
  const { userID } = useUserDetail()
  const [manual, setManual] = useState(true);

  useEffect(() => {
    if (visible && userID) {
      fetchPOSInventory();
    }
  }, [visible, userID]);

  async function fetchPOSInventory() {
    axios.get(`/${userID}/pos`).then((response) => {
      if (response.data.stock.length > 0) {
        let resultedData = [...response.data.stock];
        setExistingInventory([...resultedData]);
      }
    });
  }

  const handleItemChange = (field, value) => {
    setItems((prevState) => ({ ...prevState, [field]: value }));
    setErrors((prevState) => ({ ...prevState, [field]: "" }));
  };

  const validateItems = () => {
    const itemErrors = {};

    // qty required and positive
    if (!items.qty || items.qty <= 0) {
      itemErrors.qty = "Quantity is required and must be greater than 0";
    }

    if (items.isExisting) {
      // inventory_id required for existing items
      if (!items.inventory_id) {
        itemErrors.inventory_id = "Please select an existing inventory item";
      }
    } else {
      if (!items.is_machine)
        if (!items.name || items.name.trim() === "") {
          itemErrors.name = "Name is required for new items";
        }
    }

    // if machine, all machine fields required
    if (items.is_machine) {
      if (!items.machine_serial || items.machine_serial.trim() === "") {
        itemErrors.machine_serial = "Machine serial is required";
      }
      if (!items.machine_model) {
        itemErrors.machine_model = "Machine model is required";
      }
      if (!items.machine_source) {
        itemErrors.machine_source = "Machine source is required";
      }
      if (!items.machine_power) {
        itemErrors.machine_power = "Machine power is required";
      }
    }

    setErrors(itemErrors);

    return Object.keys(itemErrors).length === 0;
  };

  const handleSubmit = async () => {
  
    if (validateItems()) {
      setLoading(true);
      try {
        const response = await axios.put(
          `/${userID}/neworder/orderitem/${id}`,
          items
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
    setItems({
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
      location: "",
      show: true
    });

    setErrors({});
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit in existing order</DialogTitle>
        </DialogHeader>

        <ScrollArea className="min-h-[500px] max-h-[70vh] pr-4">
          <div className="space-y-6">
            <div className="border p-4 rounded-md space-y-4">
              <div>
                <Label>
                  Location <RequiredStar />
                </Label>
                <Select
                  value={items.location}
                  onValueChange={(val) => handleItemChange("location", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lahore">Lahore</SelectItem>
                    <SelectItem value="Karachi">Karachi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={items.isExisting}
                  onCheckedChange={(val) => handleItemChange("isExisting", val)}
                />
                <Label>{items.isExisting ? "Existing Item" : "New Item"}</Label>
              </div>

              {items.isExisting ? (
                <>
                  <div>
                    <Label>Select from Inventory</Label>

                    <InventorySearch
                      data={existingInventory}
                      value={items.inventory_id}
                      onReturn={(val) => {
                        handleItemChange("inventory_id", val.id);
                        handleItemChange("name", val.name);
                        handleItemChange("price", parseFloat(val?.price || 0));
                        handleItemChange(
                          "buying_price",
                          parseFloat(val?.buying || 0)
                        );
                        handleItemChange(
                          "threshold",
                          parseInt(val?.threshold || 0)
                        );
                        handleItemChange(
                          "new_order",
                          parseInt(val?.new_order || 0)
                        );
                      }}
                    />
                    {errors?.inventory_id && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.inventory_id}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={items.qty}
                      onChange={(e) =>
                        handleItemChange(
                          "qty",
                          isNaN(e.target.value) ? "" : parseInt(e.target.value)
                        )
                      }
                    />
                    {errors?.qty && (
                      <p className="text-red-600 text-sm mt-1">{errors.qty}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {!items.is_machine && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={items.name}
                            onChange={(e) =>
                              handleItemChange("name", e.target.value)
                            }
                          />
                          {errors?.name && (
                            <p className="text-red-600 text-sm mt-1">
                              {errors.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={items.qty}
                            onChange={(e) =>
                              handleItemChange("qty", parseInt(e.target.value))
                            }
                          />
                          {errors?.qty && (
                            <p className="text-red-600 text-sm mt-1">
                              {errors.qty}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Price</Label>
                          <Input
                            type="number"
                            value={items.price}
                            onChange={(e) =>
                              handleItemChange(
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
                            value={items.buying_price}
                            onChange={(e) =>
                              handleItemChange(
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
                            value={items.threshold}
                            onChange={(e) =>
                              handleItemChange(
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
                            value={items.new_order}
                            onChange={(e) =>
                              handleItemChange(
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
                      checked={items.is_machine}
                      onCheckedChange={(val) =>
                        handleItemChange("is_machine", val)
                      }
                    />
                    <Label>Is Machine?</Label>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      checked={items.show}
                      onCheckedChange={(val) =>
                        handleItemChange("show", val)
                      }
                    />
                    <Label>{items.show ? "Show" : "Hide"}</Label>
                  </div>

                  {items.is_machine && (
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={manual}
                        onCheckedChange={(val) => setManual(val)}
                      />
                      <Label>Manual?</Label>
                    </div>
                  )}

                  {items.is_machine && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>
                          Machine Serial <RequiredStar />
                        </Label>
                        <Input
                          value={items.machine_serial}
                          onChange={(e) => {
                            handleItemChange("machine_serial", e.target.value);
                            handleItemChange("name", e.target.value);
                          }}
                        />
                        {errors?.machine_serial && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.machine_serial}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>
                          Model <RequiredStar />
                        </Label>
                        {manual ? (
                          <Input
                            value={items.machine_model}
                            onChange={(e) => {
                              handleItemChange("machine_model", e.target.value);
                            }}
                          />
                        ) : (
                          <Select
                            value={items.machine_model}
                            onValueChange={(val) =>
                              handleItemChange("machine_model", val)
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
                              <SelectItem value="SF1500HW">SF1500HW</SelectItem>
                              <SelectItem value="SF2000HW">SF2000HW</SelectItem>
                              <SelectItem value="SF3000HW">SF3000HW</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {errors?.machine_model && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.machine_model}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>
                          Source <RequiredStar />
                        </Label>
                        {manual ? (
                          <Input
                            value={items.machine_source}
                            onChange={(e) => {
                              handleItemChange(
                                "machine_source",
                                e.target.value?.toString()?.toUpperCase()
                              );
                            }}
                          />
                        ) : (
                          <Select
                            value={items.machine_source}
                            onValueChange={(val) =>
                              handleItemChange("machine_source", val)
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
                        {errors?.machine_source && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.machine_source}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>
                          Power <RequiredStar />
                        </Label>

                        {manual ? (
                          <Input
                            value={items.machine_power}
                            onChange={(e) => {
                              handleItemChange("machine_power", e.target.value);
                            }}
                          />
                        ) : (
                          <Select
                            value={items.machine_power}
                            onValueChange={(val) =>
                              handleItemChange("machine_power", val)
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
                        {errors?.machine_power && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.machine_power}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={items.qty}
                          onChange={(e) =>
                            handleItemChange(
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
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={handleSubmit}>
            {loading && <Spinner />}Update Order Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderDialog;
