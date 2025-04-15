"use client";

import { BASE_URL } from "@/constants/data";
import { cn } from "@/lib/utils";
import axios from "@/lib/axios";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import Spinner from "./ui/spinner";
import { Checkbox } from "./ui/checkbox";
import { UserSearch } from "./user-search";

const AddQuickAction = ({ data, visible, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [localData, setLocalData] = useState(data);
  const [loadMore, setLoadMore] = useState(50);
  const [search, setSearch] = useState("");
  const [checkedAll, setCheckedAll] = useState(false);
  const [batchId, setBatchId] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchData, setBatchData] = useState([]);

  useEffect(() => {
    setLocalData(data.map((item) => ({ ...item, checked: false })));
  }, [data]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`/user`);
        if (response.data.length > 0) {
          const finalData = response.data
            .filter((item) => {
              if (
                item.designation === "Sales" ||
                item.designation === "Manager"
              )
                return item;
            })
            .map((item) => ({
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

  const handleUpdate = async (id, ownership) => {
    setLoading(true);
    try {
      const response = await axios.put(`/customer/${id}`, {
        ownership: ownership,
      });
      onRefresh(id, ownership);
    } catch (error) {
      console.error("Error updating ownership:", error);
    } finally {
      setLoading(false);
      return true;
    }
  };

  function handleClose(val) {
    setLoadMore(50);
    onClose(val);
  }

  const filteredData = localData
    .filter(
      (item) =>
        item?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item?.owner?.toLowerCase().includes(search.toLowerCase()) ||
        item?.location?.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, loadMore);

  function handleSingleChecked(val, id) {
    setLocalData((prevState) => {
      const temp = prevState.map((item) =>
        item.id === id ? { ...item, checked: val } : item
      );

      const updatedBatch = temp.filter((item) => item.checked);
      setBatchData(updatedBatch);

      return temp;
    });
  }

  function handleCheckVisible(val) {
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
          .put(`/customer/${item.id}`, {
            ownership: batchId,
          })
          .then(() => {
            onRefresh(item.id, batchId);
          })
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
      <DialogContent className="max-w-[80vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className={"mb-2"}>Quick Action</DialogTitle>

          <div className="flex items-center gap-4 border p-2 rounded-md mx-4">
            <Checkbox
              checked={checkedAll}
              onCheckedChange={(checked) => {
                handleCheckVisible(checked);
              }}
            />
            <div className="w-1/5 pl-2 text-sm font-bold">Name</div>
            <div className="w-1/5 pl-2 text-sm font-bold">Owner</div>
            <div className="w-1/5 pl-2 text-sm font-bold">Location</div>
            <div className="w-1/5 text-sm font-bold">Ownership</div>
            <div className="w-1/5 text-sm font-bold">Action</div>
          </div>

          <div className="flex px-4 py-2 gap-2">
            <Input
              placeholder="Search customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {batchData.length > 0 && (
              <>
                <CustomUserSearch
                  data={users}
                  value={batchId}
                  onReturn={setBatchId}
                />
                <Button onClick={handleBatchUpdate}>
                  {batchLoading && <Spinner />}Update All
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-2">
          <div className="px-2 space-y-4">
            {filteredData.map(
              ({ id, name, owner, location, ownership, checked }) => (
                <RenderEachRow
                  key={id}
                  id={id}
                  name={name}
                  owner={owner}
                  ownership={ownership}
                  location={location}
                  users={users}
                  handleUpdate={handleUpdate}
                  checked={checked}
                  setChecked={handleSingleChecked}
                />
              )
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          {filteredData.length > 0 && loadMore <= filteredData.length && (
            <Button
              className="w-full"
              onClick={() => {
                if (loadMore <= filteredData.length) {
                  setLoadMore(loadMore + 50);
                }
              }}
            >
              Load More
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RenderEachRow = ({
  id,
  name,
  owner,
  ownership,
  handleUpdate,
  users,
  location,
  checked,
  setChecked,
}) => {
  const [selectedOwnership, setSelectedOwnership] = useState(ownership);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex items-center gap-4 border p-2 rounded-md">
      <div>
        <Checkbox
          checked={checked}
          onCheckedChange={(checked) => {
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
          value={selectedOwnership}
          onReturn={(val) => setSelectedOwnership(val)}
        />
      </div>
      <div className="w-1/5 text-sm">
        <Button
          onClick={async () => {
            setLoading(true);
            await handleUpdate(id, selectedOwnership);
            setLoading(false);
          }}
          disabled={loading}
        >
          {loading ? <Spinner /> : "Update"}
        </Button>
      </div>
    </div>
  );
};

export function CustomUserSearch({ value, onReturn, data }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? data.find((item) => item.value === value)?.label
            : "Select user..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="py-2 px-0">
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
                    onReturn(item.value);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default AddQuickAction;
