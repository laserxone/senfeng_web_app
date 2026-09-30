"use client";

import { Icons } from "@/components/shared/common/icons";
import { employeeNavItems } from "@/constants/data";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Check,
  ChevronsUpDown,
  FolderPlus,
  GripVertical,
  LayoutPanelTop,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Item = {
  id: string;
  moduleId?: string;
  title: string;
  icon: string;
  url?: string;
  items: Item[];
};

const modules = [
  ["dashboard", "Dashboard", "/dashboard", "dashboard"],
  ["task", "Task Management", "/task", "task"],
  ["customer", "Customers", "/customer", "customer"],
  ["member", "Members", "/member", "member"],
  ["quotation", "Quotation", "/quotation", "quotation"],
  ["dms", "Document Management", "/dms", "dms"],
  ["applications", "Applications", "/applications", "applications"],
  [
    "application-loan",
    "Loan Applications",
    "/applications/loan",
    "applications",
  ],
  [
    "application-gift",
    "Gift Applications",
    "/applications/gift",
    "applications",
  ],
  [
    "application-backup",
    "Backup Applications",
    "/applications/backup",
    "applications",
  ],
  ["cloud", "My Cloud", "/cloud", "cloud"],
  ["finance", "Finance", "/finance", "finance"],
  ["commission", "Commission", "/commission", "commission"],
  ["prices", "Prices", "/prices", "coins"],
  ["pos", "Point Of Sale", "/pos", "pos"],
  ["parts-orders", "Parts Orders", "/parts-orders", "partsReceiving"],
  ["backupparts", "Backup Parts", "/backupparts", "partsReceiving"],
  [
    "delivery-machine",
    "Machine Delivery",
    "/delivery/machinedelivery",
    "truck",
  ],
  ["delivery-delivered", "Delivered Orders", "/delivery/delivered", "truck"],
  ["parts-receiving", "Parts Receiving", "/parts-receiving", "partsReceiving"],
  ["complaint", "Complaint & Installation", "/complaint", "complaint"],
  [
    "repairandmaintenance",
    "Repair and Maintenance",
    "/repairandmaintenance",
    "settings",
  ],
  [
    "engineerperformance",
    "Engineer's Performance",
    "/engineerperformance",
    "performance",
  ],
  ["lists", "Lists", "/lists", "lists"],
  ["careers", "Careers", "/careers", "careers"],
  ["teamattendance", "Team Attendance", "/teamattendance", "hr"],
  ["expense", "Office Expense", "/expense", "expense"],
  [
    "reimbursementapproval",
    "Reimbursement Approval",
    "/reimbursementapproval",
    "finance",
  ],
  ["messages", "Messages", "/messages", "messages"],
  ["notifications", "Notifications", "/notification", "messages"],
  ["profile", "Profile", "/profile", "user"],
] as const;

const icons = [
  "dashboard",
  "customer",
  "member",
  "quotation",
  "dms",
  "cloud",
  "sales",
  "finance",
  "commission",
  "coins",
  "pos",
  "truck",
  "partsReceiving",
  "task",
  "hr",
  "applications",
  "complaint",
  "settings",
  "performance",
  "careers",
  "lists",
  "messages",
  "user",
];
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const short = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5)
    .split("")
    .join(" + ") || "—";
