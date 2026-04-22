"use client";
import axios from "@/lib/axios";
import { pdf } from "@react-pdf/renderer";
import { ChangeEvent, useEffect, useState } from "react";
import { FaMinusCircle, FaPlus } from "react-icons/fa";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Textarea } from "../ui/textarea";
import "./Button.css";
import InvoicePDF from "./invoicePDF";
import PageContainer from "./page-container";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { useDebounce } from "@/hooks/use-debounce";
import useUserDetail from "@/hooks/use-user-detail";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import { CustomerSearchWithData } from "../customer-search-with-data";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import Spinner from "../ui/spinner";
import { UserSearch } from "../user-search";
import NotificationBadge from "./NotificationBadge";
import AddItemDialog from "./add-item-dialog";
import AddPOSPayment from "./add-pos-payment";
import EngineerModal from "./engineer-modal";
import OrderStockDialog from "./order-stock-dialog";
import POSModal from "./pos-modal";
import SearchResultModal from "./search-result-modal";
import ViewableInvoice from "./viewable-invoice";
import InwardModal from "./inward-modal";
import OutwardModal from "./outward-modal";
import DeleteInvoice from "./delete-invoice";

import Link from "next/link";
import { InvoiceItem, MyCustomer, POSCustomer, POSInvoiceReminder, SearchItem, StockProps } from "@/lib/types";
import { toast } from "sonner";

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
  id: null | string
  label: null | string
}


