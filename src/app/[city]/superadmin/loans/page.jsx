"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import useUserDetail from "@/hooks/use-user-detail";
import { UserSearch } from "@/components/user-search";
import Heading from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { RequiredStar } from "@/components/RequiredStar";
import { useToast } from "@/hooks/use-toast";
import { Edit, Edit2 } from "lucide-react";
import AppCalendar from "@/components/appCalendar";
import Spinner from "@/components/ui/spinner";
import Dropzone from "@/components/dropzone";
import { UploadImage } from "@/lib/uploadFunction";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/config/firebase";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import moment from "moment";
import { Textarea } from "@/components/ui/textarea";

export default function EmployeeLoans() {
  const [loans, setLoans] = useState([]);
  const { userID } = useUserDetail();

  useEffect(() => {
    if (userID) fetchLoans();
  }, [userID]);

  const fetchLoans = async () => {
    const res = await axios.get(`/${userID}/loans`);
    setLoans(res.data);
  };

  const loansByUser = loans.reduce((acc, loan) => {
    if (!acc[loan.user_id])
      acc[loan.user_id] = { name: loan.user_name, loans: [] };
    acc[loan.user_id].loans.push(loan);
    return acc;
  }, {});

  console.log(loansByUser);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex justify-between flex-wrap items-end">
        <Heading title="Loans" description="Manage employee loans" />
        <LoanIssueModal userID={userID} onSuccess={fetchLoans} />
      </div>

      <LoanAccordion
        loansByUser={loansByUser}
        userID={userID}
        onUpdate={fetchLoans}
      />
    </div>
  );
}

