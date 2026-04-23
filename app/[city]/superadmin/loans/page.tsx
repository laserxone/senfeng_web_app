"use client";

import { RequiredStar } from "@/components/RequiredStar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserSearch } from "@/components/user-search";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { Loan } from "@/lib/types";
import { useEffect, useState } from "react";
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


    const loansByUser = loans.reduce<LoansByUser>((acc, loan) => {
        if (!acc[loan.user_id]) acc[loan.user_id] = { name: loan.user_name, loans: [] };
        acc[loan.user_id].loans.push(loan);
        return acc;
    }, {});

    return (
        <div className="flex flex-1 flex-col space-y-4">
            <div className="flex justify-between flex-wrap items-end">
                <Heading title="Loans" description="Manage employee loans" />
                <LoanIssueModal userID={userID} onSuccess={fetchLoans} />
            </div>


            <LoanAccordion loansByUser={loansByUser} userID={userID} onUpdate={fetchLoans} />
        </div>
    );
}



export function LoanIssueModal({ userID, onSuccess }: { userID: number, onSuccess: () => Promise<void> }) {
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loanAmount, setLoanAmount] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);


    const createLoan = async () => {
        if (!selectedUser || !loanAmount) return
        toast.error("Employee and amount required");
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
            onSuccess();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Issue New Loan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Issue Loan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div>
                        <Label>Select Employee <RequiredStar /></Label>
                        <UserSearch value={selectedUser} onReturn={setSelectedUser} />
                    </div>
                    <div>
                        <Label>Loan amount <RequiredStar /></Label>
                        <Input
                            type="number"
                            placeholder="Loan Amount"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Note</Label>
                        <Input
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        /></div>
                </div>
                <DialogFooter>
                    <Button onClick={createLoan} disabled={loading}>
                        {loading ? "Saving..." : "Submit"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function LoanPaymentModal({ userID, loan, onSuccess }: { userID: number, loan: Loan, onSuccess: () => Promise<void> }) {
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
            onSuccess();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">Add Payment</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Loan Repayment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <Input
                        type="number"
                        placeholder="Repayment Amount"
                        value={repaymentAmount}
                        onChange={(e) => setRepaymentAmount(e.target.value)}
                    />

                    <h3 className="font-semibold">Payment History</h3>
                    <Table className="border">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loan.payments?.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.amount}</TableCell>
                                    <TableCell>{new Date(p.payment_date).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button onClick={makePayment} disabled={loading}>
                        {loading ? "Saving..." : "Submit Payment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function LoanAccordion({ loansByUser, userID, onUpdate }: { loansByUser: LoansByUser, userID: number, onUpdate: () => Promise<void> }) {
    return (
        <Accordion type="single" collapsible className="w-full space-y-2">
            {Object.entries(loansByUser).map(([userId, userData]) => (
                <AccordionItem key={userId} value={userId}>
                    <AccordionTrigger>{userData.name}</AccordionTrigger>
                    <AccordionContent>
                        {userData.loans.map((loan) => (
                            <div key={loan.id} className="border rounded-md p-4 mb-4">
                                <div className="flex justify-between mb-2">
                                    <div>
                                        <p><strong>Loan Amount:</strong> {loan.loan_amount}</p>
                                        <p><strong>Remaining:</strong> {loan.remaining_amount}</p>
                                        <p><strong>Status:</strong> {loan.status}</p>
                                        <p><strong>Description:</strong> {loan.description}</p>
                                    </div>
                                    <div>
                                        {loan.status === "active" && (
                                            <LoanPaymentModal userID={userID} loan={loan} onSuccess={onUpdate} />
                                        )}
                                    </div>
                                </div>

                                {/* Nested Payments Accordion */}
                                <Accordion type="single" collapsible className="mt-4">
                                    <AccordionItem value={`payments-${loan.id}`}>
                                        <AccordionTrigger>
                                            Payment History ({loan.payments?.length || 0})
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <Table className="border">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Amount</TableHead>
                                                        <TableHead>Date</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loan.payments?.map((p) => (
                                                        <TableRow key={p.id}>
                                                            <TableCell>{p.amount}</TableCell>
                                                            <TableCell>{new Date(p.payment_date).toLocaleString()}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}