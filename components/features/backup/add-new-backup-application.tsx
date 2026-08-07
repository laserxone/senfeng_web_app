import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UploadImage } from "@/lib/uploadFunction";
import {
  Banknote,
  CalendarDays,
  ChevronRight,
  ImagePlus,
  Package,
  RotateCcw,
  Settings,
  Truck,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import AppCalendar from "@/components/features/calendar/app-calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomerSearch } from "@/components/features/customers/components/customer-search";
import Dropzone from "@/components/shared/uploads/dropzone";
import { CustomerMachines } from "@/components/features/machines/customer-machines";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import { BackupInventory } from "./backup-inventory";
import { BackupFormData, BackupFormErrors, Hierarchy } from "./backup-types";

const initialFormData: BackupFormData = {
  name: "",
  dateOfDelivery: undefined,
  amount: "",
  shipmentName: "",
  image: null,
  expectedReturnDate: undefined,
  hierarchyId: "",
  saleId: undefined,
  inventoryId: undefined,
};

export default function AddNewBackupApplication() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerID, setCustomerID] = useState<string | null | number>(null);
  const [formErrors, setFormErrors] = useState<BackupFormErrors>({});
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);
  const [formData, setFormData] = useState<BackupFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userID } = useUserDetail();

  useEffect(() => {
    if (!userID) return;

    loadInitialData();
  }, [userID]);

  async function loadInitialData() {
    fetchHierarchy();
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userID) return;

    const nextErrors: BackupFormErrors = {};

    if (!formData.hierarchyId) {
      nextErrors.hierarchyId = "Approval hierarchy is required.";
    } else if (!selectedHierarchy?.approvers?.length) {
      nextErrors.hierarchyId =
        "The selected backup hierarchy must have at least one approver.";
    }

    if (!customerID) {
      nextErrors.customerId = "Customer is required.";
    }

    if (!formData.saleId) {
      nextErrors.saleId = "Machine is required.";
    }

    if (!formData.inventoryId) {
      nextErrors.inventoryId = "Backup item is required.";
    }

    if (!formData.amount) {
      nextErrors.amount = "Security amount is required.";
    }

    if (!formData.dateOfDelivery) {
      nextErrors.dateOfDelivery = "Date of delivery is required.";
    }

    if (!formData.expectedReturnDate) {
      nextErrors.expectedReturnDate = "Expected return date is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      toast.error("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      let imagePath: string | null = null;

      if (formData.image) {
        const safeFileName = formData.image.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-",
        );

        imagePath =
          `backup-applications/${userID}/` + `${Date.now()}-${safeFileName}`;

        await UploadImage(
          URL.createObjectURL(formData.image),
          imagePath,
          formData.image.type || "application/octet-stream",
        );
      }

      await axios.post(`/${userID}/backup-applications`, {
        name: formData.name,
        date_of_delivery: formData.dateOfDelivery || null,

        amount: formData.amount ? parseFloat(formData.amount) : null,

        shipment_name: formData.shipmentName || null,

        image: imagePath,

        expected_return_date: formData.expectedReturnDate || null,

        user_id: userID,

        hierarchy_id: formData.hierarchyId
          ? parseInt(formData.hierarchyId)
          : null,
        sale_id: formData.saleId ?? null,
        backup_inventory_id: formData?.inventoryId ?? null,
      });

      const hierarchyId = formData.hierarchyId;

      setFormData({
        ...initialFormData,
        hierarchyId,
      });

      await Promise.all([fetchHierarchy()]);

      handleCreateOpenChange(false);

      toast.success("Backup application submitted successfully");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedHierarchy = hierarchies.find(
    (hierarchy) => hierarchy.id === parseInt(formData.hierarchyId),
  );
  const hasApprovers = Boolean(selectedHierarchy?.approvers?.length);

  function handleCreateOpenChange(open: boolean) {
    setIsCreateOpen(open);

    if (!open) {
      setFormErrors({});
      setFormData(initialFormData);
    }
  }

  const handleImageUpload = (e: File | null) => {
    const file = e || null;

    updateField("image", file);
  };

  async function fetchHierarchy() {
    const res = await axios.get(`/${userID}/hierarchies`);

    const backupHierarchies: Hierarchy[] =
      res.data?.filter((item: Hierarchy) => item.hierarchy_type === "backup") ||
      [];

    setHierarchies(backupHierarchies);

    if (backupHierarchies.length > 0) {
      updateField("hierarchyId", backupHierarchies[0].id.toString());
    }
  }

  const updateField = <K extends keyof BackupFormData>(
    field: K,
    value: BackupFormData[K],
  ) => {
    setFormErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <>
      <Button onClick={() => setIsCreateOpen(true)}>
        <Package className="size-4" />
        Add New Application
      </Button>

      <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="w-full overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="border-b bg-muted/20 px-5 py-5 text-left">
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-5 text-emerald-600" />
              New Backup Application
            </DialogTitle>

            <DialogDescription>
              Submit the backup item details for approval.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(100dvh-150px)]">
            <form onSubmit={handleSubmit} className="space-y-6 p-5">
              {/* APPROVAL WORKFLOW */}

              <FieldSet className="space-y-4 rounded-lg border p-4">
                <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                  <Settings className="size-4 text-emerald-600" />
                  Approval Workflow
                </FieldLegend>

                <Field data-invalid={Boolean(formErrors.hierarchyId)}>
                  <FieldLabel className="text-sm">
                    Approval Hierarchy <RequiredStar />
                  </FieldLabel>

                  <Input
                    disabled
                    value={
                      selectedHierarchy?.name || "No backup hierarchy found"
                    }
                  />
                  <FieldError
                    errors={[
                      {
                        message: formErrors.hierarchyId,
                      },
                    ]}
                  />
                </Field>

                {selectedHierarchy?.approvers &&
                  selectedHierarchy.approvers.length > 0 && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        This application will go through:
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {selectedHierarchy.approvers.map((approver, index) => (
                          <div key={approver.id} className="flex items-center">
                            <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1">
                              <div className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                                {index + 1}
                              </div>

                              <span className="text-sm">
                                {approver.user_name}
                              </span>
                            </div>

                            {index <
                              selectedHierarchy.approvers!.length - 1 && (
                              <ChevronRight className="mx-1 size-4 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                {selectedHierarchy && !hasApprovers && (
                  <p className="text-xs text-destructive">
                    This backup hierarchy has no approvers. Add an approver
                    before submitting an application.
                  </p>
                )}
              </FieldSet>

              {/* BACKUP DETAILS */}

              <FieldSet className="space-y-4 rounded-lg border p-4">
                <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                  <Package className="size-4 text-emerald-600" />
                  Backup Details
                </FieldLegend>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field data-invalid={Boolean(formErrors.customerId)}>
                    <FieldLabel>
                      Select Customer <RequiredStar />
                    </FieldLabel>

                    <CustomerSearch
                      value={customerID}
                      onReturn={(val) => {
                        setCustomerID(val);
                        setFormErrors((prev) => ({
                          ...prev,
                          customerId: undefined,
                          saleId: undefined,
                          inventoryId: undefined,
                        }));
                        updateField("saleId", undefined);
                        updateField("inventoryId", undefined);
                      }}
                    />
                    <FieldError
                      errors={[
                        {
                          message: formErrors.customerId,
                        },
                      ]}
                    />
                  </Field>

                  {customerID && (
                    <Field data-invalid={Boolean(formErrors.saleId)}>
                      <FieldLabel>
                        Machine <RequiredStar />
                      </FieldLabel>

                      <CustomerMachines
                        value={formData.saleId ?? null}
                        customer_id={customerID}
                        onReturn={(e) => {
                          updateField("saleId", e);
                          updateField("inventoryId", undefined);
                        }}
                      />
                      <FieldError
                        errors={[
                          {
                            message: formErrors.saleId,
                          },
                        ]}
                      />
                    </Field>
                  )}

                  {formData.saleId && (
                    <Field data-invalid={Boolean(formErrors.inventoryId)}>
                      <FieldLabel>
                        Backup Item <RequiredStar />
                      </FieldLabel>

                      <BackupInventory
                        value={formData.inventoryId ?? null}
                        onReturn={(e) => updateField("inventoryId", e)}
                      />
                      <FieldError
                        errors={[
                          {
                            message: formErrors.inventoryId,
                          },
                        ]}
                      />
                    </Field>
                  )}

                  <Field data-invalid={Boolean(formErrors.amount)}>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Banknote className="size-3.5 text-emerald-600" />
                      Security <RequiredStar />
                    </FieldLabel>

                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Enter security amount"
                      value={formData.amount}
                      onChange={(e) => updateField("amount", e.target.value)}
                    />
                    <FieldError
                      errors={[
                        {
                          message: formErrors.amount,
                        },
                      ]}
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <Truck className="size-3.5 text-emerald-600" />
                      Shipment Name
                    </FieldLabel>

                    <Input
                      placeholder="Enter shipment or courier name"
                      value={formData.shipmentName}
                      onChange={(e) =>
                        updateField("shipmentName", e.target.value)
                      }
                    />
                  </Field>

                  <Field data-invalid={Boolean(formErrors.dateOfDelivery)}>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <CalendarDays className="size-3.5 text-emerald-600" />
                      Date of Delivery <RequiredStar />
                    </FieldLabel>

                    <AppCalendar
                      min={new Date()}
                      max={""}
                      date={formData.dateOfDelivery}
                      onChange={(date) => updateField("dateOfDelivery", date)}
                    />
                    <FieldError
                      errors={[
                        {
                          message: formErrors.dateOfDelivery,
                        },
                      ]}
                    />
                  </Field>

                  <Field data-invalid={Boolean(formErrors.expectedReturnDate)}>
                    <FieldLabel className="flex items-center gap-2 text-sm">
                      <RotateCcw className="size-3.5 text-emerald-600" />
                      Expected Return Date <RequiredStar />
                    </FieldLabel>

                    <AppCalendar
                      min={formData.dateOfDelivery || new Date()}
                      max={""}
                      date={formData.expectedReturnDate}
                      onChange={(date) =>
                        updateField("expectedReturnDate", date)
                      }
                    />
                    <FieldError
                      errors={[
                        {
                          message: formErrors.expectedReturnDate,
                        },
                      ]}
                    />
                  </Field>
                </div>
              </FieldSet>

              {/* IMAGE */}

              <FieldSet className="space-y-4 rounded-lg border p-4">
                <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                  <ImagePlus className="size-4 text-emerald-600" />
                  Backup Image
                </FieldLegend>

                <Field>
                  <FieldLabel className="text-sm">Upload Image</FieldLabel>

                  <Dropzone
                    value={formData.image}
                    onDropFile={(f) => handleImageUpload(f as File)}
                  />
                </Field>
              </FieldSet>

              <Button
                type="submit"
                disabled={isSubmitting || !hasApprovers}
                className="h-12 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-lg shadow-lg hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600"
              >
                {isSubmitting
                  ? "Submitting Application..."
                  : "Submit Backup Application"}
              </Button>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
