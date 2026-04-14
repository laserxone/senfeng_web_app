"use client";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";

import PageTable from "@/components/app-table-without-pagination";
import SalaryPdf from "@/components/salaryPdf";
import axios from "@/lib/axios";
import moment from "moment";
import { FaRegFilePdf } from "react-icons/fa";
import "react-medium-image-zoom/dist/styles.css";

import { pdf } from "@react-pdf/renderer";

const SalaryRecord = ({ id }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  async function fetchData(id) {
    axios
      .get(`/${id}/record`)
      .then((response) => {
        setData(response.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const columns = [
    {
      accessorKey: "salary_month",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Salary Month
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">
          {row.getValue("salary_month")
            ? moment(new Date(row.getValue("salary_month"))).format("MMMM YYYY")
            : ""}
        </div>
      ),
    },

    {
      accessorKey: "user_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Employee
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
    },

    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const payment = row.original;

        return (
          <div className="flex gap-4">
            <FaRegFilePdf
              onClick={() => handleDownload(row.original)}
              className="h-7 w-7 text-red-500"
            />
          </div>
        );
      },
    },
  ];

  async function handleDownload(item) {
    const blob = await pdf(<SalaryPdf data={item} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 600000);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-1">
        <PageTable
          disableInput={true}
          loading={loading}
          columns={columns}
          data={data}
        
          onRowClick={(val, e) => {
            // setImageURL(val);
            // setVisible(true);
          }}
          // filter={true}
          // onFilterClick={() => setFilterVisible(true)}
        ></PageTable>
      </div>
    </div>
  );
};

export default SalaryRecord;