const isHeading = (item: Item) => !item.url;
const reorder = <T,>(items: T[], from: number, to: number) => {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

function initial() {
  return employeeNavItems.map((item) => ({
    id: uid("nav"),
    moduleId: modules.find((module) => module[2] === item.url)?.[0],
    title: item.title,
    icon: item.icon ?? "dashboard",
    url: item.url,
    items: (item.items ?? []).map((child) => ({
      id: uid("nav-page"),
      moduleId: modules.find((module) => module[2] === child.url)?.[0],
      title: child.title,
      icon: child.icon ?? "dashboard",
      url: child.url,
      items: [],
    })),
  }));
}

export function NavigationAccessEditor({
  designation,
}: {
  designation: string;
}) {
  const [tree, setTree] = useState<Item[]>(initial);
  const [moduleToAdd, setModuleToAdd] = useState("");
  const [modulePickerOpen, setModulePickerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    tree[0]?.id ?? null,
  );
  const selected = (() => {
    for (const heading of tree) {
      if (heading.id === selectedId)
        return { item: heading, parent: null as Item | null };
      const page = heading.items.find((item) => item.id === selectedId);
      if (page) return { item: page, parent: heading };
    }
    return null;
  })();
  const update = (patch: Partial<Item>) => {
    if (!selected) return;
    setTree((current) =>
      current.map((heading) =>
        heading.id === selected.item.id
          ? { ...heading, ...patch }
          : {
              ...heading,
              items: heading.items.map((page) =>
                page.id === selected.item.id ? { ...page, ...patch } : page,
              ),
            },
      ),
    );
  };
  const addHeading = () => {
    const heading = {
      id: uid("heading"),
      title: "New heading",
      icon: "dashboard",
      items: [],
    };
    setTree((current) => [...current, heading]);
    setSelectedId(heading.id);
  };
  const selectedModules = new Set(
    tree.flatMap((item) => [item, ...item.items]).map((item) => item.moduleId),
  );
  const sortedModules = [...modules].sort((a, b) => a[1].localeCompare(b[1]));
  const selectedModuleTitle = modules.find(([id]) => id === moduleToAdd)?.[1];
  const addModule = (parent?: Item | null) => {
    const selectedModule = modules.find(([id]) => id === moduleToAdd);
    if (!selectedModule) return toast.error("Select a module first");
    const [moduleId, title, url, icon] = selectedModule;
    const page: Item = {
      id: uid("page"),
      moduleId,
      title,
      url,
      icon,
      items: [],
    };
    setTree((current) =>
      parent
        ? current.map((heading) =>
            heading.id === parent.id
              ? { ...heading, items: [...heading.items, page] }
              : heading,
          )
        : [...current, page],
    );
    setSelectedId(page.id);
    setModuleToAdd("");
  };
  const remove = () => {
    if (!selected) return;
    setTree((current) =>
      current
        .filter((heading) => heading.id !== selected.item.id)
        .map((heading) => ({
          ...heading,
          items: heading.items.filter((page) => page.id !== selected.item.id),
        })),
    );
    setSelectedId(null);
  };
  const reparent = (target: string) => {
    if (!selected || isHeading(selected.item)) return;
    if (target === "direct") {
      if (!selected.parent) return;
      const page = selected.item;
      setTree((current) => [
        ...current.map((heading) => ({
          ...heading,
          items: heading.items.filter((item) => item.id !== page.id),
        })),
        page,
      ]);
      return;
    }
    if (selected.parent?.id === target) return;
    const page = selected.item;
    setTree((current) =>
      current
        .filter((heading) => heading.id !== page.id)
        .map((heading) => ({
          ...heading,
          items:
            heading.id === target
              ? [...heading.items, page]
              : heading.items.filter((item) => item.id !== page.id),
        })),
    );
  };
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setTree((current) => {
      const rootFrom = current.findIndex((item) => item.id === active.id);
      const rootTo = current.findIndex((item) => item.id === over.id);
      if (rootFrom >= 0 && rootTo >= 0)
        return reorder(current, rootFrom, rootTo);
      return current.map((heading) => {
        const from = heading.items.findIndex((item) => item.id === active.id);
        const to = heading.items.findIndex((item) => item.id === over.id);
        return from >= 0 && to >= 0
          ? { ...heading, items: reorder(heading.items, from, to) }
          : heading;
      });
    });
  };

  return (
    <div className="grid min-h-[calc(100dvh-8rem)] gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.72fr)]">
      <main className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <h1 className="text-lg font-semibold">Navigation configuration</h1>
            <p className="text-xs text-muted-foreground">
              Starts from the employee navigation default
              {designation ? ` for ${designation}` : ""}. Select a module, then
              optionally edit it or place it under a heading.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-lg"
              onClick={addHeading}
            >
              <FolderPlus className="size-4" /> Heading
            </Button>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={modulePickerOpen}
              className="h-9 w-[220px] justify-between rounded-lg"
              onClick={() => setModulePickerOpen(true)}
            >
              {selectedModuleTitle ?? "Select module"}
              <ChevronsUpDown className="opacity-50" />
            </Button>
            <Button
              className="h-9 rounded-lg"
              onClick={() => addModule()}
              disabled={!moduleToAdd}
            >
              <Plus className="size-4" /> Add module
            </Button>
          </div>
        </div>
        <CommandDialog
          open={modulePickerOpen}
          onOpenChange={setModulePickerOpen}
        >
          <Command>
            <CommandInput placeholder="Search modules..." className="h-9" />
            <CommandList>
              <CommandEmpty>No module found.</CommandEmpty>
              <CommandGroup heading="Modules">
                {sortedModules.map(([id, title, url]) => {
                  const added = selectedModules.has(id);
                  return (
                    <CommandItem
                      key={id}
                      value={`${title} ${url}`}
                      disabled={added}
                      onSelect={() => {
                        setModuleToAdd(id);
                        setModulePickerOpen(false);
                      }}
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span>{title}</span>
                        <span className="text-xs text-muted-foreground">
                          {url}
                        </span>
                      </div>
                      {added && <Check className="size-4 text-emerald-600" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-1 rounded-xl border bg-muted/20 p-2">
              <SortableContext
                items={tree.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {tree.map((item) => (
                  <TreeItem
                    key={item.id}
                    item={item}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
          <section className="rounded-xl border p-3">
            {selected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {isHeading(selected.item)
                      ? "Heading"
                      : selected.parent
                        ? "Sub item"
                        : "Direct page"}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={remove}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Field label="Name">
                  <Input
                    className="h-9 rounded-lg"
                    value={selected.item.title}
                    onChange={(event) => update({ title: event.target.value })}
                  />
                </Field>
                {!isHeading(selected.item) && (
                  <>
                    <Field label="Route">
                      <Input
                        className="h-9 rounded-lg"
                        value={selected.item.url ?? ""}
                        onChange={(event) =>
                          update({ url: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="Display location">
                      <Select
                        value={selected.parent?.id ?? "direct"}
                        onValueChange={reparent}
                      >
                        <SelectTrigger className="h-9 w-full rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">
                            Direct navigation
                          </SelectItem>
                          {tree.filter(isHeading).map((heading) => (
                            <SelectItem key={heading.id} value={heading.id}>
                              {heading.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <p className="text-xs text-muted-foreground">
                      Automatic shortcut:{" "}
                      <span className="font-medium text-foreground">
                        {short(selected.item.title)}
                      </span>
                    </p>
                  </>
                )}
                <Field label="Icon">
                  <Select
                    value={selected.item.icon}
                    onValueChange={(icon) => update({ icon })}
                  >
                    <SelectTrigger className="h-9 w-full rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {icons.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {isHeading(selected.item) && (
                  <Button
                    variant="outline"
                    className="h-9 rounded-lg"
                    onClick={() => addModule(selected.item)}
                  >
                    <Plus className="size-4" /> Add child module
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Select a heading or page.
              </div>
            )}
          </section>
        </div>
        <Button
          className="mt-4 h-9 w-full rounded-lg"
          onClick={() =>
            toast.success(
              "Prototype updated. Database saving will be added next.",
            )
          }
        >
          <Save className="size-4" /> Save configuration
        </Button>
      </main>
      <Preview tree={tree} />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}
function TreeItem({
  item,
  selectedId,
  onSelect,
}: {
  item: Item;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const heading = isHeading(item);
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className={cn(
          "flex h-9 w-full items-center rounded-lg text-sm",
          heading && "font-semibold",
          selectedId === item.id
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted",
        )}
      >
        <span
          {...listeners}
          className="flex h-full w-7 cursor-grab items-center justify-center touch-none text-muted-foreground active:cursor-grabbing"
          aria-label={`Reorder ${item.title}`}
          role="button"
          tabIndex={0}
        >
          <GripVertical className="size-3.5" />
        </span>
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="flex h-full min-w-0 flex-1 items-center gap-2 pr-2 text-left"
        >
          {heading ? (
            <ChevronRight className="size-3.5 shrink-0" />
          ) : (
            <span className="size-1.5 shrink-0 rounded-full bg-current" />
          )}
          <span className="truncate">{item.title}</span>
        </button>
      </div>
      {heading && (
        <div className="ml-5 space-y-1">
          <SortableContext
            items={item.items.map((page) => page.id)}
            strategy={verticalListSortingStrategy}
          >
            {item.items.map((page) => (
              <TreeItem
                key={page.id}
                item={page}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
function Preview({ tree }: { tree: Item[] }) {
  return (
    <aside className="overflow-hidden rounded-2xl border bg-slate-950 text-slate-100 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-3">
        <LayoutPanelTop className="size-4 text-cyan-300" />
        <div>
          <p className="text-sm font-semibold">Live sidebar preview</p>
          <p className="text-xs text-slate-400">
            Heading → child-item rendering, matching the app navigation.
          </p>
        </div>
      </div>
      <nav className="space-y-1 p-3">
        {tree.map((heading) => {
          const HeadingIcon =
            Icons[heading.icon as keyof typeof Icons] ?? Icons.logo;
          if (!isHeading(heading))
            return (
              <div
                key={heading.id}
                className="flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium"
              >
                <HeadingIcon className="size-4 text-cyan-300" />
                {heading.title}
              </div>
            );
          return (
            <div key={heading.id}>
              <div className="flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium">
                <HeadingIcon className="size-4 text-cyan-300" />
                {heading.title}
                <ChevronRight className="ml-auto size-4 text-slate-500" />
              </div>
              <div className="ml-4 border-l border-slate-700 py-1 pl-2">
                {heading.items.map((page) => {
                  const PageIcon =
                    Icons[page.icon as keyof typeof Icons] ?? Icons.logo;
                  return (
                    <div
                      key={page.id}
                      className="flex h-8 items-center gap-2 rounded-md px-2 text-xs text-slate-300"
                    >
                      <PageIcon className="size-3.5 text-slate-400" />
                      {page.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
