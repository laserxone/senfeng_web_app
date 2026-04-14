"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PageTable from "@/components/app-table-without-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import  Heading  from "@/components/ui/heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/user-search";
import { storage } from "@/config/firebase";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { format, setMonth } from "date-fns";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import AccountsPdf from "@/components/accountsPdf";
import CommissionRecord from "@/components/commission-salary";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useUserDetail from "@/hooks/use-user-detail";
import { pdf } from "@react-pdf/renderer";
import { ScrollArea } from "../ui/scroll-area";

const SalaryComponent = ({ onSelectedId }) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [startDate, setStartDate] = useState(
    moment().startOf("month").toISOString(),
  );
  const { userID } = useUserDetail();
  const [endDate, setEndDate] = useState(moment().endOf("month").toISOString());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [checked, setChecked] = useState(false);
  const [form, setForm] = useState({
    target_achieved: 0,
    absents: 0,
    late: 0,
    late_fine_per_day: 0,
    reimbursement: 0,
    commission: 0,
    miscellaneous: 0,
    additional_fine: 0,
    old_target_achieved: 0,
  });
  const [cancelled, setCancelled] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);
  const [kpi, setKpi] = useState(0);
  const [lateComingFine, setLateComingFine] = useState(0);
  const [absentsFine, setAbsentsFine] = useState(0);
  const [payable, setPayable] = useState(0);
  const [attendanceData, setAttendanceData] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [excludeAbsent, setExcludeAbsent] = useState(false);
  const [excludeLate, setExcludeLate] = useState(false);
  const [excludeAbsentFine, setExcludeAbsentFine] = useState(false);
  const [excludeLateFine, setExcludeLateFine] = useState(false);
  const [modal, setModal] = useState(false);
  const [ttRate, setTTRate] = useState(1);
  const { toast } = useToast();
  const [toAccounts, setToAccounts] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [remainingLoan, setRemainingLoan] = useState(0);
  const [repayment, setRepayment] = useState(0);
  const years = Array.from(
    { length: 20 },
    (_, i) => new Date().getFullYear() - 10 + i,
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    format(setMonth(new Date(), i), "MMMM"),
  );

  useEffect(() => {
    if (userID) {
      axios.get(`/${userID}/settings`).then((response) => {
        setTTRate(response.data.usd_rate || "");
      });
    }
  }, [userID]);

  const updateDate = (month, year) => {
    const start = moment()
      .year(year)
      .month(month)
      .startOf("month")
      .toISOString();
    const end = moment().year(year).month(month).endOf("month").toISOString();

    setStartDate(start);
    setEndDate(end);
  };

  async function clearForm() {
    setData({});
    setForm({
      target_achieved: 0,
      absents: 0,
      late: 0,
      late_fine_per_day: 0,
      reimbursement: 0,
      commission: 0,
      miscellaneous: 0,
      additional_fine: 0,
    });
    setPayable(0);
    setLateComingFine(0);
    setAbsentsFine(0);
    setKpi(0);
  }

  async function handleGenerate() {
    setLoading(true);
    const response = await axios.get(`/${userID}/settings`);
    setForm({ ...form, late_fine_per_day: response.data.late_fine * -1 });
    axios
      .get(
        `/${userID}/salary?user=${user}&start=${startDate}&end=${endDate}&month=${selectedMonth}&year=${selectedYear}`,
      )
      .then((response) => {
        setData(response.data);
        if (refresh) {
          setChecked(false);
          processAttendance(
            Number(moment(startDate).format("YYYY")),
            Number(moment(startDate).format("MM")),
            response.data.attendance,
            true,
          );

          if (response.data?.loan) {
            const totalAmount = response.data.loan.reduce(
              (sum, item) => sum + Number(item.loan_amount),
              0,
            );
            setRemainingLoan(totalAmount);
          }

          if (response.data?.reimbursement) {
            const totalAmount = response.data.reimbursement.reduce(
              (sum, item) => sum + Number(item.amount),
              0,
            );
            setForm((prevState) => ({
              ...prevState,
              reimbursement: totalAmount,
            }));
          }
          if (response.data?.fines) {
            const totalAmount = response.data.fines.reduce(
              (sum, item) => sum + Number(item.amount),
              0,
            );
            setForm((prevState) => ({
              ...prevState,
              additional_fine: totalAmount * -1,
            }));
          }

          if (response.data?.commission?.length) {
            const totalCommission = response.data.commission.reduce(
              (sum, item) => sum + Number(item.commission_amount),
              0,
            );
            setForm((prevState) => ({
              ...prevState,
              commission: totalCommission,
            }));
          }
          // else if (response.data?.lead_commission?.length) {
          //   const totalCommission = response.data.lead_commission.reduce(
          //     (sum, item) => sum + Number(item.lead_commission_amount),
          //     0
          //   );
          //   setForm((prevState) => ({
          //     ...prevState,
          //     commission: totalCommission,
          //   }));
          // }
          if (excludeAbsent) {
            setForm((prev) => ({ ...prev, absents: 0 }));
          }
          if (excludeLate) {
            setForm((prev) => ({ ...prev, late: 0 }));
          }
          if (excludeAbsentFine) {
            setAbsentsFine(0);
          }
          if (excludeLateFine) {
            setLateComingFine(0);
          }
          if (Number(ttRate) > 0 && Array.isArray(response.data?.machines)) {
            const total = response.data?.machines.reduce(
              (sum, item) => sum + Number(item.price || 0),
              0,
            );
            const finalTotal = total / Number(ttRate);
            setForm((prev) => ({
              ...prev,
              target_achieved: finalTotal.toFixed(0),
              old_target_achieved: finalTotal.toFixed(0),
            }));
          }
        } else {
          if (response.data?.salary) {
            const existing = response.data.salary;
            setForm({
              absents: Number(existing.absents),
              additional_fine: Number(existing.additional_fine),
              commission: Number(existing.commission),
              late: Number(existing.late),
              late_fine_per_day: Number(existing.late_fine_per_day),
              miscellaneous: Number(existing.miscellaneous),
              reimbursement: Number(existing.reimbursement),
              target_achieved: Number(existing.target_achieved),
            });
            setRemainingLoan(existing?.loan);
            setChecked(existing.issued);
            processAttendance(
              Number(moment(startDate).format("YYYY")),
              Number(moment(startDate).format("MM")),
              response.data.attendance,
              false,
            );
          } else {
            setChecked(false);
            processAttendance(
              Number(moment(startDate).format("YYYY")),
              Number(moment(startDate).format("MM")),
              response.data.attendance,
              true,
            );
            if (response.data?.loan) {
              const totalAmount = response.data.loan.reduce(
                (sum, item) => sum + Number(item.loan_amount),
                0,
              );
              setRemainingLoan(totalAmount);
            }
            if (response.data?.reimbursement) {
              const totalAmount = response.data.reimbursement.reduce(
                (sum, item) => sum + Number(item.amount),
                0,
              );
              setForm((prevState) => ({
                ...prevState,
                reimbursement: totalAmount,
              }));
            }
            if (response.data?.fines) {
              const totalAmount = response.data.fines.reduce(
                (sum, item) => sum + Number(item.amount),
                0,
              );
              setForm((prevState) => ({
                ...prevState,
                additional_fine: totalAmount * -1,
              }));
            }
            if (response.data?.commission) {
              const totalCommission = response.data?.commission.reduce(
                (sum, item) => sum + Number(item.commission_amount),
                0,
              );
              setForm((prevState) => ({
                ...prevState,
                commission: totalCommission,
              }));
            }
            if (excludeAbsent) {
              setForm((prev) => ({ ...prev, absents: 0 }));
            }
            if (excludeLate) {
              setForm((prev) => ({ ...prev, late: 0 }));
            }
            if (excludeAbsentFine) {
              setAbsentsFine(0);
            }
            if (excludeLateFine) {
              setLateComingFine(0);
            }
            if (Number(ttRate) > 0 && Array.isArray(response.data?.machines)) {
              const total = response.data?.machines.reduce(
                (sum, item) => sum + Number(item.price || 0),
                0,
              );
              const finalTotal = total / Number(ttRate);
              setForm((prev) => ({
                ...prev,
                target_achieved: finalTotal.toFixed(0),
                old_target_achieved: finalTotal.toFixed(0),
              }));
            }
          }
        }
      })
      .finally(() => {
        setLoading(false);
        setRefresh(false);
      });
  }

  useEffect(() => {
    if (data && data?.user) {
      if (data?.user?.designation === "Sales") {
        const totalSalary = Number(data?.user?.total_salary) || 0;
        const basicSalary = Number(data?.user?.basic_salary) || 0;
        const performanceSalary = totalSalary - basicSalary;

        const targetAchieved = Number(form.target_achieved) || 0; // mistake here for target_achieved but double check code again
        const monthlyTarget = Number(data?.user?.monthly_target) || 1;

        const feedbacksTaken = Number(data?.feedbacksTakenThisMonth) || 0;
        const maxFeedbacks = Number(data?.totalCustomersWithSale) || 1;

        const visitsTaken = Number(data?.totalVisits) || 0;
        const maxVisits = 15;

        const targetPercentage = targetAchieved / monthlyTarget;
        const feedbackPercentage = Math.min(feedbacksTaken / maxFeedbacks, 1);
        const visitPercentage = Math.min(visitsTaken / maxVisits, 1);

        const weightedTarget = targetPercentage * 0.6;
        const weightedFeedback = feedbackPercentage * 0.2;
        const weightedVisit = visitPercentage * 0.2;

        const kpiAmount =
          performanceSalary *
          (weightedTarget + weightedFeedback + weightedVisit);

        setKpi(kpiAmount);
      } else {
        setKpi(
          ((Number(form.target_achieved) || 0) /
            (Number(data?.user?.monthly_target) || 1)) *
            ((Number(data?.user?.total_salary) || 0) -
              (Number(data?.user?.basic_salary) || 0)),
        );
      }

      if (!excludeLateFine) {
        setLateComingFine(
          data?.user ? (form.late_fine_per_day || 0) * (form.late || 0) : 0,
        );
      }

      if (!excludeAbsentFine) {
        setAbsentsFine(
          data?.user
            ? Number(
                (
                  (data.user.total_salary / 30) *
                  (form.absents || 0) *
                  -1
                ).toFixed(0),
              )
            : 0,
        );
      }
    }
  }, [data, form]);

  useEffect(() => {
    if (data?.user) {
      setPayable(
        (
          Number(data?.user?.basic_salary || 0) +
          Number(kpi || 0) +
          Number(lateComingFine || 0) +
          Number(absentsFine || 0) +
          Number(form.reimbursement || 0) +
          Number(form.commission || 0) +
          Number(form.miscellaneous || 0) +
          Number(form.additional_fine || 0) +
          Number(repayment || 0)
        ).toFixed(2),
      );
    }
  }, [data, form, kpi, lateComingFine, absentsFine, repayment]);

  useEffect(() => {
    if (cancelled && form.target_achieved) {
      const oldTarget = form.target_achieved * Number(ttRate);
      const newAmount = Number(oldTarget) - Number(cancelled);
      const finalNewTarget = newAmount / Number(ttRate);
      setForm((prevState) => ({
        ...prevState,
        target_achieved: finalNewTarget.toFixed(0),
      }));
    } else {
      setForm((prevState) => ({
        ...prevState,
        target_achieved: prevState.old_target_achieved,
      }));
    }
  }, [cancelled]);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value ? (value == "-" ? value : Number(value)) : "",
      // [field]: value,
    }));
  };

  const processAttendance = (year, month, records, condition) => {
    let monthData = [];
    let totalWorkingDays = 0;
    let sundays = [];

    // Generate all days in the selected month
    let startDate = moment(`${year}-${month}-01`);
    let endDate = moment(startDate).endOf("month");

    for (
      let date = startDate.clone();
      date.isSameOrBefore(endDate);
      date.add(1, "day")
    ) {
      let isSunday = date.isoWeekday() === 7;

      if (!isSunday)
        totalWorkingDays++; // Count only non-Sunday days
      else sundays.push(date.format("YYYY-MM-DD")); // Track Sundays

      monthData.push({
        date: date.format("YYYY-MM-DD"),
        day: date.format("dddd"),
        status: "Absent",
        time_in: null,
        time_out: null,
      });
    }

    let finalData = monthData.map((day) => {
      let record = records.find(
        (r) =>
          moment(new Date(r.time_in)).format("YYYY-MM-DD") ===
          moment(day.date).format("YYYY-MM-DD"),
      );

      if (record) {
        const checkIn = moment(new Date(record.time_in));
        const checkOut = record?.time_out
          ? moment(new Date(record.time_out))
          : null;

        let isLate = checkIn.isAfter(
          moment(day.date + " 10:10", "YYYY-MM-DD HH:mm"),
        );

        return {
          ...day,
          time_in: checkIn.format("hh:mm A"),
          time_out: checkOut ? checkOut.format("h:mm A") : null,
          status: isLate ? "Late" : "Present",
        };
      }

      return day;
    });

    if (condition) {
      finalData = finalData.map((day, index, arr) => {
        if (day.day === "Sunday") {
          const prevDay = arr[index - 1]; // Saturday
          const nextDay = arr[index + 1]; // Monday

          if (
            prevDay &&
            nextDay &&
            prevDay.status === "Absent" &&
            nextDay.status === "Absent"
          ) {
            return {
              ...day,
              status: "Absent",
              sandwich: true,
            };
          }
        }
        return day;
      });

      const totalPresent = finalData.filter(
        (item) => item.status === "Present" || item.status === "Late",
      );
      const lateCount = finalData.filter(
        (item) => item.status === "Late",
      ).length;

      setForm((prevState) => ({
        ...prevState,
        absents: totalWorkingDays - totalPresent.length,
        late: lateCount,
      }));
    }

    setAttendanceData([...finalData]);
  };

  async function handleSave() {
    setSaveLoading(true);

    try {
      await axios.post(`/${userID}/salary`, {
        user_id: user,
        year: selectedYear,
        month: selectedMonth,
        target_achieved: form.target_achieved,
        absents: form.absents,
        late: form.late,
        late_fine_per_day: form.late_fine_per_day,
        reimbursement: form.reimbursement,
        commission: form.commission,
        miscellaneous: form.miscellaneous,
        additional_fine: form.additional_fine,
        issued: checked,
        salary_month: startDate,
        payable: payable,
        kpi: kpi,
        fuel: data?.user?.fuel || 0,
        loan: repayment,
        basic_salary : data?.user?.basic_salary || 0
      });

      toast({ title: "Salary saved! Updating other entries in background" });

      if (checked) {
        if (repayment && !isNaN(repayment) && employeeLoan) {
          const response = await axios.post(`/${userID}/loans/repayment`, {
            loan_id: employeeLoan.id,
            amount: Number(repayment),
          });
          await axios.post(`/${userID}/salary`, {
            user_id: user,
            year: selectedYear,
            month: selectedMonth,
            loan_repayment: response.data?.id || null,
          });
        }
        if (data?.commission) {
          await Promise.all(
            data.commission.map(async (item) => {
              await axios.put(`/${userID}/commission/${item.id}`, {
                commission_issued: true,
                issue_date: new Date(),
              });
            }),
          );

          const commissionIds = data.commission.map((item) => item.id);
        
          await axios.post(`/${userID}/salary`, {
            user_id: user,
            year: selectedYear,
            month: selectedMonth,
            issued_commissions: JSON.stringify(commissionIds),
          });
        }
      }
      toast({ title: "Salary saved successfully." });
      clearForm();
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleAccounts() {
    setAccountsLoading(true);
    axios
      .get(`/${userID}/accounts?month=${selectedMonth}&year=${selectedYear}`)
      .then(async (response) => {
        setToAccounts(response.data);
        // const apiData = response.data;
        // const totalPayments = apiData.reduce(
        //   (sum, payment) => sum + Number(payment.payable),
        //   0
        // );

        // const blob = await pdf(
        //   <AccountsPdf
        //     data={apiData}
        //     total={totalPayments}
        //     headings={apiData.length > 0 ? apiData[0].salary_month : {}}
        //   />
        // ).toBlob();
        // const url = URL.createObjectURL(blob);
        // window.open(url, "_blank");
        // setTimeout(() => URL.revokeObjectURL(url), 600000);
      })
      .finally(() => {
        setAccountsLoading(false);
      });
  }

  const RenderTTRate = ({ machines }) => {
    const total = machines.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0,
    );
    return (
      <div>
        <p>Total PKR: {total}</p>
        <p>USD rate: {ttRate}</p>
      </div>
    );
  };

  const employeeLoan =
    data?.loan && Array.isArray(data.loan) && data.loan.length > 0
      ? data.loan[0]
      : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header + TT Rate */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="space-y-4 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <Heading
              className="my-2"
              title={"Generate Salary"}
              description={"Manage employee salaries"}
            />

            {data &&
              Array.isArray(data?.machines) &&
              data.machines.length > 0 && (
                <Card className="w-full sm:w-[280px]">
                  <CardHeader>
                    <CardTitle>TT Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RenderTTRate machines={data?.machines || []} />
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Filters + Actions */}
          <div className="flex flex-wrap gap-4 items-end">
            {/* User */}
            <div className="flex sm:w-[300px] flex-col gap-2">
              <Label>Select User</Label>
              <UserSearch
                value={user}
                onReturn={(val) => {
                  setUser(val);
                  onSelectedId(val);
                }}
              />
            </div>

            {/* Year */}
            <div className="flex flex-col gap-2">
              <Label>Select Year</Label>
              <Select
                onValueChange={(year) => {
                  setSelectedYear(Number(year));
                  updateDate(selectedMonth, Number(year));
                }}
                value={selectedYear.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month */}
            <div className="flex flex-col gap-2">
              <Label>Select Month</Label>
              <Select
                onValueChange={(month) => {
                  setSelectedMonth(Number(month));
                  updateDate(Number(month), selectedYear);
                }}
                value={selectedMonth.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate + Accounts */}
            {userID && (
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!user || !userID}
                  onClick={() => {
                    clearForm();
                    setModal(true);
                  }}
                >
                  {loading && <Spinner />} Generate
                </Button>
                <Button onClick={() => handleAccounts()}>
                  {accountsLoading && <Spinner />} To Accounts
                </Button>
              </div>
            )}

            {/* Refresh + Save + Issue */}
            {data?.user && (
              <div className="flex flex-wrap gap-4 items-center mt-2">
                <Button
                  onClick={() => {
                    clearForm();
                    setRefresh(true);
                    setModal(true);
                  }}
                >
                  Refresh
                </Button>
                <Button
                  disabled={saveLoading}
                  onClick={() => handleSave()}
                  variant="destructive"
                >
                  {saveLoading && <Spinner />} Save
                </Button>
                <div className="flex flex-row gap-2 items-center">
                  <Label>Issue?</Label>
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(checked) => {
                      setChecked(checked);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Configurable + Overview */}
          <div className="flex flex-col xl:flex-row gap-4">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Configurable</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.keys(form).map(
                    (key) =>
                      key !== "old_target_achieved" && (
                        <div key={key} className="flex flex-col gap-1">
                          <Label>
                            {key.replace(/_/g, " ").toUpperCase()}{" "}
                            {key === "target_achieved" && "(USD)"}
                          </Label>
                          {loading ? (
                            <Skeleton className={"h-[40px] w-[150px]"} />
                          ) : (
                            <Input
                              type="number"
                              value={form[key]}
                              onChange={(e) =>
                                handleInputChange(key, e.target.value)
                              }
                            />
                          )}
                        </div>
                      ),
                  )}

                  <div className="flex flex-col gap-1">
                    <Label>Deals Cancelled</Label>
                    {loading ? (
                      <Skeleton className={"h-[40px] w-[150px]"} />
                    ) : (
                      <Input
                        type="number"
                        value={cancelled}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCancelled(
                            value ? (value == "-" ? value : Number(value)) : "",
                          );
                        }}
                      />
                    )}
                  </div>

                  {employeeLoan && (
                    <div className="flex flex-col gap-1">
                      <Label>Loan Deduction</Label>
                      {loading ? (
                        <Skeleton className={"h-[40px] w-[150px]"} />
                      ) : (
                        <Input
                          type="number"
                          value={repayment}
                          onChange={(e) => {
                            const value = e.target.value;
                            setRepayment(
                              value
                                ? value == "-"
                                  ? value
                                  : Number(value)
                                : "",
                            );
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Salary Details */}
                  <div className="flex flex-col gap-1">
                    <Label>TOTAL SALARY</Label>
                    <Input
                      value={data?.user?.total_salary || 0}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>BASIC SALARY</Label>
                    <Input
                      value={data?.user?.basic_salary || 0}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>KPI SALARY</Label>
                    <Input
                      value={
                        data?.user
                          ? data.user.total_salary - data.user.basic_salary
                          : 0
                      }
                      disabled
                      readOnly
                    />
                  </div>

                  {/* Targets */}
                  <div className="flex flex-col gap-1">
                    <Label>MONTHLY TARGET</Label>
                    <Input
                      value={data?.user?.monthly_target || 0}
                      disabled
                      readOnly
                    />
                  </div>

                  {data?.user?.designation === "Sales" && (
                    <>
                      <div className="flex flex-col gap-1">
                        <Label>MONTHLY VISITS</Label>
                        <Input value={15} disabled readOnly />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>VISITS DONE</Label>
                        <Input
                          value={data?.totalVisits || 0}
                          disabled
                          readOnly
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>MONTHLY FEEDBACKS</Label>
                        <Input
                          value={data?.totalCustomersWithSale || 0}
                          disabled
                          readOnly
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label>FEEDBACKS TAKEN</Label>
                        <Input
                          value={data?.feedbacksTakenThisMonth || 0}
                          disabled
                          readOnly
                        />
                      </div>
                    </>
                  )}

                  {/* KPI + Fines */}
                  <div className="flex flex-col gap-1">
                    <Label>KPI ACHIEVED</Label>
                    <Input value={kpi.toFixed(2)} disabled readOnly />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>ABSENTS FINE</Label>
                    <Input value={absentsFine} disabled readOnly />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>LATE COMING FINE</Label>
                    <Input value={lateComingFine} disabled readOnly />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label>FUEL</Label>
                    <Input value={data?.user?.fuel || 0} disabled readOnly />
                  </div>

                  {employeeLoan && (
                    <div className="flex flex-col gap-1">
                      <Label>Remaining Loan</Label>
                      <Input value={remainingLoan || 0} disabled readOnly />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Final Salary */}
          <Card>
            <CardHeader>
              <CardTitle>Final Salary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                ["Reimbursements", form.reimbursement],
                ["Commission", form.commission],
                ["Miscellaneous", form.miscellaneous],
                ["ADDITIONAL FINE", form.additional_fine],
                ["FUEL", data?.user?.fuel || 0],
                ...(employeeLoan ? [["LOAN DEDUCTION", repayment]] : []),
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-3 items-center gap-2"
                >
                  <Label>{label}</Label>
                  {loading ? (
                    <Skeleton className="h-[40px] w-[300px]" />
                  ) : (
                    <Input value={value} disabled readOnly />
                  )}
                </div>
              ))}

              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-lg font-semibold text-green-600 tracking-wide">
                  PAYABLE SALARY
                </Label>
                {loading ? (
                  <Skeleton className={"h-[40px] w-[300px]"} />
                ) : (
                  <Input value={payable} disabled readOnly />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salary History (side) */}
        <SalaryHistory data={data?.old_record || []} />
      </div>

      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="commission">
          <AccordionTrigger>
            <span>Commission</span>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle>Commission Record</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {loading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Spinner />
                  </div>
                ) : (
                  <CommissionRecord
                    data={data?.commission || []}
                    fetchData={handleGenerate}
                  />
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="target">
          <AccordionTrigger>
            <span>Target</span>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle>Target Record</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {loading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Spinner />
                  </div>
                ) : (
                  <TargetRecord passingData={data?.machines || []} />
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="reimbursement">
          <AccordionTrigger>
            <span>Reimbursement</span>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle>Reimbursement Record</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {loading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Spinner />
                  </div>
                ) : (
                  <Reimbursement passingData={data?.reimbursement || []} />
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="attendance">
          <AccordionTrigger>
            <span>Attendance</span>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle>Attendance Record</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {loading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Spinner />
                  </div>
                ) : (
                  <AttendanceRecord passingData={attendanceData} />
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fines">
          <AccordionTrigger>
            <span>Fines</span>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle>Fines Record</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {loading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Spinner />
                  </div>
                ) : (
                  <Fines passingData={data?.fines || []} />
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Additional Settings</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-2">
            <div className="flex flex-row gap-2 items-center">
              <Label className="text-lg">Exclude absents?</Label>
              <Checkbox
                checked={excludeAbsent}
                onCheckedChange={(checked) => {
                  setExcludeAbsent(checked);
                }}
              />
            </div>
            <div className="flex flex-row gap-2 items-center">
              <Label className="text-lg">Exclude absents fine?</Label>
              <Checkbox
                checked={excludeAbsentFine}
                onCheckedChange={(checked) => {
                  setExcludeAbsentFine(checked);
                }}
              />
            </div>
            <div className="flex flex-row gap-2 items-center">
              <Label className="text-lg">Exclude late?</Label>
              <Checkbox
                checked={excludeLate}
                onCheckedChange={(checked) => {
                  setExcludeLate(checked);
                }}
              />
            </div>
            <div className="flex flex-row gap-2 items-center">
              <Label className="text-lg">Exclude late fine?</Label>
              <Checkbox
                checked={excludeLateFine}
                onCheckedChange={(checked) => {
                  setExcludeLateFine(checked);
                }}
              />
            </div>
          </div>
          <DialogFooter className="justify-start sm:justify-end gap-2">
            <DialogClose asChild>
              <Button variant="secondary">Close</Button>
            </DialogClose>
            <Button
              disabled={!userID}
              onClick={() => {
                setModal(false);
                handleGenerate();
              }}
            >
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Accounts
        visible={toAccounts.length > 0}
        onClose={() => setToAccounts([])}
        data={toAccounts}
      />
    </div>
  );
};

function SalaryHistory({ data }) {
  if (!data || data.length === 0) {
    return;
  }

  const totalPayments = data.reduce(
    (sum, payment) => sum + Number(payment.payable),
    0,
  );

  return (
    <ScrollArea className="max-h-[80vh] pr-2 w-[220px]">
      <div className="grid gap-2">
        <Label className="block text-md font-semibold text-green-600 text-right">
          Total Paid:{" "}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "PKR",
          }).format(totalPayments || 0)}
        </Label>

        {data.map((item, index) => (
          <Card key={index} className="shadow-sm border">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm font-medium">
                {moment(item.salary_month).format("MMMM YYYY")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2 text-sm space-y-1">
              <div className="flex justify-between gap-1">
                <span className="text-muted-foreground">Payable</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PKR",
                  }).format(item?.payable || 0)}
                </span>
              </div>
              <div className="flex justify-between ">
                <span className="text-muted-foreground">Created</span>
                <span>{moment(item.created_at).format("YYYY-MM-DD")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

const Accounts = ({ visible, onClose, data }) => {
  const [selected, setSelected] = useState([]);
  const [finalData, setFinalData] = useState([]);
  const [search, setSearch] = useState("");

  // keep finalData in sync with selected
  useEffect(() => {
    const filtered = data.filter((item) => selected.includes(item.user_id));
    setFinalData(filtered);
  }, [selected, data]);

  const allSelected = selected.length === data.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(data.map((item) => item.user_id));
    }
  };

  const toggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  async function handleCreatePdf() {
    try {
      const apiData = [...finalData];
      const totalPayments = apiData.reduce(
        (sum, payment) => sum + Number(payment.payable),
        0,
      );

      const blob = await pdf(
        <AccountsPdf
          data={apiData}
          total={totalPayments}
          headings={apiData.length > 0 ? apiData[0].salary_month : {}}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 600000);
    } catch (e) {
      console.log(e);
    }
  }

  function handleClose() {
    setSelected([]);
    setFinalData([]);
    onClose();
  }

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export salary PDF</DialogTitle>
        </DialogHeader>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter users..."
          className="mb-2"
        />

        <div className="border rounded-md max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      allSelected
                        ? true
                        : someSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Payable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.user_id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(item.user_id)}
                      onCheckedChange={() => toggleOne(item.user_id)}
                    />
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{item.payable}</TableCell>
                </TableRow>
              ))}

              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="justify-start sm:justify-end gap-2 mt-4">
          <Button disabled={finalData.length === 0} onClick={handleCreatePdf}>
            Ok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Fines = ({ passingData }) => {
  const [data, setData] = useState([]);

  const tableHeader = [
    {
      value: "customer_name",
      label: "Customer",
    },
    {
      value: "user_name",
      label: "Employee",
    },
    {
      value: "amount",
      label: "Amount",
    },
    {
      value: "reason",
      label: "Reason",
    },
  ];

  const columns = [
    {
      accessorKey: "created_at",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("created_at")
            ? moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")
            : ""}
        </div>
      ),
    },

    {
      accessorKey: "user_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Employee
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
    },
    {
      accessorKey: "customer_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("customer_name")}</div>,
    },

    {
      accessorKey: "amount",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("amount")}</div>,
    },

    {
      accessorKey: "reason",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Reason
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("reason")}</div>,
    },
  ];

  useEffect(() => {
    setData([...passingData]);
  }, [passingData]);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-1 min-h-[600px]">
        <PageTable
          columns={columns}
          data={data}
          tableHeader={tableHeader}
          onRowClick={() => {}}
        />
      </div>
    </div>
  );
};

