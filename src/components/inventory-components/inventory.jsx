"use client";
import {
  ArrowUpDown,
  ChevronsRight,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

import PageTable from "@/components/app-table";
import PageContainer from "@/components/page-container";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BASE_URL } from "@/constants/data";
import { UserContext } from "@/store/context/UserContext";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function Inventory() {
  return <RenderInventory />;
}

const RenderInventory = () => {
  const pageTableRef = useRef();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [stock, setStock] = useState([]);
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [visibleEdit, setVisibleEdit] = useState(false);
  const [selectedEdit, setSelectedEdit] = useState(false);
  const { state: UserState } = useContext(UserContext);

  const tableHeader = [
    {
      value: "shipment",
      label: "Name",
    },
  ];

  useEffect(() => {
    if (UserState.value.data?.id) {
     
      fetchData();
    }
  }, [UserState.value.data]);

  async function fetchData() {
    axios
      .get(`${BASE_URL}/bookings`)
      .then((response) => {
        if (response.data) {
          setStock(response.data);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }

  const columns = [
    {
      accessorKey: "shipment",
      filterFn: "includesString",
header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("shipment")}</div>,
    },

    {
      id: "actions",
      header : "Action",
      cell: ({ row }) => {
        const payment = row.original;

        return (
          <Link href={`/${UserState.value.data?.base_route}/inventory/detail?id=${row?.original?.id}`}>
            <ChevronsRight />
          </Link>
        );
      },
    },
  ];

 

  const totalStockValue = stock.reduce(
    (total, item) => total + item.qty * Number(item.price),
    0
  );
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(totalStockValue);

  const totalOutOfStock = stock.filter((item) => item.qty === 0).length;

  return (
    <PageContainer scrollable={false}>
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Machine Inventory" description="Manage machine inventory" />
        <Button
          onClick={() => {
            setVisible(true);
          }}
        >
          Add Shipment
        </Button>
      </div>

      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <PackageSearch />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock.length}</div>
           
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Store Value
            </CardTitle>
            <CircleDollarSign />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedTotal}</div>
           
          </CardContent>
        </Card>
        <div
          onClick={() => {
            setValue("qty");
            handleOutOfStock();
          }}
          className="hover:cursor-pointer"
        >
          <Card className="hover:bg-gray-200 dark:hover:bg-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out Of Stock
              </CardTitle>
              <PackageMinus />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOutOfStock}</div>
             
            </CardContent>
          </Card>
        </div>
      </div> */}

      {/* <ConfimationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove branch expense from the system"}
        onPressYes={() => console.log("press yes")}
        onPressCancel={() => setShowConfirmation(false)}
      /> */}

      <AddInventory
        visible={visible}
        onClose={setVisible}
        onRefresh={() => fetchData()}
      />

      <div className="flex flex-1">
        <PageTable
          
          columns={columns}
          data={stock}
          totalItems={stock.length}
          searchItem={'shipment'}
          searchName={`Search name...`}
          tableHeader={tableHeader}
        >
        
        </PageTable>
      </div>
    </div>
    </PageContainer>
  );
};

const AddInventory = ({ visible, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const formSchema = z.object({
    name: z.string().min(1, { message: "Shipment name is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values) {
    try {
      setLoading(true);
      const respose = await axios.post(`${BASE_URL}/bookings`, {
        shipment: values.name,
        data: [
          {
            QTY: "",
            SERIAL: "",
            MODEL: "",
            POWER: "",
            SOURCE: "",
            CUSTOMER: "",
            CITY: "",
            MANAGER: "",
            PRICE: "",
            DELIVERY: "",
            REMARKS: "",
          },
        ],
      });
      onRefresh();
      handleClose(false);
    } catch (error) {
      setLoading(false);
    }
  }
  function handleClose(val) {
    form.reset();
    setLoading(false);
    onClose(val);
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new shipment</DialogTitle>
        </DialogHeader>
        <div>
          <ScrollArea className="max-h-[80vh] px-2">
            <div className="px-2">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipment name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter shipment name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button className="w-full" type="submit">
                    {loading && <Loader2 className="animate-spin" />} Submit
                  </Button>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

