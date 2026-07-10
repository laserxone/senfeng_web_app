"use client";

import { RequiredStar } from "@/components/RequiredStar";
import AppCalendar from "@/components/app-calendar";
import Dropzone from "@/components/dropzone";
import { MyImgZooming } from "@/components/img-zooming";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
} from "@/components/ui/field";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { UserSearch } from "@/components/user-search";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { Loan, LoanPayment } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import {
  ChevronRight,
  CreditCard,
  Edit,
  FileText,
  Pencil,
  Plus,
  Wallet
} from "lucide-react";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type LoansByUser = {
  [userId: number]: {
    name: string;
    loans: Loan[];
  };
};

export default function EmployeeLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const { userID } = useUserDetail();

  useEffect(() => {
    if (userID) fetchLoans();
  }, [userID]);

  const fetchLoans = async () => {
    const res = await axios.get(`/${userID}/loans`);
    setLoans(res.data);
  };

  const loansByUser = useMemo(() => {
    return loans.reduce<LoansByUser>((acc, loan) => {
      if (!acc[loan.user_id]) {
        acc[loan.user_id] = {
          name: loan.user_name,
          loans: [],
        };
      }

      acc[loan.user_id].loans.push(loan);
      return acc;
    }, {});
  }, [loans]);

  const totalLoans = loans.length;
  const activeLoans = loans.filter((loan) => loan.status === "active").length;
  const totalRemaining = loans.reduce(
    (sum, loan) => sum + Number(loan.remaining_amount || 0),
    0
  );

  return (
    <div className="flex flex-1 flex-col space-y-4 pb-6">
      <div className="flex items-center justify-between space-y-2 flex-wrap">
        <Heading title="Loans" description="Manage employee loans and repayments" />

        <LoanIssueModal userID={userID} onSuccess={fetchLoans} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Loans"
          value={totalLoans}
          icon={<FileText className="h-5 w-5" />}
        />
        <SummaryCard
          title="Active Loans"
          value={activeLoans}
          icon={<Wallet className="h-5 w-5" />}
        />
        <SummaryCard
          title="Remaining Amount"
          value={totalRemaining.toLocaleString()}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      <LoanCollapsibleList
        loansByUser={loansByUser}
        userID={userID}
        onUpdate={fetchLoans}
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>

        <div className="rounded-full bg-muted p-3 text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function LoanIssueModal({
  userID,
  onSuccess,
}: {
  userID: number | string;
  onSuccess: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [loanAmount, setLoanAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const createLoan = async () => {
    if (!selectedUser || !loanAmount) {
      toast.error("Employee and amount required");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`/${userID}/loans`, {
        user_id: selectedUser,
        loan_amount: Number(loanAmount),
        description,
      });

      setLoanAmount("");
      setDescription("");
      setSelectedUser(null);
      setOpen(false);

      await onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Issue New Loan
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue New Loan</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <FieldLegend>Loan Details</FieldLegend>

          <Field>
            <FieldLabel>
              Select Employee <RequiredStar />
            </FieldLabel>
            <UserSearch value={selectedUser} onReturn={setSelectedUser} />
          </Field>

          <Field>
            <FieldLabel>
              Loan Amount <RequiredStar />
            </FieldLabel>
            <Input
              type="number"
              placeholder="Enter loan amount"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>Note</FieldLabel>
            <Input
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button onClick={createLoan} disabled={loading}>
            {loading && <Spinner />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LoanPaymentModal({
  userID,
  loan,
  onSuccess,
}: {
  userID: number | string;
  loan: Loan;
  onSuccess: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const makePayment = async () => {
    if (!repaymentAmount) return;

    setLoading(true);

    try {
      await axios.post(`/${userID}/loans/repayment`, {
        loan_id: loan.id,
        amount: Number(repaymentAmount),
      });

      setRepaymentAmount("");
      setOpen(false);

      await onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Loan Repayment</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <FieldLegend>Payment Details</FieldLegend>

          <Field>
            <FieldLabel>
              Repayment Amount <RequiredStar />
            </FieldLabel>
            <Input
              type="number"
              placeholder="Enter repayment amount"
              value={repaymentAmount}
              onChange={(e) => setRepaymentAmount(e.target.value)}
            />
          </Field>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loan.payments?.length ? (
                  loan.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.amount}</TableCell>
                      <TableCell>
                        {new Date(p.payment_date).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground"
                    >
                      No payment history found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </FieldGroup>

        <DialogFooter>
          <Button onClick={makePayment} disabled={loading}>
            {loading && <Spinner />}
            Submit Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LoanCollapsibleList({
  loansByUser,
  userID,
  onUpdate,
}: {
  loansByUser: LoansByUser;
  userID: number | string;
  onUpdate: () => Promise<void>;
}) {
  const entries = Object.entries(loansByUser);

  if (!entries.length) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="font-medium">No loans found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Issued loans will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map(([userId, userData]) => {
        const userTotal = userData.loans.reduce(
          (sum, loan) => sum + Number(loan.loan_amount || 0),
          0
        );

        const userRemaining = userData.loans.reduce(
          (sum, loan) => sum + Number(loan.remaining_amount || 0),
          0
        );

        return (
          <Collapsible
            key={`user-${userId}`}
            className="group rounded-xl border bg-card shadow-sm"
          >
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left transition hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />

                  <div>
                    <p className="font-semibold">{userData.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {userData.loans.length} loan(s)
                    </p>
                  </div>
                </div>

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium">
                    Remaining: {userRemaining.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: {userTotal.toLocaleString()}
                  </p>
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="space-y-4 border-t p-5">
                {userData.loans.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    userID={userID}
                    onUpdate={onUpdate}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

function LoanCard({
  loan,
  userID,
  onUpdate,
}: {
  loan: Loan;
  userID: number | string;
  onUpdate: () => Promise<void>;
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoBox label="Loan Amount" value={loan.loan_amount} />
          <InfoBox label="Remaining" value={loan.remaining_amount} />
          <InfoBox label="Status" value={loan.status} />
          <InfoBox label="Description" value={loan.description || "N/A"} />
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {loan.status === "active" && (
            <LoanPaymentModal userID={userID} loan={loan} onSuccess={onUpdate} />
          )}

          <EditDescription loan={loan} onRefresh={onUpdate} />
        </div>
      </div>

      <PaymentHistory loan={loan} onUpdate={onUpdate} />
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium">{value}</p>
    </div>
  );
}

function PaymentHistory({
  loan,
  onUpdate,
}: {
  loan: Loan;
  onUpdate: () => Promise<void>;
}) {
  return (
    <Collapsible className="group mt-4 rounded-lg border">
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50">
          <div>
            <p className="font-medium">Payment History</p>
            <p className="text-sm text-muted-foreground">
              {loan.payments?.length || 0} payment(s)
            </p>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Slip</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loan.payments?.length ? (
                loan.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.amount}</TableCell>
                    <TableCell>
                      {moment(p.payment_date).format("YYYY-MM-DD")}
                    </TableCell>
                    <TableCell>
                      <MyImgZooming img={p?.slip} />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditPaymentLoan
                        p={p}
                        user_id={loan?.user_id}
                        onRefresh={onUpdate}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No payments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const EditPaymentLoan = ({
  p,
  user_id,
  onRefresh,
}: {
  p: LoanPayment;
  user_id: number;
  onRefresh: () => Promise<void>;
}) => {
  const [selectedPayment, setSelectedPayment] = useState<LoanPayment | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();

  async function handleSave() {
    if (!selectedPayment?.id) return;

    setLoading(true);

    try {
      const name = !p?.slip
        ? `/users/${user_id}/loans/payment_slip/${selectedPayment?.id}.png`
        : p.slip;

      if (selectedPayment?.slip !== p?.slip) {
        await UploadImage(selectedPayment?.slip, name, "image/png");
      }

      await axios.put(`/${userID}/loans/repayment`, {
        id: selectedPayment?.id,
        payment_date: selectedPayment?.payment_date,
        slip: name,
      });

      await onRefresh();
      setSelectedPayment(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSelectedPayment(p)}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog
        open={!!selectedPayment}
        onOpenChange={() => setSelectedPayment(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Loan Payment</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <FieldLegend>Payment Information</FieldLegend>

            <Field>
              <FieldLabel>Payment Slip</FieldLabel>
              <Dropzone
                value={selectedPayment?.slip}
                onDrop={(file) => {
                  setSelectedPayment((prev) => {
                    if (!prev) return prev;
                    return { ...prev, slip: file ?? "" };
                  });
                }}
               
              />
            </Field>

            <Field>
              <FieldLabel>Date</FieldLabel>
              <AppCalendar
                date={selectedPayment?.payment_date}
                onChange={(date) => {
                  setSelectedPayment((prev) => {
                    if (!prev) return prev;
                    return { ...prev, payment_date: date };
                  });
                }}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              onClick={handleSave}
              disabled={
                !selectedPayment?.payment_date ||
                loading ||
                !selectedPayment?.slip
              }
            >
              {loading && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const EditDescription = ({
  loan,
  onRefresh,
}: {
  loan: Loan;
  onRefresh: () => Promise<void>;
}) => {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();

  async function handleSave() {
    if (!selectedLoan?.id) return;

    setLoading(true);

    try {
      await axios.put(`/${userID}/loans`, {
        id: selectedLoan?.id,
        description: selectedLoan?.description,
      });

      await onRefresh();
      setSelectedLoan(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setSelectedLoan(loan)}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit Description
      </Button>

      <Dialog
        open={!!selectedLoan}
        onOpenChange={() => setSelectedLoan(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Loan Description</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <FieldLegend>Description</FieldLegend>

            <Field>
              <FieldLabel>Loan Description</FieldLabel>
              <Textarea
                value={selectedLoan?.description ?? ""}
                placeholder="Enter loan description"
                onChange={(e) => {
                  setSelectedLoan((prev) => {
                    if (!prev) return prev;
                    return { ...prev, description: e.target.value };
                  });
                }}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              onClick={handleSave}
              disabled={!selectedLoan?.description || loading}
            >
              {loading && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};