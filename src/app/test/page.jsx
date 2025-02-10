"use client";
import { Button } from "@/components/ui/button";
import { db } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useState } from "react";
import data from "./combined.json";
// import userData from './users.json'
import axios from "axios";
import updateCustomerOwnership from "@/lib/tempFunction";

export default function Page() {
  const [customerData, setCustomerData] = useState([]);
  const [machineData, setMachineData] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [reimbursement, setReimbursement] = useState([]);
  const [expenses, setExpenses] = useState([]);
  // async function getData() {
  //   await getDocs(collection(db, "Customer")).then((snapshot) => {
  //     let list = [];
  //     snapshot.forEach((docs) => {
  //       list.push({ ...docs.data(), id: docs.id });
  //     });
  //     setCustomerData(list);
  //   });

  //   await getDocs(
  //     query(collection(db, "Sale"), where("type", "==", "Machine"))
  //   ).then((snapshot) => {
  //     let list = [];
  //     snapshot.forEach((docs) => {
  //       list.push({ ...docs.data(), id: docs.id });
  //     });
  //     setMachineData(list);
  //   });

  //   await getDocs(collection(db, "Payments")).then((snapshot) => {
  //     let list = [];
  //     snapshot.forEach((docs) => {
  //       list.push({ ...docs.data(), id: docs.id });
  //     });
  //     setPayments(list);
  //   });

  // }

  function downloadJSON(data, filename = "data.json") {
    const jsonStr = JSON.stringify(data, null, 2); // Pretty format
    const blob = new Blob([jsonStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // function processData() {
  //   const result = structureData(customerData, machineData, payments);
  //   console.log(result);
  //   downloadJSON(result, "combined.json")
  // }

  // function structureData(customers, machines, payments) {
  //   let structuredData = [];
  //   let debugData = { unmatchedMachines: [], unmatchedPayments: [] };

  //   // Create a lookup map for customers
  //   let customerMap = {};
  //   customers.forEach((customer) => {
  //     customerMap[customer.id] = { ...customer, machines: [] };
  //   });

  //   // Create a lookup map for machines
  //   let machineMap = {};
  //   machines.forEach((machine) => {
  //     if (customerMap[machine.clientID]) {
  //       let machineObj = { ...machine, payments: [] };
  //       customerMap[machine.clientID].machines.push(machineObj);
  //       machineMap[`${machine.clientID}_${machine.inv}`] = machineObj;
  //     } else {
  //       debugData.unmatchedMachines.push(machine);
  //     }
  //   });

  //   // Assign payments to the correct machine
  //   payments.forEach((payment) => {
  //     let key = `${payment.clientID}_${payment.inv}`;
  //     if (machineMap[key]) {
  //       machineMap[key].payments.push(payment);
  //     } else {
  //       debugData.unmatchedPayments.push(payment);
  //     }
  //   });

  //   // Convert customer map to array
  //   structuredData = Object.values(customerMap);

  //   return { structuredData, debugData };
  // }

  // async function getUsers() {
  //   await getDocs(collection(db, "AllowedUsers")).then((snapshot) => {
  //     let list = [];
  //     snapshot.forEach((docs) => {
  //       list.push({ ...docs.data(), id: docs.id });
  //     });
  //     setUsers(list);
  //   });
  // }

  // function showData() {
  //   console.log(data);
  // }

  // function showUser() {
  //   console.log(users);
  //   downloadJSON(users, "users.json")

  // }

  // function sendToApi() {
  //   console.log(data);
  //   const updatedCustomers = data.structuredData.map((customer) => ({
  //     ...customer,
  //     machines: customer.machines.map((machine) => {
  //       const { itemsSold, ...rest } = machine;
  //       const mergedItem = itemsSold?.length ? itemsSold[0] : {}; // Extract first entry if exists
  //       return { ...rest, ...mergedItem }; // Merge the extracted item into machine
  //     }),
  //   }));

  //   console.log(updatedCustomers);
  //   axios
  //     .post("/api/machine", {
  //       data: updatedCustomers,
  //     })
  //     .then((response) => {
  //       console.log(response.data);
  //     });
  // }

  // function getReimbursement() {
  //   getDocs(collection(db, "Reimbursement")).then((snapshot) => {
  //     let list = [];
  //     snapshot.forEach((docs) => {
  //       list.push(docs.data());
  //     });
  //     console.log(list);
  //     setReimbursement(list);
  //   });
  // }

  // function saveReimbursement() {
  //   axios
  //     .post("/api/reimbursement", { data: reimbursement })
  //     .then(() => {
  //       console.log("done");
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //     });
  // }

  function saveExpenses() {
    axios
      .post("/api/expenses", { data: expenses })
      .then(() => {
        console.log("done");
      })
      .catch((e) => {
        console.log(e);
      });
  }

  function getExpenses() {
    getDocs(collection(db, "BranchExpenses")).then((snapshot) => {
      let list = [];
      snapshot.forEach((docs) => {
        list.push(docs.data());
      });
      console.log(list);
      setExpenses(list);
    });
  }
  return (
    <div className="flex flex-1 w-full h-[100vh] items-center justify-center">
      {/* <Button onClick={getData}>Get Data</Button>
      {customerData.length != 0 && (
        <Button onClick={() => downloadJSON(customerData, "customer.json")}>
          Save Customer
        </Button>
      )}

      {payments.length != 0 && (
        <Button onClick={() => downloadJSON(payments, "payment.json")}>
          Save Payments
        </Button>
      )}

      {machineData.length != 0 && (
        <Button onClick={() => downloadJSON(machineData, "machine.json")}>
          Save Machine
        </Button>
      )}
      {customerData.length != 0 &&
        payments.length != 0 &&
        machineData.length != 0 && (
          <Button onClick={processData}>Process Data</Button>
        )} */}
      {/* <Button onClick={getUsers} >Get User</Button>
      <Button onClick={showData}>Show data</Button>
      {users && <Button onClick={showUser}>Show users</Button>} */}
      {/* <Button onClick={sendToApi}>Send</Button> */}

      {/* <Button onClick={getReimbursement}>Get</Button>
      {reimbursement.length > 0 && (
        <Button onClick={saveReimbursement}>Save reimbursement</Button>
      )} */}
{/* 
      <Button onClick={getExpenses}>Get</Button>
      {expenses.length > 0 && (
        <Button onClick={saveExpenses}>Save Expenses</Button>
      )} */}

      <Button onClick={()=> updateCustomerOwnership()}>Update customers</Button>
    </div>
  );
}
