"use client";

import { BASE_URL } from "@/constants/data";
import { cn } from "@/lib/utils";
import axios from "axios";
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

const AddQuickAction = ({ data, visible, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [localData, setLocalData] = useState(data);
  const [loadMore, setLoadMore] = useState(50);
  const [search, setSearch] = useState("")

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${BASE_URL}/user`);
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
      const response = await axios.put(`${BASE_URL}/customer/${id}`, {
        ownership: ownership,
      });
      onRefresh(id, ownership);
      setLocalData((prevData) => prevData.filter((item) => item.id !== id));
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


  const filteredData = localData.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[80vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Quick Action</DialogTitle>
  
          <div className="flex items-center gap-4 border p-2 rounded-md mx-4 mt-2">
            <div className="w-1/6 pl-2 text-sm font-bold">Name</div>
            <div className="w-1/5 pl-2 text-sm font-bold">Owner</div>
            <div className="flex-1 text-sm font-bold">Ownership</div>
            <div className="px-5 text-sm font-bold">Action</div>
          </div>
  
          <div className="px-4 py-2">
            <Input
              placeholder="Search customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </DialogHeader>
  
        <ScrollArea className="flex-1 overflow-y-auto px-2">
          <div className="px-2 space-y-4">
            {filteredData.slice(0, loadMore).map(({ id, name, owner, ownership }) => (
              <RenderEachRow
                key={id}
                id={id}
                name={name}
                owner={owner}
                ownership={ownership}
                users={users}
                handleUpdate={handleUpdate}
              />
            ))}
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

const RenderEachRow = ({ id, name, owner, ownership, handleUpdate, users }) => {
  const [selectedOwnership, setSelectedOwnership] = useState(ownership);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex items-center gap-4 border p-2 rounded-md">
      <div className="w-1/3 text-sm">{name}</div>
      <div className="w-1/3 text-sm">{owner}</div>
      <CustomUserSearch
        data={users}
        value={selectedOwnership}
        onReturn={(val) => setSelectedOwnership(val)}
      />

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
  );
};

function CustomUserSearch({ value, onReturn, data }) {
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