const Reimbursement = ({ passingData }) => {
  const [data, setData] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setData([...passingData]);
  }, [passingData]);

  const columns = [
    {
      accessorKey: "date",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">
          {row.getValue("date")
            ? moment(new Date(row.getValue("date"))).format("YYYY-MM-DD")
            : ""}
        </div>
      ),
    },

    {
      accessorKey: "title",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("title")}</div>,
    },
    {
      accessorKey: "city",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            City
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("city")}</div>,
    },
    {
      accessorKey: "amount",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("amount")}</div>,
    },

    {
      accessorKey: "description",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Description
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("description")}</div>,
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-1 min-h-[600px]">
        <PageTable
          disableInput={true}
          columns={columns}
          data={data}
          onRowClick={(val) => {
            setImageURL(val);
            setVisible(true);
          }}
        ></PageTable>
      </div>

      <ImageSheet
        visible={visible}
        onClose={() => setVisible(false)}
        img={imageURL?.image || null}
        description={imageURL?.description || null}
        submittedBy={imageURL?.submitted_by_name || null}
      />
    </div>
  );
};
const ImageSheet = ({ visible, onClose, img, submittedBy, description }) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [localImage, setLocalImage] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const isMountedRef = useRef(true);

  // Memoized function to fetch image URL (prevents unnecessary re-fetching)
  const fetchImage = useCallback(async () => {
    if (!img) return;

    if (img.includes("http")) {
      if (isMountedRef.current) setLocalImage(img);
    } else {
      try {
        const storageRef = ref(storage, img);
        const url = await getDownloadURL(storageRef);
        if (isMountedRef.current) setLocalImage(url);
      } catch (error) {
        console.error("Error fetching image URL:", error);
      }
    }
  }, [img]);

  // Use Effect to fetch image on mount or when img changes
  useEffect(() => {
    isMountedRef.current = true;
    fetchImage();

    return () => {
      isMountedRef.current = false;
      setLocalImage(null);
    };
  }, [fetchImage]);

  // Memoized function for closing modal
  const handleClose = useCallback(() => {
    if (!imageOpen) {
      onClose();
    }
  }, [imageOpen, onClose]);

  // Memoized function for zoom change
  const handleZoomChange = useCallback((shouldZoom) => {
    setIsZoomed(shouldZoom);
    if (!shouldZoom) {
      setImageOpen(false);
    }
  }, []);

  // Memoized local image URL to prevent unnecessary re-renders
  const memoizedImage = useMemo(() => localImage, [localImage]);

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Bill Detail</SheetTitle>

          <strong>Submitted by</strong>
          <p>{submittedBy || "N/A"}</p>

          <strong>Description</strong>
          <p>{description || "No description available"}</p>

          {memoizedImage ? (
            <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
              <img
                onClick={() => setImageOpen(true)}
                className="hover:cursor-pointer"
                src={memoizedImage}
                alt="reimbursement-img"
                style={{
                  flex: 1,
                  maxWidth: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                }}
              />
            </ControlledZoom>
          ) : (
            <p>Loading image...</p>
          )}
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

