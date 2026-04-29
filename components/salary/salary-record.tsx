
"use client";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Trash2 } from "lucide-react";
import {
    memo,
    useEffect,
    useState
} from "react";

import PageTable from "@/components/app-table-without-pagination";
import SalaryPdf from "@/components/salaryPdf";
import  Heading  from "@/components/ui/heading";
import axios from "@/lib/axios";
import moment from "moment";
import { FaRegFilePdf } from "react-icons/fa";
import "react-medium-image-zoom/dist/styles.css";

import useUserDetail from "@/hooks/use-user-detail";
import { pdf } from "@react-pdf/renderer";
import { SalaryRecord, UserSalaryProps } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";

const RecordComponent = () => {
    const { userID } = useUserDetail();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<SalaryRecord[]>([]);

    useEffect(() => {
        if (userID) {
            fetchData();
        }
    }, [userID]);

    async function fetchData() {
        setLoading(true)
        axios
            .get(`/${userID}/record`)
            .then((response) => {
                setData(response.data);
            })
            .finally(() => {
                setLoading(false);
            });
    }



    const columns : ColumnDef<SalaryRecord>[] = [
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

                return (
                    <div className="flex gap-4">
                        <FaRegFilePdf
                            onClick={() => handleDownload(row.original)}
                            className="h-7 w-7 text-red-500"
                        />
                        <Trash2
                            onClick={() => handleDelete(row.original.id)}
                            className="h-7 w-7 text-red-500"
                        />
                    </div>
                );
            },
        },
    ];

    async function handleDelete(id : number) {
        if (!id) return;
        setLoading(true);
        axios
            .delete(`/${userID}/record/${id}`)
            .then(async () => {
                await fetchData();
            })
            .finally(() => {
                setLoading(false);
            });
    }

    async function handleDownload(item : SalaryRecord) {
        const passingData : UserSalaryProps = {
             salary_month: item.salary_month,
    id: String(item.id),
    user_name: item.user_name,
    payable: item.payable,
    reimbursement: item.reimbursement,
    commission: item.commission,
    kpi: item.kpi,
    miscellaneous: item.miscellaneous,
    additional_fine: item.additional_fine,
    late_fine_per_day: item.late_fine_per_day,
    absents: String(item.absents),
    late: String(item.late),
    fuel: item.fuel,
   
        }
        const blob = await pdf(<SalaryPdf data={passingData} />).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 600000);
    }

    return (
        <div className="flex flex-1 flex-col gap-4">
            <Heading
                className="my-4"
                title={"Salary Record"}
                description={"Explore issued salaries"}
            />
       
                <PageTable
                    loading={loading}
                    columns={columns}
                    data={data}
                 />
          
        </div>
    );
};

export default memo(RecordComponent)