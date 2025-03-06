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
import { list } from "firebase/storage";
import * as XLSX from "xlsx";

export default function Page() {
  const [customerData, setCustomerData] = useState([]);
  const [machineData, setMachineData] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [reimbursement, setReimbursement] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [task, setTask] = useState([]);
  const [attendance, setAttendance] = useState([]);
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

  function getReimbursement() {
    getDocs(collection(db, "Reimbursement")).then((snapshot) => {
      let list = [];
      snapshot.forEach((docs) => {
        list.push(docs.data());
      });
      const sortedData = list.sort((a,b)=> b.TimeStamp - a.TimeStamp)
      const first100Entries = sortedData.slice(0, 100);
      console.log(first100Entries);
      setReimbursement(first100Entries);
    });
  }

  function saveReimbursement() {
    axios
      .post("/api/reimbursement", { data: reimbursement })
      .then(() => {
        console.log("done");
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // function saveExpenses() {
  //   axios
  //     .post("/api/expenses", { data: expenses })
  //     .then(() => {
  //       console.log("done");
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //     });
  // }

  // function getExpenses() {
  //   getDocs(collection(db, "BranchExpenses")).then((snapshot) => {
  //     let list = [];
  //     snapshot.forEach((docs) => {
  //       list.push(docs.data());
  //     });
  //     console.log(list);
  //     setExpenses(list);
  //   });
  // }

  // function getFeedback() {
  //   getDocs(collection(db, "Feedback")).then((snapshot) => {
  //     let list = [];
  //     snapshot.forEach((docs) => {
  //       list.push(docs.data());
  //     });
  //     console.log(list);
  //     setFeedback(list);
  //   });
  // }

  // function saveFeedback() {
  //   axios.post("/api/feedback", { data: feedback }).then((response) => {
  //     console.log("done");
  //   });
  // }

  // function getTask() {
  //   getDocs(collection(db, "Tasks")).then((snapshot) => {
  //     let list = [];
  //     const sixMonthsAgo = Date.now() - 3 * 30 * 24 * 60 * 60 * 1000; // Approximate 6 months in milliseconds

  //     snapshot.forEach((docs) => {
  //       let data = docs.data();
  //       if (data.TimeStamp >= sixMonthsAgo) { // Filter last 6 months
  //         list.push(data);
  //       }
  //     });

  //     console.log(list);
  //     setTask(list);
  //   });
  // }

  // function saveTask() {
  //   axios.post("/api/task", { data: task }).then((response) => {
  //     console.log("done");
  //   });
  // }

  // function getAttendance() {
  //   getDocs(collection(db, "EmployeeAttendance")).then((snapshot) => {
  //     let list = [];
  //     const sixMonthsAgo = Date.now() - 4 * 30 * 24 * 60 * 60 * 1000;

  //     snapshot.forEach((docs) => {
  //       let data = docs.data();
  //       if (data.timeIn >= sixMonthsAgo) {
  //         // Filter last 6 months
  //         list.push(data);
  //       }
  //       // list.push(docs.data());
  //     });

  //     console.log(list);
  //     setAttendance(list);
  //   });
  // }

  // function saveAttendance() {
  //   axios.post("/api/attendance", { data: attendance }).then((response) => {
  //     console.log("done");
  //   });
  // }
  return (
    <div className="flex flex-1 w-full h-[100vh] items-center justify-center gap-4">
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

      {/* <Button onClick={()=> updateCustomerOwnership()}>Update customers</Button> */}
      {/* <Button onClick={getFeedback}>Get feedback</Button>
      {feedback.length > 0 && (
        <Button onClick={saveFeedback}>Save feedback</Button>
      )} */}

      {/* <Button onClick={getAttendance}>Get Attendance</Button>
      {attendance.length > 0 && (
        <Button onClick={saveAttendance}>save Attendance</Button>
      )} */}

      <ExcelUploader />
    </div>
  );
}


const ExcelUploader = () => {
  const [file, setFile] = useState(null);

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) setFile(uploadedFile);
  };

  const handleImport = async () => {
    if (!file) return alert("Please select a file!");

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = async (e) => {
      const binaryData = e.target?.result;
      const workbook = XLSX.read(binaryData, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet); // Convert sheet data to JSON

      console.log(rows)

      axios.post("/api/inventory", {data : rows})
      .then((response)=>{
        alert("Import completed!");
      })

      // for (const row of rows) {
      //   await fetch("/api/import", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify(row),
      //   });
      // }
    
    };
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <Button onClick={handleImport} disabled={!file}>Import Data</Button>
    </div>
  );
}