const AttendanceRecord = ({ passingData = [] }) => {
  const columns = [
    {
      accessorKey: "date",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("date")}</div>,
    },

    {
      accessorKey: "day",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Day
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("day")}</div>,
    },

    {
      accessorKey: "time_in",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Time In
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("time_in")}</div>,
    },

    {
      accessorKey: "time_out",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Time Out
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("time_out")}</div>,
    },

    {
      accessorKey: "status",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div
          style={{
            color: row.getValue("status") === "Present" ? "green" : "red",
          }}
        >
          {row.getValue("status")}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-1 min-h-[600px]">
        <PageTable
          disableInput={true}
          columns={columns}
          data={passingData}
          onRowClick={(val) => {}}
        ></PageTable>
      </div>
    </div>
  );
};

const TargetRecord = ({ passingData = [] }) => {
  const { base_route } = useUserDetail();
  const columns = [
    {
      accessorKey: "contract_date",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Contract Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">
          {row.getValue("contract_date")
            ? moment(row.getValue("contract_date")).format("YYYY-MM-DD")
            : ""}
        </div>
      ),
    },

    {
      accessorKey: "customer_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("customer_name")}</div>,
    },

    {
      accessorKey: "serial_no",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Model No
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("serial_no")}</div>,
    },

    {
      accessorKey: "order_no",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order No
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("order_no")}</div>,
    },

    {
      accessorKey: "source",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Source
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("source")}</div>,
    },

    {
      accessorKey: "power",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Power
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("power")}</div>,
    },

    {
      accessorKey: "price",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("price")}</div>,
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-1 min-h-[600px]">
        <PageTable
          disableInput={true}
          columns={columns}
          data={passingData}
          onRowClick={(val, e) => {
            const url = `/${base_route}/member/${val.customer_id}/${val.id}`;
            window.open(url, "_blank");
          }}
        ></PageTable>
      </div>
    </div>
  );
};

export default SalaryComponent;
