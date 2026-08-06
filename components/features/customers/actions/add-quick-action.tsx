"use client";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { MyCustomer, UserDashboard } from "@/lib/types";

type CustomerWithChecked = MyCustomer & {
  checked?: boolean;
};

const AddQuickAction = ({
  data,
  visible,
  onClose,
  onRefresh,
}: {
  data: MyCustomer[];
  visible: boolean;
  onClose: (val: boolean) => void;
  onRefresh: (a: number, b?: number, c?: string) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{ value: number; label: string }[]>([]);
  const [localData, setLocalData] = useState<CustomerWithChecked[]>(data);
  const [loadMore, setLoadMore] = useState(50);
  const [search, setSearch] = useState("");
  const [checkedAll, setCheckedAll] = useState(false);
  const [batchId, setBatchId] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchData, setBatchData] = useState<CustomerWithChecked[]>([]);
  const { userID } = useUserDetail();

  useEffect(() => {
    if (userID) setLocalData(data.map((item) => ({ ...item, checked: false })));
  }, [data, userID]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`/${userID}/user`);
        if (response.data.length > 0) {
          const finalData = response.data
            .filter((item: any) => {
              if (
                item.designation === "Sales" ||
                item.designation === "Manager"
              )
                return item;
            })
            .map((item: any) => ({
              value: item.id,
              label: item?.name || item.email,
            }));
          setUsers(finalData);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }
    if (visible) fetchData();
  }, [visible]);

  const handleUpdate = async (
    id: number,
    ownership: number | undefined = undefined,
    ownership_name: string | undefined = "",
  ): Promise<void> => {
    if (!id || !ownership) return;
    setLoading(true);
    try {
      const response = await axios.put(
        `/${userID}/customer/${id}?notify=true`,
        {
          ownership: ownership,
        },
      );
      onRefresh(id, ownership, ownership_name);
    } catch (error) {
      console.error("Error updating ownership:", error);
    } finally {
      setLoading(false);
    }
  };

  function handleClose(val: boolean) {
    setLoadMore(50);
    onClose(val);
  }

  const filteredData = localData
    .filter(
      (item) =>
        item?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item?.owner?.toLowerCase().includes(search.toLowerCase()) ||
        item?.location?.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, loadMore);

  function handleSingleChecked(val: boolean, id: number) {
    setLocalData((prevState) => {
      const temp = prevState.map((item) =>
        item.id === id ? { ...item, checked: val } : item,
      );

      const updatedBatch = temp.filter((item) => item.checked);
      setBatchData(updatedBatch);

      return temp;
    });
  }

  function handleCheckVisible(val: boolean) {
    setCheckedAll(val);

    const updatedData = localData.map((item) => {
      const isVisible = filteredData.some((f) => f.id === item.id);
      return isVisible ? { ...item, checked: val } : item;
    });

    const updatedBatch = updatedData.filter((item) => item.checked);

    setLocalData(updatedData);
    setBatchData(updatedBatch);
  }

  async function handleBatchUpdate() {
    if (!checkedAll || batchData.length == 0) return;
    setBatchLoading(true);

    try {
      const promises = batchData.map((item) =>
        axios
          .put(`/${userID}/customer/${item.id}`, {
            ownership: batchId?.value,
          })
          .then(() => {
            onRefresh(item.id, batchId?.value, batchId?.label);
          }),
      );

      await Promise.all(promises);
    } catch (error) {
      console.log("Batch update failed:", error);
    } finally {
      setBatchLoading(false);
    }
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-[80vw]">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <ListChecks className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Quick Action
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Reassign individual customers or update a selected batch.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="overflow-x-auto p-3.5">
            <div className="min-w-[900px] space-y-3">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center gap-4 rounded-lg border border-border bg-muted/40 p-2.5">
                <Checkbox
                  checked={checkedAll}
                  onCheckedChange={(checked: boolean) => {
                    handleCheckVisible(checked);
                  }}
                />
                <div className="w-1/5 pl-2 text-sm font-bold">Name</div>
                <div className="w-1/5 pl-2 text-sm font-bold">Owner</div>
                <div className="w-1/5 pl-2 text-sm font-bold">Location</div>
                <div className="w-1/5 text-sm font-bold">Ownership</div>
                <div className="w-1/5 text-sm font-bold">Action</div>
              </div>

              {/* Filters */}
              <div className="sticky top-12 z-10 flex gap-2 rounded-lg border border-border bg-card p-2">
                <Input
                  placeholder="Search customer"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {batchData.length > 0 && (
                  <>
                    <CustomUserSearch
                      data={users}
                      value={batchId?.value}
                      onReturn={(a, b) => setBatchId({ value: a, label: b })}
                    />
                    <Button onClick={handleBatchUpdate}>
                      {batchLoading && <Spinner />}Update All
                    </Button>
                  </>
                )}
              </div>

              {/* Scrollable Data Rows */}
              <div className="space-y-2">
                {filteredData.map(({ id, name, owner, location, checked }) => (
                  <RenderEachRow
                    key={id}
                    id={id}
                    name={name}
                    owner={owner}
                    location={location}
                    users={users}
                    handleUpdate={handleUpdate}
                    checked={checked}
                    setChecked={handleSingleChecked}
                  />
                ))}
              </div>

              {filteredData.length > 0 && loadMore <= filteredData.length && (
                <Button
                  className="h-9 w-full rounded-lg"
                  onClick={() => {
                    if (loadMore <= filteredData.length)
                      setLoadMore(loadMore + 50);
                  }}
                >
                  Load More
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const RenderEachRow = ({
  id,
  name,
  owner,
  handleUpdate,
  users,
  location,
  checked,
  setChecked,
}: {
  id: number;
  name?: string;
  owner?: string;
  handleUpdate: (a: number, b?: number, c?: string) => Promise<void>;
  users: { value: number; label: string }[];
  location?: string;
  checked?: boolean;
  setChecked: (val: boolean, id: number) => void;
}) => {
  const [selectedOwnership, setSelectedOwnership] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-11 items-center gap-4 rounded-lg border border-border bg-muted/30 p-2.5 text-foreground">
      <div>
        <Checkbox
          checked={checked}
          onCheckedChange={(checked: boolean) => {
            setChecked(checked, id);
          }}
        />
      </div>
      <div className="w-1/5 text-sm">{name}</div>
      <div className="w-1/5 text-sm">{owner}</div>
      <div className="w-1/5 text-sm">{location}</div>
      <div className="w-1/5 text-sm">
        <CustomUserSearch
          data={users}
          value={selectedOwnership?.value}
          onReturn={(a, b) => setSelectedOwnership({ value: a, label: b })}
        />
      </div>
      <div className="w-1/5 text-sm">
        <Button
          onClick={async () => {
            setLoading(true);
            await handleUpdate(
              id,
              selectedOwnership?.value,
              selectedOwnership?.label,
            );
            setLoading(false);
          }}
          disabled={loading}
          className="h-8 rounded-lg"
        >
          {loading ? <Spinner /> : "Update"}
        </Button>
      </div>
    </div>
  );
};

export function CustomUserSearch({
  value,
  onReturn,
  data,
}: {
  value?: number | null;
  onReturn: (a: number, b: string) => void;
  data: { value: number; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col space-y-4">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={() => setOpen(!open)}
      >
        {value
          ? data.find((item) => item.value === value)?.label
          : "Select user..."}
        <ChevronsUpDown className="opacity-50" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search user..." className="h-9" />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onReturn(item.value, item.label);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}

export default AddQuickAction;
