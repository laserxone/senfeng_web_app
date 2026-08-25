"use client";
import axios from "@/lib/axios";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { FaMinusCircle, FaPlus } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import "./Button.css";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { useDebounce } from "@/hooks/use-debounce";
import useUserDetail from "@/hooks/use-user-detail";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import { CustomerSearchWithData } from "@/components/features/customers/components/customer-search-with-data";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/shared/search/user-search";
import NotificationBadge from "@/components/shared/notifications/NotificationBadge";
import AddItemDialog from "./add-item-dialog";
import AddPOSPayment from "./add-pos-payment";
import DeleteInvoice from "./delete-invoice";
import EngineerModal from "./engineer-modal";
import InwardModal from "./inward-modal";
import OrderStockDialog from "./order-stock-dialog";
import POSModal from "./pos-modal";
import SearchResultModal from "./search-result-modal";
import ViewableInvoice from "./viewable-invoice";

import {
  InvoiceItem,
  MyCustomer,
  POSInvoiceReminder,
  SearchItem,
  StockProps,
} from "@/lib/types";
import Link from "next/link";
import { toast } from "sonner";
import OutwardModal from "./outward-modal";
import LowStock from "./low-stock";

// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
// pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
// type InvoiceItem = {
//   id?: number
//   total?: number,
//   qty?: string,
//   price?: string,
//   description?: string,
//   type?: string,
// }

export type SelectedUser = {
  id: null | number;
  label: null | string;
};

type PosDialog = "inward" | "outward" | "low-stock" | "order-stock";

