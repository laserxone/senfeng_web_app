"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FaWhatsapp } from "react-icons/fa";
import { Mail, Phone, MapPin, MessageCircle, Pencil } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import PageContainer from "@/components/page-container";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Page() {
  const search = useSearchParams();
  const [data, setData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const { toast } = useToast();

  useEffect(() => {
    const id = search.get("id");
    if (id) {
      axios
        .get(`/api/customer/${id}`)
        .then((response) => {
          setData(response.data);
          if (response.data?.machines?.length === 0) {
            toast({
              variant: "destructive",
              title: "Ops",
              description: "No machine sold",
            });
          }
        })
        .catch((e) => {
          toast({
            variant: "destructive",
            title: "Something went wrong.",
            description:
              e?.reponse?.data?.message ||
              "There was a problem with your request.",
          });
        });

      axios.get("/api/users").then((response) => {
        setAllUsers(response.data);
      });
    }
  }, [search]);

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <ClientCard data={data} users={allUsers} />
        <MachinesList data={data.machines || []} />
      </div>
    </PageContainer>
  );
}

const ClientCard = ({ data, users }) => {
  const joinedNumber = data?.number ? data.number.join(", ") : "";
  const [edit, setEdit] = useState(false);
  const [newUser, setNewUser] = useState(null);
  return (
    <Card className="shadow-lg rounded-2xl p-4 self-center">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {data?.name}{" "}
          <span className="text-gray-500 text-sm">({data?.owner})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <FaWhatsapp className="h-5 w-5 text-gray-500" />
          <span>{data?.group}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-gray-500" />
          <span>{data?.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-500" />
          <span>{data?.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-gray-500" />
          <span>{joinedNumber}</span>
        </div>
        <BillingInformation
          total={data?.bill_total}
          received={data?.bill_received}
          balance={data?.bill_total - data?.bill_received}
        />
        <div className="flex items-center gap-2">
          <Label className="font-medium text-[16px]">Ownership: </Label>
          {edit ? (
            <>
              <Select
                onValueChange={(val) => setNewUser(Number(val))}
                value={newUser || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">Save</Button>
            </>
          ) : (
            <span>{data?.ownership && data?.ownership_name}</span>
          )}
          <Button
            onClick={() => {
              if (edit) {
                setNewUser(null);
              }
              setEdit(!edit);
            }}
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <Pencil />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const MachinesList = ({ data }) => {
  const router = useRouter();

  return (
    <Card className="w-full shadow-lg rounded-2xl px-2 ">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Sold Machines</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((machine) => (
          <Link
            key={machine.id}
            href={`machine?id=${machine.id}`}
            className="p-4 border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer flex flex-col gap-2"
          >
            <h4 className="text-lg font-semibold">{machine.name}</h4>
            <div className=" gap-2 text-sm text-gray-700">
              <p>
                <strong>Contract Date:</strong>{" "}
                {machine?.created_at
                  ? new Date(machine.created_at).toLocaleDateString("en-GB")
                  : ""}
              </p>
              <p>
                <strong>Order No:</strong> {machine?.order_no}
              </p>
              <p>
                <strong>Model No:</strong>{" "}
                {machine?.model_no || machine.serial_no}
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

const BillingInformation = ({ total, received, balance }) => {
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(total || 0);
  const formattedReceived = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(received || 0);
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(balance || 0);
  return (
    <div className="p-4 mt-4 bg-gray-100 rounded-lg shadow-sm dark:bg-gray-800 dark:text-white">
      <h3 className="text-lg font-semibold text-black dark:text-white">
        Billing Summary
      </h3>
      <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300 mt-2">
        <p>
          <strong>Bill:</strong>
        </p>
        <p>
          <strong>Received:</strong>
        </p>
        <p>
          <strong>Balance:</strong>
        </p>
      </div>
      <div
        className="grid grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300 mt-2"
        style={{ fontWeight: 700 }}
      >
        <p>{formattedTotal}</p>
        <p style={{ color: "green", fontWeight: 700 }}>{formattedReceived}</p>
        <p style={{ color: "red", fontWeight: 700 }}>{formattedBalance}</p>
      </div>
    </div>
  );
};
