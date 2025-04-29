"use client";
import { ArrowUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContext, useEffect, useState } from "react";

import PageTable from "@/components/app-table";
import PageContainer from "@/components/page-container";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import axios from "@/lib/axios";
import { startHolyLoader } from "holy-loader";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function Inventory() {
  return <RenderInventory />;
}

const RenderInventory = () => {
  const [stock, setStock] = useState([]);
  const [visible, setVisible] = useState(false);
  const { state: UserState } = useContext(UserContext);
  const router = useRouter()

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
      .get(`/bookings`)
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

    
  ];


  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Heading
            title="Machine Inventory"
            description="Manage machine inventory"
          />
          <Button
            onClick={() => {
              setVisible(true);
            }}
          >
            Add Shipment
          </Button>
        </div>

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
            searchItem={"shipment"}
            searchName={`Search name...`}
            tableHeader={tableHeader}
            onRowClick={(val)=>{
            if(val?.id){
              startHolyLoader()
              router.push(`/${UserState.value.data?.base_route}/inventory/${val.id}`)
            }
            }}
          ></PageTable>
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
      const respose = await axios.post(`/bookings`, {
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