export function LoanIssueModal({ userID, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loanAmount, setLoanAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createLoan = async () => {
    if (!selectedUser || !loanAmount)
      return toast({
        description: "Employee and amount required",
        variant: "destructive",
      });
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
            <Label>
              Select Employee <RequiredStar />
            </Label>
            <UserSearch value={selectedUser} onReturn={setSelectedUser} />
          </div>
          <div>
            <Label>
              Loan amount <RequiredStar />
            </Label>
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
            />
          </div>
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

export function LoanPaymentModal({ userID, loan, onSuccess }) {
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
                  <TableCell>
                    {new Date(p.payment_date).toLocaleString()}
                  </TableCell>
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

export function LoanAccordion({ loansByUser, userID, onUpdate }) {
  return (
    <>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {Object.entries(loansByUser).map(([userId, userData]) => (
          <AccordionItem key={userId} value={userId}>
            <AccordionTrigger>{userData.name}</AccordionTrigger>
            <AccordionContent>
              {userData.loans.map((loan) => (
                <div key={loan.id} className="border rounded-md p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <div>
                      <p>
                        <strong>Loan Amount:</strong> {loan.loan_amount}
                      </p>
                      <p>
                        <strong>Remaining:</strong> {loan.remaining_amount}
                      </p>
                      <p>
                        <strong>Status:</strong> {loan.status}
                      </p>
                      <p>
                        <strong>Description:</strong> {loan.description}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {loan.status === "active" && (
                        <LoanPaymentModal
                          userID={userID}
                          loan={loan}
                          onSuccess={onUpdate}
                        />
                      )}
                      <EditDescription loan={loan} onRefresh={onUpdate}/>
                    </div>
                  </div>

                
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
                               <TableHead>Slip</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loan.payments?.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell>{p.amount}</TableCell>
                                <TableCell>
                                  {moment(p.payment_date).format("YYYY-MM-DD")}
                                </TableCell>
                                <TableCell>
                                    <ImageView img={p?.slip}/>
                                </TableCell>
                                <TableCell>
                                  <EditPaymentLoan
                                    p={p}
                                    user_id={loan?.user_id}
                                    onRefresh={onUpdate}
                                  />
                                </TableCell>
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
    </>
  );
}

const EditPaymentLoan = ({ p, user_id, onRefresh }) => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  async function handleSave() {
    
    if (!selectedPayment?.id) return;
    setLoading(true)
    try {
      let name =
        selectedPayment?.slip ||
        `/users/${user_id}/loans/payment_slip/${selectedPayment?.id}.png`;
      if (selectedPayment?.slip !== p?.slip) {
        const imageRefResult = await UploadImage(
          selectedPayment?.slip,
          name,
          "image/png",
        );
      }

      console.log({
        id: selectedPayment?.id,
        payment_date: selectedPayment?.payment_date,
        slip: name,
      })

      await axios.put(`/${userID}/loans/repayment`, {
        id: selectedPayment?.id,
        payment_date: selectedPayment?.payment_date,
        slip: name,
      });

      await onRefresh()
      setSelectedPayment(null)
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <Edit
        size={16}
        className="hover:text-primary cursor-pointer"
        onClick={() => setSelectedPayment(p)}
      />
      <Dialog
        open={!!selectedPayment}
        onOpenChange={() => setSelectedPayment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Loan Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label>Payment Slip</Label>
              <Dropzone
              dbImage={p?.slip}
                value={selectedPayment?.slip}
                onDrop={(file) => {
                  setSelectedPayment((prev) => ({ ...prev, slip: file }));
                }}
                title={"Click to upload"}
                subheading={"or drag and drop"}
                description={"PNG or JPG"}
                drag={"Drop the files here..."}
              />
            </div>

            <div>
              <Label>Date</Label>
              <AppCalendar
                date={selectedPayment?.payment_date}
                onChange={(date) => {
                  setSelectedPayment((prev) => ({
                    ...prev,
                    payment_date: date,
                  }));
                }}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!selectedPayment?.payment_date || loading || !selectedPayment?.slip}
            >
              {loading && <Spinner />} Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};



const ImageView = ({
  img,
}) => {
  const [localImage, setLocalImage] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);
 
  useEffect(() => {
    if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        getDownloadURL(ref(storage, img)).then((url) => {
          setLocalImage(url);
        });
      }
    } else {
      setLocalImage(null);
    }
  }, [img]);


  const handleZoomChange = useCallback((shouldZoom) => {
    setIsZoomed(shouldZoom);
   
  }, []);

 

  const rotateImageRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateImageLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const onPressClose = () => {
    setIsZoomed(false);
   
  };

  return (
   localImage ? (
            <ControlledZoom
              isZoomed={isZoomed}
              onZoomChange={handleZoomChange}
              ZoomContent={({ img }) =>
                isZoomed ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      width: "100vw",
                      height: "100vh",
                      overflow: "hidden",
                      zIndex: 9999,
                      pointerEvents: "auto",
                    }}
                  >
                    <img
                      src={localImage}
                      alt="payment-img"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        maxWidth: "90vw",
                        maxHeight: "90vh",
                        objectFit: "contain",
                        pointerEvents: "auto",
                      }}
                    />
                    <div
                      className="mt-2 flex gap-5"
                      style={{
                        pointerEvents: "auto",
                        zIndex: 10000,
                      }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={rotateImageLeft}
                      >
                        Rotate Left
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={rotateImageRight}
                      >
                        Rotate Right
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onPressClose}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  img
                )
              }
            >
              <img
                src={localImage}
                alt="payment-img"
                style={{
                  maxWidth: "100px",
                  maxHeight: "100px",
                  objectFit: "contain",
                  cursor: "zoom-in",
                }}
              />
            </ControlledZoom>
          ) : (
            <Label>No Image found</Label>
          )
  );
};

const EditDescription = ({loan, onRefresh}) => {
const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  
  async function handleSave() {
    
    if (!selectedLoan?.id) return;
    setLoading(true)
    try {
      await axios.put(`/${userID}/loans`, {
        id: selectedLoan?.id,
        description: selectedLoan?.description,
      });

      await onRefresh()
      setSelectedLoan(null)
    } finally {
      setLoading(false);
    }
  }

    return (
        <>
        <Button variant="outline" onClick={()=>{
            setSelectedLoan(loan)
        }}>
            Edit Description
        </Button>

         <Dialog
        open={!!selectedLoan}
        onOpenChange={() => setSelectedLoan(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Loan Description</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label>Description</Label>
             <Textarea value={selectedLoan?.description ??""} onChange={(e)=>{
                setSelectedLoan((prev)=>({...prev, description : e.target.value}))
             }}>

             </Textarea>
            </div>

            
            <Button
              onClick={handleSave}
              disabled={!selectedLoan?.description || loading}
            >
              {loading && <Spinner />} Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </>
    )
}
