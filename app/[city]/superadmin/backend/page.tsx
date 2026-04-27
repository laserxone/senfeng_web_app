
"use client";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import Heading from "@/components/ui/heading";
import Spinner from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";

type TableType = {
  table_name : string
}

type ColumnType = {
  name : string
  type: string
}



export default function BackendPage() {
  const { userID } = useUserDetail();

  const [tables, setTables] = useState<TableType[]>([]);
  const [selected, setSelected] = useState("");

  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [originalRows, setOriginalRows] = useState([]);

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [saveLoading, setSaveLoading] = useState(false)

const isMobile = useIsMobile()
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;


  const [editedRows, setEditedRows] = useState<any>({});

  const hasChanges = useMemo(() => Object.keys(editedRows).length > 0, [editedRows]);


  useEffect(() => {
    if (!userID) return;
    axios.get(`/${userID}/backend/tables`).then((res) => {
      setTables(res.data || []);
    });
  }, [userID]);


  useEffect(() => {
    if (!userID || !selected) return;


    setEditedRows({});
    setRows([]);
    setOriginalRows([]);
    setColumns([]);
    setPage(1);

    axios.get(`/${userID}/backend/table/${selected}`).then((res) => {
      const data = res.data || {};
      setColumns(data.columns || []);
      setRows(data.rows || []);

      setOriginalRows(data.rows ? JSON.parse(JSON.stringify(data.rows)) : []);
      setEditedRows({});
      setPage(1);
      setSortConfig({ key: "", direction: "" });
      setSearch("");
    });
  }, [userID, selected]);

  const filteredRows = useMemo(() => {
    const q = (search || "").toLowerCase();

    let list = (rows || []).filter((r) =>
      Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))
    );

    if (sortConfig.key) {
      const key = sortConfig.key;
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        const x = a[key];
        const y = b[key];


        if (x == null && y != null) return 1;
        if (x != null && y == null) return -1;
        if (x == null && y == null) return 0;

        if (typeof x === "number" && typeof y === "number") return (x - y) * dir;

        return String(x).localeCompare(String(y)) * dir;
      });
    }

    return list;
  }, [rows, search, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  function isoToLocalInput(iso : string) {
    if (!iso) return "";
    const d = new Date(iso);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - tzOffset);
    return local.toISOString().slice(0, 16);
  }
  function localInputToIso(localValue : string) {
    if (!localValue) return null;
    const d = new Date(localValue);
    return d.toISOString();
  }


  function handleEdit(rowId : number, colName : string, newValue : string | null | string[] | boolean | number) {
    setEditedRows((prev : any) => {
      const next : any = { ...prev };
      const rowEdits = { ...(next[rowId] || {}) };


      if (newValue === "") rowEdits[colName] = null;
      else rowEdits[colName] = newValue;


      const origRow = originalRows.find((r : {id : number}) => String(r.id) === String(rowId));
      const origVal = origRow ? origRow[colName] : undefined;

      const changed =
        (origVal === null && rowEdits[colName] !== null) ||
        (origVal !== null && rowEdits[colName] === null) ||
        (typeof origVal === "object" && typeof rowEdits[colName] === "object"
          ? JSON.stringify(origVal) !== JSON.stringify(rowEdits[colName])
          : String(origVal ?? "") !== String(rowEdits[colName] ?? ""));

      if (!changed) {

        delete rowEdits[colName];
      }

      if (Object.keys(rowEdits).length === 0) {
        delete next[rowId];
      } else {
        next[rowId] = rowEdits;
      }

      return next;
    });


    setRows((prev) => prev.map((r) => (String(r.id) === String(rowId) ? { ...r, [colName]: newValue } : r)));
  }


  async function saveAllChanges() {
    if (!selected || !userID) return;
    if (!hasChanges) return;

    setSaveLoading(true)
    try {
      await axios.patch(`/${userID}/backend/save/${selected}`, { changes: editedRows });

      const res = await axios.get(`/${userID}/backend/table/${selected}`);
      const data = res.data || {};
      setColumns(data.columns || []);
      setRows(data.rows || []);
      setOriginalRows(data.rows ? JSON.parse(JSON.stringify(data.rows)) : []);
      setEditedRows({});
      setPage(1);
    } catch (err) {
      console.error("Save failed", err);

    } finally {
      setSaveLoading(false)
    }
  }


  function revertRow(rowId : number) {
    const orig = originalRows.find((r : {id : number}) => String(r.id) === String(rowId));
    if (!orig) return;
    setRows((prev) => prev.map((r) => (String(r.id) === String(rowId) ? JSON.parse(JSON.stringify(orig)) : r)));
    setEditedRows((prev : any) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  }


  function discardAll() {
    setRows(JSON.parse(JSON.stringify(originalRows)));
    setEditedRows({});
    setPage(1);
  }


function renderCellInput(row :any, col : ColumnType) {
  const colName = col.name;
  const type = (col.type || "").toLowerCase();
  const value = row[colName];

  const origRow = originalRows.find((r : {id : number}) => String(r.id) === String(row.id));
  const origVal = origRow ? origRow[colName] : undefined;

  const changed =
    (origVal === null && value !== null) ||
    (origVal !== null && value === null) ||
    (typeof origVal === "object" && typeof value === "object"
      ? JSON.stringify(origVal) !== JSON.stringify(value)
      : String(origVal ?? "") !== String(value ?? ""));

  const changedClass = changed ? "bg-yellow-200 dark:bg-yellow-700" : "";

  
  if (type.endsWith("[]") || type.includes("array")) {
    let arrString = "";

    if (Array.isArray(value)) {
      arrString = value.join(", ");
    } else if (value === null) {
      arrString = "";
    } else {
      try {
        arrString = Array.isArray(value) ? value.join(", ") : String(value);
      } catch {
        arrString = String(value ?? "");
      }
    }

    return (
      <Textarea
        defaultValue={arrString}
        placeholder="Comma separated values (leave empty for NULL)"
        onBlur={(e) => {
          const raw = e.target.value.trim();

          if (raw === "") {
            handleEdit(row.id, colName, null);
            return;
          }

          let parsedArray = raw.split(",").map((v) => v.trim());

          // Convert numbers if the array type is numeric
          if (["int", "integer", "numeric", "bigint", "smallint"].some((t) => type.includes(t))) {
            parsedArray = parsedArray.map((n : any) => (isNaN(n) ? n : Number(n)));
          }

          handleEdit(row.id, colName, parsedArray);
        }}
        className={`${changedClass} min-h-[60px]`}
      />
    );
  }

  // -------------------------------------------------------------
  // BOOLEAN
  // -------------------------------------------------------------
  if (type === "boolean") {
    return (
      <select
        value={value === null ? "___NULL___" : value ? "true" : "false"}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "___NULL___") handleEdit(row.id, colName, null);
          else handleEdit(row.id, colName, v === "true");
        }}
        className={`px-2 py-1 rounded ${changedClass}`}
      >
        <option value="___NULL___">NULL</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  // -------------------------------------------------------------
  // NUMERIC
  // -------------------------------------------------------------
  if (
    type.includes("int") ||
    type.includes("numeric") ||
    ["integer", "bigint", "smallint", "decimal", "real", "double precision"].includes(type)
  ) {
    return (
      <Input
        type="number"
        defaultValue={value ?? ""}
        onBlur={(e) => {
          const v = e.target.value;
          handleEdit(row.id, colName, v === "" ? null : Number(v));
        }}
        className={changedClass}
      />
    );
  }

  // -------------------------------------------------------------
  // DATE/TIME
  // -------------------------------------------------------------
  if (type.includes("timestamp") || type.includes("date") || type.includes("time")) {
    return (
      <Input
        type="datetime-local"
        defaultValue={isoToLocalInput(value)}
        onBlur={(e) => {
          const v = e.target.value;
          handleEdit(row.id, colName, v === "" ? null : localInputToIso(v));
        }}
        className={changedClass}
      />
    );
  }

  // -------------------------------------------------------------
  // JSON
  // -------------------------------------------------------------
  if (type.includes("json")) {
    let textValue = "";

    try {
      textValue = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value ?? "");
    } catch {
      textValue = String(value ?? "");
    }

    return (
      <Textarea
        defaultValue={textValue}
        onBlur={(e) => {
          const v = e.target.value;

          try {
            const parsed = v.trim() === "" ? null : JSON.parse(v);
            handleEdit(row.id, colName, parsed);
          } catch {
            handleEdit(row.id, colName, v === "" ? null : v);
          }
        }}
        className={`${changedClass} min-h-[80px]`}
      />
    );
  }

  // -------------------------------------------------------------
  // DEFAULT TEXT / VARCHAR / ETC
  // -------------------------------------------------------------
  return (
    <Input
      defaultValue={value ?? ""}
      onBlur={(e) => handleEdit(row.id, colName, e.target.value === "" ? null : e.target.value)}
      className={changedClass}
    />
  );
}


  return (

    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Heading
          title="Backend Database Panel"
          description="Manage portal database"
        />
        <div className="flex items-center gap-3">
          {hasChanges && (
            <>
              <Button onClick={saveAllChanges} className="bg-green-600">
             {saveLoading && <Spinner />}   Save changes
              </Button>
              <Button variant="outline" onClick={discardAll}>
                Discard changes
              </Button>
            </>
          )}
        </div>
      </div>



      <div className="flex flex-wrap items-center gap-4">
        <div className="w-64">
          <Select onValueChange={(v) => setSelected(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((t) => (
                <SelectItem key={t.table_name} value={t.table_name}>
                  {t.table_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder="Search rows..."
          className="w-64"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <div className="ml-auto text-sm text-muted-foreground">
          {selected ? `${(rows || []).length} rows` : ""}
        </div>
      </div>
       <div
        className={`relative flex flex-1 flex-col min-h-[calc(100dvh-290px)] ${isMobile && "min-h-[500px]"}`}
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 flex rounded-md border md:overflow-auto custom-scrollbar overflow-auto">

         
            {selected ? (
             
                <Table className="relative">
                  <TableHeader className="sticky top-0 z-99 bg-background">
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead
                          key={col.name}
                          className="whitespace-nowrap cursor-pointer"
                          onClick={() => {
                            const key = col.name;
                            let dir = "asc";
                            if (sortConfig.key === key && sortConfig.direction === "asc") dir = "desc";
                            setSortConfig({ key, direction: dir });
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span>{col.name}</span>
                            {sortConfig.key === col.name && <span className="text-xs">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>}
                            <span className="text-xs text-muted-foreground">({col.type})</span>
                          </div>
                        </TableHead>
                      ))}

                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedRows.map((row) => (
                      <TableRow key={String(row.id) || JSON.stringify(row)}>
                        {columns.map((col) => (
                          <TableCell key={col.name} className="align-top w-[180px]">
                            {renderCellInput(row, col)}
                          </TableCell>
                        ))}

                        <TableCell className="align-top">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => revertRow(row.id)}>
                              Revert
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
          
            ) : (
              <div className="p-6 text-muted-foreground">Select a table to view rows</div>
            )}
   
        </div>
      </div>

      {selected && (
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm">
            Showing {filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} - {Math.min(filteredRows.length, page * PAGE_SIZE)} of {filteredRows.length}
          </div>

          <div className="flex items-center gap-3">
            <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>

            <div className="text-sm">Page {page} of {totalPages}</div>

            <Button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