export default function POS() {
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(null);
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
  const [customers, setCustomers] = useState<POSCustomer[]>([]);
  const [manager, setManager] = useState("");
  const [nextInvoice, setNextInvoice] = useState(`xxxxxxxx-xxx`);
  const [filteredCustomers, setFilteredCustomers] = useState<POSCustomer[]>([]);
  const [showList, setShowList] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [addProductVisible, setAddProductVisible] = useState(false);
  const [searchInvocie, setSearchInvoice] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [searchModal, setSearchModal] = useState(false);
  const [searchItemsResult, setSearchItemsResult] = useState<SearchItem[]>([]);
  const [selectedSearchItem, setSelectedSearchItem] = useState<SearchItem | null>(null);
  const [checked, setChecked] = useState(false);
  const [modal, setModal] = useState(false);
  const [reminder, setReminder] = useState<POSInvoiceReminder[]>([]);
  const [warranty, setWarranty] = useState(false);
  const [warrantyYear, setWarrantyYear] = useState(1);
  const { userID, designation, base_route } = useUserDetail();
  const [selectedRadio, setSelectedRadio] = useState("customer");
  const [selectedUser, setSelectedUser] = useState<SelectedUser>({ id: null, label: null });
  const [engineerLoading, setEngineerLoading] = useState(false);
  const [allEngineersData, setAllEngineersData] = useState([]);
  const [engineersModal, setEngineersModal] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [orderStockVisible, setOrderStockVisible] = useState(false);
  const [walkIn, setWalkIn] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const debouncedUserId = useDebounce(userID, 1000);
  const [discount, setDiscount] = useState<number | string>("");
  const [inwardModal, setInwardModal] = useState(false);
  const [outwardModal, setOutwardModal] = useState(false);


  useEffect(() => {
    if (debouncedUserId) {
      fetchData();
      fetchDataCustomer();
    }
  }, [debouncedUserId]);

  const handleUpdateInvoice = async () => {
    handleInvoiceBackendData();
    const blob = await pdf(
      <InvoicePDF
        companyName={companyName}
        name={name}
        phoneNumber={phoneNumber}
        address={address}
        manager={manager}
        nextInvoice={nextInvoice}
        invoiceItems={invoiceItems}
        totalAmount={totalAmount}
        warranty={warranty}
        warrantyYear={warrantyYear}
        discount={`${discount}`}
        createdAt={createdAt}
      />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 600000);
  };

  const handleInvoiceBackendData = async () => {
    axios
      .put(`/${userID}/pos/customer`, {
        name: name,
        company: companyName,
        phone: phoneNumber,
        address: address,
      })
      .finally(async () => {
        await fetchDataCustomer();
      });

    axios
      .put(`/${userID}/pos/update/${selectedSearchItem?.id}`, {
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
      })
      .finally(() => {
        fetchData();
        setSelectedSearchItem(null);
        setSearchItemsResult([]);
      });
  };

  const generatePDF = async () => {
    try {
      const invNumber = await handleUpdateStock();
      const blob = await pdf(
        <InvoicePDF
          companyName={companyName}
          name={name}
          phoneNumber={phoneNumber}
          address={address}
          manager={manager}
          nextInvoice={invNumber.nextinvoice}
          selectedUser={selectedUser}
          invoiceItems={invoiceItems}
          totalAmount={totalAmount}
          warranty={warranty}
          warrantyYear={warrantyYear}
          discount={`${discount}`}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      await fetchData();
      await fetchDataCustomer();
      if (checked && selectedCustomer) {
        setSelectedInvoice(invNumber?.returning_id);
      }
      setTimeout(() => URL.revokeObjectURL(url), 600000);
    } catch (error) {
      console.log(error);
      setCustomerLoading(false);
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
        payment: selectedCustomer ? false : checked,
        selecteduser: selectedUser,
        customer_id: selectedCustomer ? selectedCustomer?.id : null,
        discount: discount || 0,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  const fetchData = async () => {
    clearAll();
    return new Promise<void>((resolve) => {
      axios
        .get(`/${userID}/pos`)
        .then((response) => {
          if (response.data.stock.length > 0) {
            let resultedData = [...response.data.stock];
            resultedData.push({
              name: "Other",
              id: resultedData[resultedData.length - 1].id + 1,
            });
            resultedData.push({
              name: "Plus",
              id: resultedData[resultedData.length - 1].id + 2,
            });
            setStock([...resultedData]);
          } else {
            let resultedData = [];
            resultedData.push({ name: "Other", id: 1 });
            resultedData.push({ name: "Plus", id: 2 });
            setStock([...resultedData]);
          }
          if (response.data?.reminders) {
            setReminder(response.data.reminders);
          }
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          setLoading(false);
          resolve();
        });
    });
  };


  const fetchDataCustomer = async () => {
    try {
      const response = await axios.get(`/${userID}/pos/customer`);
      if (response.data.customers.length > 0) {
        setCustomers(response.data.customers);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setCustomerLoading(false);
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

  function handleChange(e: ChangeEvent<HTMLInputElement, HTMLInputElement>, i: number) {
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
    if (!item.qty || item?.qty < 1) return alert("Select a valid item and quantity.");

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
              qty: (Number(eachItem.qty) + 1),
              total: Number(eachItem.price || 0) * (Number(eachItem.qty || 0) + 1),
            }
            : eachItem,
        );
      } else {
        return [
          ...prevItems,
          {
            ...item,
            qty: 1, total: Number(item?.price || 0), description: item.name
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
              qty: (Number(eachItem.qty) - 1),
              total: Number(eachItem.price || 0) * (Number(eachItem.qty || 0) - 1),
            }
            : eachItem,
        )
        .filter((eachItem) => Number(eachItem?.qty || 0) > 0),
    );

    setStock((prevStock) =>
      prevStock.map((eachItem) =>
        eachItem.id === item.id
          ? { ...eachItem, qty: (Number(eachItem.qty || 0) + 1), modified: true }
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

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    const input = e.target.value;
    setPhoneNumber(input);
    const matches = customers.filter((customer) =>
      customer.phone.includes(input),
    );

    setFilteredCustomers(matches);
  };

  const handleSelectCustomer = (customer: POSCustomer) => {
    setPhoneNumber(customer.phone);
    setName(customer.name);
    setCompanyName(customer.customer);
    setAddress(customer.address);
  };

  async function handleItemSearch() {
    axios
      .get(`/${userID}/pos/search/${itemSearch}`)
      .then((response) => {
        if (response.data.length > 0) {
          const resultWithTotal = response.data.map((item: POSInvoiceReminder) => {
            const discount = Number(item.discount || 0).toFixed(0);
            const total = item.fields.reduce(
              (acc, curr) => acc + Number(curr.total),
              0,
            );
            return {
              ...item,
              total: total - Number(discount),
              discount,
            };
          });
          setSearchModal(true);
          setSearchItemsResult(resultWithTotal);
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
          const resultWithTotal = response.data.map((item: POSInvoiceReminder) => {
            const discount = Number(item.discount || 0).toFixed(0);
            const total = item.fields.reduce(
              (acc, curr) => acc + Number(curr.total),
              0,
            );
            return {
              ...item,
              total: total - Number(discount),
              discount,
            };
          });
          setSearchModal(true);
          setSearchItemsResult(resultWithTotal);
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
    setCustomerLoading(true);
    setSearchItemsResult([]);
    setSelectedSearchItem(null);
    setItemSearch("");
    fetchData();
    fetchDataCustomer();
  }

  async function handlePendingPayments() {
    return new Promise<void>((resolve) => {
      axios
        .get(`/${userID}/pos/search/null?pending=true`)
        .then((response) => {
          if (response.data.length > 0) {
            const resultWithTotal = response.data.map((item: POSInvoiceReminder) => {
              return {
                ...item,
                total: item.fields.reduce(
                  (acc, curr) => acc + Number(curr.total),
                  0,
                ),
              };
            });
            setSearchModal(true);
            setSearchItemsResult(resultWithTotal);
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
    setInwardModal(true);
  }

  function handleOutward() {
    setOutwardModal(true);
  }

  function handleOrderStock() {
    setDialogVisible(false);
    setOrderStockVisible(true);
  }

  return loading || customerLoading ? (
    <div className="flex flex-1 w-full items-center justify-center h-[80vh]">
      <Spinner />
    </div>
  ) : (
    <PageContainer scrollable={true}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="flex flex-1 p-2 flex-col p-6 border rounded-lg shadow-lg gap-4 ">
          <RadioGroup
            defaultValue={selectedRadio}
            onValueChange={setSelectedRadio}
            className="flex"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="customer" id="r1" />
              <Label htmlFor="r1">Customer</Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="engineer" id="r2" />
              <Label htmlFor="r2">Engineer</Label>
            </div>
          </RadioGroup>

          {selectedRadio === "engineer" && (
            <UserSearch
              value={selectedUser.id}
              onReturn={(val) => {
                setSelectedUser((prevState) => ({ ...prevState, id: val }));
              }}
              onReturnName={(val) => {
                setSelectedUser((prevState) => ({ ...prevState, label: val }));
              }}
              placeholder="Select user"
            />
          )}
          {!walkIn && (
            <CustomerSearchWithData
              value={selectedCustomer}
              onReturn={(val) => {
                setSelectedCustomer(val);
                if (val?.number && Array.isArray(val.number))
                  setPhoneNumber(val.number.length > 0 ? val.number[0] : "");
                setName(val?.owner || "");
                setCompanyName(val?.name || "");
                setManager(val?.ownership_name || "");
                setAddress(val?.address || "");
              }}
            />
          )}

          <div className="w-full relative">
            <div className="flex flex-row w-full gap-2 items-center">
              <Label className="text-base font-semibold w-[100px]">
                Number:
              </Label>
              <Input
                disabled={!walkIn}
                placeholder="Phone Number"
                value={phoneNumber}
                onFocus={() => setShowList(true)}
                onBlur={() => setTimeout(() => setShowList(false), 500)}
                onChange={(e) => {
                  handlePhoneChange(e);
                }}
              />
            </div>
            {phoneNumber && showList && (
              <div className="absolute z-10 max-h-[200px] overflow-auto bg-white border rounded-md shadow-md">
                {filteredCustomers.length > 0 && (
                  <ul className="p-2">
                    {filteredCustomers.map((customer, index) => (
                      <li
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        {customer.name} ({customer.phone})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-row w-full gap-2 items-center">
            <Label className="text-base font-semibold w-[100px]">
              Customer:
            </Label>
            <Input
              disabled={!walkIn}
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-row w-full gap-2 items-center">
            <Label className="text-base font-semibold w-[100px]">
              Company:
            </Label>
            <Input
              disabled={!walkIn}
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="flex flex-row w-full gap-2 items-center">
            <Label className="text-base font-semibold w-[100px]">
              Address:
            </Label>
            <Textarea
              placeholder="Enter Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="flex flex-row w-full gap-2 items-center">
            <Label className="text-base font-semibold w-[100px]">
              Manager:
            </Label>
            <Input
              placeholder="Manager"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
            />
          </div>
          <Card className="p-5 bg-gray-100 dark:bg-gray-900 rounded-md shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Description", "Quantity", "Unit Price", "Amount"].map(
                    (header, index) => (
                      <TableHead key={index} className="text-left">
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
                      <div className="flex gap-2 items-center">
                        <Input readOnly name="total" value={item?.total} />
                        {item?.type === "other" && (
                          <FaMinusCircle
                            onClick={() => handleRemove(i)}
                            className="text-red-500 cursor-pointer"
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-center mt-4">
              <div
                onClick={() => setDialogVisible(true)}
                className="p-4 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-700 cursor-pointer"
              >
                <FaPlus />
              </div>

              <OrderStockDialog
                dialogVisible={orderStockVisible}
                onCloseDialog={setOrderStockVisible}
                stock={stock.filter(
                  (item) =>
                    item.threshold != null &&
                    item.threshold !== undefined &&
                    (item?.qty || 0) <= item.threshold,
                )}
                onRefresh={() => {
                  setStock([]);
                  fetchData();
                }}
              />
            </div>
          </Card>
          <div className="w-full flex justify-between gap-2">
            <div className="w-72 items-center flex border rounded-md overflow-hidden">
              <div className="flex-1 bg-gray-200 dark:bg-gray-900 p-3 font-bold text-center">
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
                className="border-0 shadow-none focus:border-0 focus:ring-0 focus:outline-none focus-visible:ring-0"
              />
            </div>

            <div className="w-72 flex border rounded-md overflow-hidden">
              <div className="flex-1 bg-gray-200 dark:bg-gray-900 p-3 font-bold text-center">
                Total Amount
              </div>
              <div className="flex-1 bg-white dark:bg-gray-800 p-3 font-bold text-center">
                {totalAmount ? `${totalAmount}` : "0"}
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-4 items-center mt-2">
            <div
              className="flex items-center justify-between bg-white shadow-md rounded-lg px-4 py-2 w-fit gap-2 cursor-pointer"
              onClick={() => {
                setPendingLoading(true);
                handlePendingPayments();
              }}
            >
              {pendingLoading && <Spinner />}
              <Label className="text-lg font-semibold text-gray-800 cursor-pointer">
                Pending Payments
              </Label>
              <NotificationBadge count={reminder.length} />
            </div>
            <div className="flex flex-row gap-2 items-center mr-2">
              <Label className="text-lg">Include warranty</Label>
              <Checkbox
                checked={warranty}
                onCheckedChange={(checked) => setWarranty(!!checked)}
              />
              {warranty && (
                <div>
                  <Input
                    type="number"
                    value={warrantyYear}
                    onChange={(e) => setWarrantyYear(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-row flex-wrap gap-2 w-full">
            {selectedSearchItem ? (
              <Button
                onClick={() => {
                  setLoading(true);
                  setCustomerLoading(true);
                  handleUpdateInvoice();
                }}
                disabled={invoiceItems.length === 0}
                className="h-[100px] w-[100px] text-wrap"
              >
                Update Invoice
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (selectedUser?.id) {
                    setLoading(true);
                    setCustomerLoading(true);
                    generatePDF();
                  } else {
                    setModal(true);
                  }
                }}
                disabled={invoiceItems.length === 0}
                className="h-[100px] w-[100px] whitespace-normal text-wrap text-center flex items-center justify-center"
              >
                Print Invoice
              </Button>
            )}

            <Button
              onClick={() => {
                setSearchInvoice(!searchInvocie);
              }}
             className="h-[100px] w-[100px] whitespace-normal text-wrap text-center flex items-center justify-center"
            >
              Search Invoice
            </Button>

            <Button
              variant="outline"
              onClick={handleEngineerItems}
              className="h-[100px] w-[100px] whitespace-normal text-wrap text-center flex items-center justify-center"
            >
           {engineerLoading && <Spinner />}  <div className="break-words"> Engineer issued items</div>
            </Button>

            <Button
              onClick={handleInward}
              className="h-[100px] w-[100px] whitespace-normal text-wrap text-center flex items-center justify-center"
            >
              <div className="break-words">
                Inward Gatepass
              </div>
            </Button>

            <Button
              onClick={handleOutward}
               className="h-[100px] w-[100px] whitespace-normal text-wrap text-center flex items-center justify-center"
            >
             <div className="break-words">Outward Gatepass</div>
            </Button>

            {selectedSearchItem && selectedSearchItem?.id && (
              <Link href={`/${base_route}/pos/${selectedSearchItem?.id}`} target="_blank">
                <Button className="h-[100px] w-[100px] text-wrap">
                  <div>Payment Record</div>
                </Button>
              </Link>
            )}

            <DeleteInvoice
              item={selectedSearchItem}
              onRefresh={() => handleReset()}
            />

          </div>

          {searchInvocie && (
            <div className="flex w-full items-center flex-wrap gap-4">
              <Input
                className="w-full sm:w-[250px]"
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
                <Button variant="outline" onClick={() => handleReset()}>
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
          setCustomerLoading(true);
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
          setCustomerLoading(true);
          await fetchData();
          await fetchDataCustomer();
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
          fetchData();
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
        onRefresh={() => {
          setAddProductVisible(false);
          setStock([]);
          fetchData();
        }}
        handleOrderStock={handleOrderStock}
        designation={designation}
      />

      <InwardModal
        visible={inwardModal}
        onClose={setInwardModal}
        data={stock}
        onRefresh={async () => {
          setLoading(true);
          await fetchData();
        }}
      />

      {/* <OutwardModal
        visible={outwardModal}
        onClose={setOutwardModal}
        data={stock}
        onRefresh={async () => {
          setLoading(true);
          await fetchData();
        }}
      /> */}
    </PageContainer>
  );
}
