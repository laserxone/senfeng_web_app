import PageTable from "@/components/app-table-without-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useIssuedItem from "@/hooks/use-issued-items";
import { UserReturnableField, UserReturnableType } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import moment from "moment";

const RenderReturnable = ({ height }: { height?: string }) => {
  const { issuedItems } = useIssuedItem();

  const columns: ColumnDef<UserReturnableType>[] = [
    {
      accessorKey: "created_at",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Issue Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">
          {row.getValue("created_at")
            ? moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")
            : ""}
        </div>
      ),
    },

    {
      accessorKey: "company",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("company")}</div>,
    },
    {
      accessorKey: "fields",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Items
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const items: UserReturnableField[] = row.original.fields || [];
        return (
          <div className="ml-2">
            <ul className="list-disc list-inside text-sm space-y-1">
              {items.map((item, i) => (
                <li key={i}>
                  {item.name} | Qty: {item.qty} | Total Price: {item.total}
                </li>
              ))}
            </ul>
          </div>
        );
      },
    },
  ];

  return (
    <Card className="flex flex-1 p-0">
      <CardContent className="pt-0 flex flex-1">
        <div className="flex flex-1 flex-col space-y-4">
          <div className="flex flex-1">
            <PageTable
              height={height}
              columns={columns}
              data={issuedItems}
              disableInput={true}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RenderReturnable;