export default function POS() {
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [stock, setStock] = useState<StockProps[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [createdAt, setCreatedAt] = useState<Date | string>(new Date());
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [qty, setQty] = useState<string | number>("");
  const [price, setPrice] = useState<string | number>("");
  const [totalAmount, setTotalAmount] = useState(0);

  const [other, setOther] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [manager, setManager] = useState("");
  const [nextInvoice, setNextInvoice] = useState(`xxxxxxxx-xxx`);
  const [addProductVisible, setAddProductVisible] = useState(false);
  const [searchInvocie, setSearchInvoice] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [searchModal, setSearchModal] = useState(false);
  const [searchItemsResult, setSearchItemsResult] = useState<SearchItem[]>([]);
  const [selectedSearchItem, setSelectedSearchItem] =
    useState<SearchItem | null>(null);
  const [checked, setChecked] = useState(false);
  const [modal, setModal] = useState(false);
  const [reminder, setReminder] = useState<POSInvoiceReminder[]>([]);
  const [warranty, setWarranty] = useState(false);
  const [warrantyYear, setWarrantyYear] = useState(1);
  const { userID, designation, base_route } = useUserDetail();
  const [selectedRadio, setSelectedRadio] = useState("customer");
  const [selectedUser, setSelectedUser] = useState<SelectedUser>({
    id: null,
    label: null,
  });
  const [engineerLoading, setEngineerLoading] = useState(false);
  const [allEngineersData, setAllEngineersData] = useState([]);
  const [engineersModal, setEngineersModal] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [orderStockVisible, setOrderStockVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const debouncedUserId = useDebounce(userID, 1000);
  const [discount, setDiscount] = useState<number | string>("");
  const [inwardModal, setInwardModal] = useState(false);
  const [outwardModal, setOutwardModal] = useState(false);
  const [lowStockModal, setLowStockModal] = useState(false);
  const [total, setTotal] = useState(0);

  const updatePosDialogQuery = useCallback((dialog?: PosDialog) => {
    const url = new URL(window.location.href);

    if (dialog) {
      url.searchParams.set("pos_dialog", dialog);
      window.history.pushState({}, "", url);
    } else {
      url.searchParams.delete("pos_dialog");
      window.history.replaceState({}, "", url);
    }

    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  useEffect(() => {
    const syncPosDialogFromUrl = () => {
      const dialog = new URLSearchParams(window.location.search).get(
        "pos_dialog",
      ) as PosDialog | null;

      setInwardModal(dialog === "inward");
      setOutwardModal(dialog === "outward");
      setLowStockModal(dialog === "low-stock");
      setOrderStockVisible(dialog === "order-stock");
    };

    syncPosDialogFromUrl();
    window.addEventListener("popstate", syncPosDialogFromUrl);

    return () => {
      window.removeEventListener("popstate", syncPosDialogFromUrl);
    };
  }, []);

  useEffect(() => {
    if (debouncedUserId) {
      fetchData();
    }
  }, [debouncedUserId]);

  const handleUpdateInvoice = async () => {
    await handleInvoiceBackendData();
    const PDFData = {
      companyName: companyName,
      name: name,
      phoneNumber: phoneNumber,
      address: address,
      manager: manager,
      nextInvoice: nextInvoice,
      invoiceItems: invoiceItems,
      totalAmount: totalAmount,
      warranty: warranty,
      warrantyYear: warrantyYear,
      discount: `${discount}`,
      createdAt: createdAt,
    };
    const pdfRes = await axios.post(
      `/${userID}/pos/pdf`,
      {
        data: PDFData,
      },
      {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const blob = new Blob([pdfRes.data], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 600000);
  };

  const handleInvoiceBackendData = async () => {
    try {
      await axios.put(`/${userID}/pos/update/${selectedSearchItem?.id}`, {
        olditems: selectedSearchItem,
        newitems: {
          name: name,
          company: companyName,
          phone: phoneNumber,
          address: address,
          manager: manager,
          invoicenumber: nextInvoice,
          fields: invoiceItems,
          payment: selectedSearchItem?.payment || false,
          discount: discount || 0,
        },
      });
    } finally {
      await fetchData();
      setSelectedSearchItem(null);
      setSearchItemsResult([]);
    }
  };

  const generatePDF = async () => {
    try {
      const invNumber = await handleUpdateStock();
      const PDFData = {
        companyName: companyName,
        name: name,
        phoneNumber: phoneNumber,
        address: address,
        manager: manager,
        nextInvoice: invNumber.nextinvoice,
        selectedUser: selectedUser,
        invoiceItems: invoiceItems,
        totalAmount: totalAmount,
        warranty: warranty,
        warrantyYear: warrantyYear,
        discount: `${discount}`,
      };
      const pdfRes = await axios.post(
        `/${userID}/pos/pdf`,
        {
          data: PDFData,
        },
        {
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const blob = new Blob([pdfRes.data], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 600000);
      await fetchData();
      if (checked) {
        setSelectedInvoice(invNumber?.returning_id);
      } else {
        setSelectedCustomer(null);
        setChecked(false);
      }
      setTimeout(() => URL.revokeObjectURL(url), 600000);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  async function handleUpdateStock() {
    const modified = stock.filter((item) => item?.modified);

    try {
      const response = await axios.put(`/${userID}/pos`, {
        entries: modified,
        name: name,
        company: companyName,
        phone: phoneNumber,
        address: address,
        manager: manager,
        fields: invoiceItems,
        selecteduser: selectedUser,
        customer_id: selectedCustomer ? selectedCustomer?.id : null,
        discount: discount || 0,
        payment: selectedCustomer?.id ? checked : false,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  const fetchData = async () => {
    clearAll();
    try {
      const response = await axios.get(`/${userID}/pos`);
      if (response.data.stock.length > 0) {
        setStock([...response.data.stock]);
      }
      if (response.data?.reminders) {
        setReminder(response.data.reminders);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceItems.length > 0) {
      let total = 0;
      let dis: Number = Number(discount) || 0;
      invoiceItems.forEach((item) => {
        total = total + Number(item?.total);
      });

      setTotalAmount(total - Number(dis));
    } else {
      setTotalAmount(0);
    }
  }, [invoiceItems, discount]);

  const handleAddToInvoice = () => {
    if (showOther) {
      setInvoiceItems((prev) => [
        ...prev,
        {
          total: Number(price) * Number(qty),
          qty: Number(qty || 0),
          price: price.toString(),
          description: other || "",
          type: "other",
        },
      ]);
      setOther("");
      setShowOther(false);
    }
    setShowOther(false);
    setQty("");
    setPrice("");
  };

  function handleChange(
    e: ChangeEvent<HTMLInputElement, HTMLInputElement>,
    i: number,
  ) {
    const { value, name } = e.target;
    setInvoiceItems((prevItems) =>
      prevItems.map((item, index) =>
        index === i
          ? {
              ...item,
              [name]: name === "price" ? value : value,
              total:
                name === "price"
                  ? Number(value) * Number(item.qty)
                  : item.total,
            }
          : item,
      ),
    );
  }

  function handleIncrease(item: StockProps) {
    if (!item.qty || item?.qty < 1)
      return toast.info("Select a valid item and quantity.");

    setStock((prevStock) =>
      prevStock.map((eachItem) =>
        eachItem.id === item.id
          ? { ...eachItem, qty: (eachItem?.qty || 0) - 1, modified: true }
          : eachItem,
      ),
    );

    setInvoiceItems((prevItems) => {
      const existingItem = prevItems.find(
        (eachItem) => eachItem.id === item.id,
      );
      if (existingItem) {
        return prevItems.map((eachItem) =>
          eachItem.id === item.id
            ? {
                ...eachItem,
                qty: Number(eachItem.qty) + 1,
                total:
                  Number(eachItem.price || 0) * (Number(eachItem.qty || 0) + 1),
              }
            : eachItem,
        );
      } else {
        return [
          ...prevItems,
          {
            ...item,
            qty: 1,
            total: Number(item?.price || 0),
            description: item.name,
          },
        ];
      }
    });
  }

  function handleDecrease(item: StockProps) {
    const existing = invoiceItems.find((eachItem) => eachItem.id === item.id);
    if (!existing) return;
    setInvoiceItems((prevItems) =>
      prevItems
        .map((eachItem) =>
          eachItem.id === item.id
            ? {
                ...eachItem,
                qty: Number(eachItem.qty) - 1,
                total:
                  Number(eachItem.price || 0) * (Number(eachItem.qty || 0) - 1),
              }
            : eachItem,
        )
        .filter((eachItem) => Number(eachItem?.qty || 0) > 0),
    );

    setStock((prevStock) =>
      prevStock.map((eachItem) =>
        eachItem.id === item.id
          ? { ...eachItem, qty: Number(eachItem.qty || 0) + 1, modified: true }
          : eachItem,
      ),
    );
  }

  function handleRemove(i: number) {
    setInvoiceItems((prevItems) => prevItems.filter((_, ind) => ind !== i));
  }

  function clearAll() {
    setInvoiceItems([]);
    setPhoneNumber("");
    setName("");
    setCompanyName("");
    setAddress("");
    setQty("");
    setPrice("");
    setTotalAmount(0);
    setDiscount("");
    setOther("");
    setShowOther(false);
    setManager("");
    setNextInvoice("xxxxxxxx-xxx");
    setSelectedRadio("customer");
  }

  async function handleItemSearch() {
    axios
      .get(`/${userID}/pos/search/${itemSearch}`)
      .then((response) => {
        if (response.data.length > 0) {
          const resultWithTotal = response.data.map(
            (item: POSInvoiceReminder) => {
              const discount = Number(item.discount || 0).toFixed(0);
              return {
                ...item,
                discount,
              };
            },
          );
          setSearchModal(true);
          setSearchItemsResult(resultWithTotal);
          setTotal(
            resultWithTotal.reduce(
              (sum: any, item: any) => sum + Number(item.total || 0),
              0,
            ),
          );
        } else {
          toast.info("No invoice found");
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setSearchLoading(false);
      });
  }

  async function handleItemSearchAll() {
    axios
      .get(`/${userID}/pos/search`)
      .then((response) => {
        if (response.data.length > 0) {
          const resultWithTotal = response.data.map(
            (item: POSInvoiceReminder) => {
              const discount = Number(item.discount || 0).toFixed(0);

              return {
                ...item,
                discount,
              };
            },
          );
          setSearchModal(true);
          setSearchItemsResult(resultWithTotal);
          setTotal(
            resultWithTotal.reduce(
              (sum: any, item: any) => sum + Number(item.total || 0),
              0,
            ),
          );
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setSearchLoading(false);
      });
  }

  async function handleReset() {
    setLoading(true);
    setSearchItemsResult([]);
    setSelectedSearchItem(null);
    setItemSearch("");
    await fetchData();
  }

  async function handlePendingPayments() {
    return new Promise<void>((resolve) => {
      axios
        .get(`/${userID}/pos/search/null?pending=true`)
        .then((response) => {
          if (response.data.length > 0) {
            const resultWithTotal = response.data.map(
              (item: POSInvoiceReminder) => {
                return {
                  ...item,
                };
              },
            );
            setSearchModal(true);
            setSearchItemsResult(resultWithTotal);
            setTotal(
              resultWithTotal.reduce(
                (sum: any, item: any) => sum + Number(item.final_amount || 0),
                0,
              ),
            );
          }
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          setPendingLoading(false);
          resolve();
        });
    });
  }

  useEffect(() => {
    setSelectedUser({ id: null, label: null });
  }, [selectedRadio]);

  async function handleEngineerItems() {
    try {
      setEngineerLoading(true);
      const response = await axios.get(`/${userID}/pos/engineer`);

      setAllEngineersData(response.data);
      setEngineersModal(true);
      return true;
    } finally {
      setEngineerLoading(false);
    }
  }

  function handleInward() {
    updatePosDialogQuery("inward");
  }

  function handleOutward() {
    updatePosDialogQuery("outward");
  }

  function handleOrderStock() {
    setDialogVisible(false);
    updatePosDialogQuery("order-stock");
  }

  return loading ? (
    <div className="flex min-h-[320px] w-full items-center justify-center">
      <div className="flex items-center gap-3 rounded-md border bg-card px-5 py-4 shadow-sm ring-1 ring-border/30">
        <Spinner />
        <div>
          <p className="text-sm font-bold">Loading POS</p>
          <p className="text-xs text-muted-foreground">
            Preparing stock and invoice workspace
          </p>
        </div>
      </div>
    </div>
  ) : (
    <>
      <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-md border bg-card p-3 shadow-sm ring-1 ring-border/30">
          <div className="flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-bold">POS Workspace</p>
              <p className="text-xs text-muted-foreground">
                Create invoices, manage stock movement and customer billing.
              </p>
            </div>
            <div className="rounded-md bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              Invoice {nextInvoice}
            </div>
          </div>
          <section className="rounded-md border bg-muted/10 p-3">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold">Bill To</p>
                <p className="text-xs text-muted-foreground">
                  Select customer or engineer before creating invoice.
                </p>
              </div>
              <RadioGroup
                defaultValue={selectedRadio}
                onValueChange={setSelectedRadio}
                className="flex rounded-md border bg-background p-1"
              >
                <div className="flex items-center gap-2 rounded-md px-2 py-1">
                  <RadioGroupItem value="customer" id="r1" />
                  <Label className="text-xs font-semibold" htmlFor="r1">
                    Customer
                  </Label>
                </div>

                <div className="flex items-center gap-2 rounded-md px-2 py-1">
                  <RadioGroupItem value="engineer" id="r2" />
                  <Label className="text-xs font-semibold" htmlFor="r2">
                    Engineer
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="space-y-3 rounded-md border bg-background p-3">
                {selectedRadio === "engineer" && (
                  <div>
                    <Label className="mb-1 block text-xs font-semibold text-muted-foreground">
                      Engineer
                    </Label>
                    <UserSearch
                      value={selectedUser.id}
                      onReturn={(val) => {
                        setSelectedUser((prevState) => ({
                          ...prevState,
                          id: val,
                        }));
                      }}
                      onReturnName={(val) => {
                        setSelectedUser((prevState) => ({
                          ...prevState,
                          label: val,
                        }));
                      }}
                      placeholder="Select user"
                    />
                  </div>
                )}

                <div>
                  <Label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Customer Search
                  </Label>
                  <CustomerSearchWithData
                    value={selectedCustomer}
                    onReturn={(val) => {
                      setSelectedCustomer(val);
                      if (val?.number && Array.isArray(val.number))
                        setPhoneNumber(
                          val.number.length > 0 ? val.number[0] : "",
                        );
                      setName(val?.owner || "");
                      setCompanyName(val?.name || "");
                      setManager(val?.ownership_name || "");
                      setAddress(val?.address || "");
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Number
                  </Label>
                  <Input
                    className="h-8 rounded-md text-sm"
                    disabled={true}
                    placeholder="Phone Number"
                    value={phoneNumber}
                    readOnly
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Customer
                  </Label>
                  <Input
                    className="h-8 rounded-md text-sm"
                    disabled={true}
                    placeholder="Name"
                    value={name}
                    readOnly
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Company
                  </Label>
                  <Input
                    className="h-8 rounded-md text-sm"
                    disabled={true}
                    placeholder="Company Name"
                    value={companyName}
                    readOnly
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Manager
                  </Label>
                  <Input
                    className="h-8 rounded-md text-sm"
                    placeholder="Manager"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Address
                  </Label>
                  <Textarea
                    className="min-h-16 rounded-md text-sm"
                    placeholder="Enter Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>
          <Card className="overflow-hidden rounded-md border bg-card shadow-none">
            <div className="flex flex-col gap-2 border-b bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold">Invoice Items</p>
                <p className="text-xs text-muted-foreground">
                  {invoiceItems.length} item
                  {invoiceItems.length === 1 ? "" : "s"} selected
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 rounded-md text-xs"
                onClick={() => setDialogVisible(true)}
              >
                <FaPlus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </div>
            <div className="overflow-x-auto p-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Description", "Quantity", "Unit Price", "Amount"].map(
                      (header, index) => (
                        <TableHead
                          key={index}
                          className="text-left text-xs whitespace-nowrap"
                        >
                          {header}
                        </TableHead>
                      ),
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          name="description"
                          value={item?.description}
                          onChange={(e) => {
                            handleChange(e, i);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input readOnly value={item?.qty} />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          name="price"
                          value={item?.price ? Number(item?.price) : ""}
                          onChange={(e) => {
                            if (!isNaN(Number(e.target.value))) {
                              handleChange(e, i);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input readOnly name="total" value={item?.total} />
                          {item?.type === "other" && (
                            <FaMinusCircle
                              onClick={() => handleRemove(i)}
                              className="cursor-pointer text-red-500"
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <OrderStockDialog
              dialogVisible={orderStockVisible}
              onCloseDialog={(open) =>
                open
                  ? updatePosDialogQuery("order-stock")
                  : updatePosDialogQuery()
              }
              stock={stock.filter(
                (item) =>
                  item.threshold != null &&
                  item.threshold !== undefined &&
                  (item?.qty || 0) <= item.threshold,
              )}
              onRefresh={async () => {
                setStock([]);
                await fetchData();
              }}
            />
          </Card>
          <section className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <div className="flex items-center overflow-hidden rounded-md border bg-background">
              <div className="flex-1 bg-muted p-2 text-center text-xs font-bold text-muted-foreground">
                Discount
              </div>

              <Input
                value={discount ? discount : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setDiscount(value ? Number(value) : "");
                }}
                type="number"
                placeholder="Enter discount"
                className="h-9 border-0 text-sm shadow-none focus:border-0 focus:ring-0 focus:outline-none focus-visible:ring-0"
              />
            </div>

            <div className="flex overflow-hidden rounded-md border bg-background">
              <div className="flex-1 bg-muted p-2 text-center text-xs font-bold text-muted-foreground">
                Total Amount
              </div>
              <div className="flex-1 bg-background p-2 text-center text-sm font-bold">
                {totalAmount ? `${totalAmount}` : "0"}
              </div>
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)]">
            <div
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 transition hover:bg-muted/40"
              onClick={() => {
                setPendingLoading(true);
                handlePendingPayments();
              }}
            >
              <div>
                <Label className="cursor-pointer text-sm font-bold">
                  Pending Payments
                </Label>
                <p className="text-xs text-muted-foreground">
                  Open unpaid invoice records
                </p>
              </div>
              <div className="shrink-0">
                {pendingLoading ? (
                  <Spinner />
                ) : (
                  <NotificationBadge count={reminder.length} />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-md border bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={warranty}
                  onCheckedChange={(checked) => setWarranty(!!checked)}
                />
                <div>
                  <Label className="text-sm font-bold">Include warranty</Label>
                  <p className="text-xs text-muted-foreground">
                    Attach warranty duration to invoice
                  </p>
                </div>
              </div>
              {warranty && (
                <div className="sm:w-28">
                  <Input
                    className="h-8 rounded-md text-sm"
                    type="number"
                    value={warrantyYear}
                    onChange={(e) => setWarrantyYear(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          </section>

          <section className="rounded-md border bg-muted/10 p-3">
            <div className="mb-3 flex flex-col gap-1">
              <p className="text-sm font-bold">POS Actions</p>
              <p className="text-xs text-muted-foreground">
                Print, search and manage stock movement from one place.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {selectedSearchItem ? (
                <Button
                  onClick={() => {
                    setLoading(true);
                    handleUpdateInvoice();
                  }}
                  disabled={invoiceItems.length === 0}
                  className="h-16 rounded-md text-center text-xs font-semibold text-wrap whitespace-normal"
                >
                  Update Invoice
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (selectedUser?.id) {
                      setLoading(true);
                      generatePDF();
                    } else {
                      setModal(true);
                    }
                  }}
                  disabled={invoiceItems.length === 0 || !selectedCustomer?.id}
                  className="h-16 rounded-md text-center text-xs font-semibold text-wrap whitespace-normal"
                >
                  Print Invoice
                </Button>
              )}

              <Button
                onClick={() => {
                  setSearchInvoice(!searchInvocie);
                }}
                className="h-16 rounded-md text-center text-xs font-semibold text-wrap whitespace-normal"
              >
                Search Invoice
              </Button>

              <Button
                variant="outline"
                onClick={handleEngineerItems}
                className="h-16 rounded-md text-center text-xs font-semibold text-wrap whitespace-normal"
              >
                {engineerLoading && <Spinner />}{" "}
                <div className="break-words"> Engineer issued items</div>
              </Button>

              <Button
                onClick={handleInward}
                className="h-16 rounded-md text-center text-xs font-semibold text-wrap whitespace-normal"
              >
                <div className="break-words">Inward Gatepass</div>
              </Button>

              <Button
                onClick={handleOutward}
                className="h-16 rounded-md text-center text-xs font-semibold text-wrap whitespace-normal"
              >
                <div className="break-words">Outward Gatepass</div>
              </Button>

              <LowStock
                handleOrderStock={handleOrderStock}
                stock={stock}
                open={lowStockModal}
                onOpenChange={(open) =>
                  open
                    ? updatePosDialogQuery("low-stock")
                    : updatePosDialogQuery()
                }
              />

              {selectedSearchItem && selectedSearchItem?.id && (
                <Link
                  href={`/${base_route}/pos/${selectedSearchItem?.id}`}
                  target="_blank"
                >
                  <Button className="h-16 w-full rounded-md text-center text-xs font-semibold text-wrap whitespace-normal">
                    <div>Payment Record</div>
                  </Button>
                </Link>
              )}

              <DeleteInvoice
                item={selectedSearchItem}
                onRefresh={() => handleReset()}
              />
            </div>
          </section>

          {searchInvocie && (
            <div className="flex w-full flex-wrap items-center gap-2 rounded-md border bg-background p-3">
              <Input
                className="h-9 w-full rounded-md text-sm sm:flex-1"
                placeholder="Search by: invoice no, phone no, customer name, company name, part name"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
              />
              {searchLoading ? (
                <Spinner />
              ) : (
                <>
                  <Button
                    disabled={!itemSearch}
                    size="sm"
                    className="h-9 rounded-md"
                    onClick={() => {
                      setSearchLoading(true);
                      setSearchItemsResult([]);
                      setSelectedSearchItem(null);
                      handleItemSearch();
                    }}
                  >
                    Search
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 rounded-md"
                    onClick={() => {
                      setSearchLoading(true);
                      setSearchItemsResult([]);
                      setSelectedSearchItem(null);
                      handleItemSearchAll();
                    }}
                  >
                    Open All
                  </Button>
                </>
              )}

              {searchItemsResult.length > 0 && (
                <Button
                  size="sm"
                  className="h-9 rounded-md"
                  variant="outline"
                  onClick={() => handleReset()}
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        <ViewableInvoice
          address={address}
          companyName={companyName}
          invoiceItems={invoiceItems}
          manager={manager}
          name={name}
          nextInvoice={nextInvoice}
          phoneNumber={phoneNumber}
          selectedUser={selectedUser}
          totalAmount={totalAmount}
          discount={discount}
          warranty={warranty}
          warrantyYear={warrantyYear}
          createdAt={createdAt}
        />

        <SearchResultModal
          total={total}
          visible={searchModal}
          onClose={setSearchModal}
          data={searchItemsResult}
          onselect={(val) => {
            setSearchModal(false);
            setSelectedSearchItem(val);
            setPhoneNumber(val.phone);
            setName(val.name);
            setManager(val.manager);
            setCompanyName(val.company);
            setAddress(val.address);
            setInvoiceItems(val.fields);
            setNextInvoice(val.invoicenumber);
            setDiscount(val.discount);
            setCreatedAt(val.created_at);
          }}
        />
      </div>

      <POSModal
        checked={checked}
        modal={modal}
        setChecked={setChecked}
        setModal={setModal}
        onClick={() => {
          setModal(false);
          setLoading(true);
          generatePDF();
        }}
        customer_id={selectedCustomer ? selectedCustomer?.id : null}
      />

      <AddPOSPayment
        visible={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        part_id={selectedInvoice}
        customer_id={selectedCustomer?.id}
        onRefresh={async () => {
          setLoading(true);
          await fetchData();
          setSelectedCustomer(null);
          setChecked(false);
        }}
      />

      <EngineerModal
        allEngineersData={allEngineersData}
        engineersModal={engineersModal}
        setEngineersModal={setEngineersModal}
        onRefresh={async () => {
          await handleEngineerItems();
          await fetchData();
        }}
      />

      <AddItemDialog
        dialogVisible={dialogVisible}
        onCloseDialog={setDialogVisible}
        handleDecrease={handleDecrease}
        invoiceItems={invoiceItems}
        stock={stock}
        other={other}
        price={price}
        setOther={setOther}
        setPrice={setPrice}
        qty={qty}
        setQty={setQty}
        setShowOther={setShowOther}
        showOther={showOther}
        handleIncrease={handleIncrease}
        handleAddToInvoice={handleAddToInvoice}
        visible={addProductVisible}
        onClose={(val) => setAddProductVisible(val)}
        onRefresh={async () => {
          setAddProductVisible(false);
          await fetchData();
        }}
        handleOrderStock={handleOrderStock}
        designation={designation}
      />

      <InwardModal
        visible={inwardModal}
        onClose={(open) =>
          open ? updatePosDialogQuery("inward") : updatePosDialogQuery()
        }
        data={stock}
        onRefresh={async () => {
          setLoading(true);
          await fetchData();
        }}
      />

      <OutwardModal
        visible={outwardModal}
        onClose={(open) =>
          open ? updatePosDialogQuery("outward") : updatePosDialogQuery()
        }
      />
    </>
  );
}
