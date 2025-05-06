"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, Trash2 } from "lucide-react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PageTable from "@/components/app-table";
import SalaryPdf from "@/components/salaryPdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Heading } from "@/components/ui/heading";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSearch } from "@/components/user-search";
import { storage } from "@/config/firebase";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { format, setMonth } from "date-fns";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import { FaRegFilePdf } from "react-icons/fa";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import AccountsPdf from "@/components/accountsPdf";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { pdf } from "@react-pdf/renderer";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <Tabs defaultValue="salary" className="flex flex-1 flex-col">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="record">Record</TabsTrigger>
        </TabsList>
        <TabsContent value="salary">
          <SalaryComponent />
        </TabsContent>
        <TabsContent value="record">
          <RecordComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const SalaryComponent = () => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [startDate, setStartDate] = useState(
    moment().startOf("month").toISOString()
  );
  const { state: UserState } = useContext(UserContext);
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
  });
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
  const [TTModal, setTTModal] = useState(false);
  const [ttRate, setTTRate] = useState(1);
  const { toast } = useToast();
  const [refresh, setRefresh] = useState(false)
  const years = Array.from(
    { length: 20 },
    (_, i) => new Date().getFullYear() - 10 + i
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    format(setMonth(new Date(), i), "MMMM")
  );

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
    const response = await axios.get("/settings");
    setForm({ ...form, late_fine_per_day: response.data.late_fine * -1 });
    axios
      .get(
        `/salary?user=${user}&start=${startDate}&end=${endDate}&month=${selectedMonth}&year=${selectedYear}`
      )
      .then((response) => {
        if (
          response.data.machines &&
          Array.isArray(response.data?.machines) &&
          response.data?.machines.length > 0
        ) {
          setTTModal(true);
        }
        setData(response.data);
        if(refresh){
        
          setChecked(false);
          processAttendance(
            Number(moment(startDate).format("YYYY")),
            Number(moment(startDate).format("MM")),
            response.data.attendance,
            true
          );
          if (response.data?.reimbursement) {
            const totalAmount = response.data.reimbursement.reduce(
              (sum, item) => sum + Number(item.amount),
              0
            );
            setForm((prevState) => ({
              ...prevState,
              reimbursement: totalAmount,
            }));
          }
          if (response.data?.commission) {
            const totalCommission = response.data?.commission.reduce(
              (sum, item) => sum + Number(item.commission_amount),
              0
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
            setChecked(existing.issued);
            processAttendance(
              Number(moment(startDate).format("YYYY")),
              Number(moment(startDate).format("MM")),
              response.data.attendance,
              false
            );
          } else {
          
            setChecked(false);
            processAttendance(
              Number(moment(startDate).format("YYYY")),
              Number(moment(startDate).format("MM")),
              response.data.attendance,
              true
            );
            if (response.data?.reimbursement) {
              const totalAmount = response.data.reimbursement.reduce(
                (sum, item) => sum + Number(item.amount),
                0
              );
              setForm((prevState) => ({
                ...prevState,
                reimbursement: totalAmount,
              }));
            }
            if (response.data?.commission) {
              const totalCommission = response.data?.commission.reduce(
                (sum, item) => sum + Number(item.commission_amount),
                0
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
          }
        }
      })
      .finally(() => {
        setLoading(false);
        setRefresh(false)
      });
  }

  useEffect(() => {
    if (data && data?.user) {
      setKpi(
        ((Number(form.target_achieved) || 0) / (Number(data?.user?.monthly_target) || 1)) *
        ((Number(data?.user?.total_salary) || 0) - (Number(data?.user?.basic_salary) || 0))
      );
      if (!excludeLateFine) {
        setLateComingFine(
          data?.user ? (form.late_fine_per_day || 0) * (form.late || 0) : 0
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
                ).toFixed(0)
              )
            : 0
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
        Number(form.additional_fine || 0)
        ).toFixed(2)
      );
    }
  }, [data, form, kpi, lateComingFine, absentsFine]);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value  ? (value == "-" ? value : Number(value)) : "",
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

      if (!isSunday) totalWorkingDays++; // Count only non-Sunday days
      else sundays.push(date.format("YYYY-MM-DD")); // Track Sundays

      monthData.push({
        date: date.format("YYYY-MM-DD"),
        day: date.format("dddd"),
        status: "Absent", // Default status
        time_in: null,
        time_out: null,
      });
    }

    let finalData = monthData.map((day) => {
      let record = records.find(
        (r) =>
          moment(new Date(r.time_in)).format("YYYY-MM-DD") ===
          moment(day.date).format("YYYY-MM-DD")
      );

      if (record) {
        const checkIn = moment(new Date(record.time_in));
        const checkOut = record?.time_out
          ? moment(new Date(record.time_out))
          : null;

        // Check if user is late
        let isLate = checkIn.isAfter(
          moment(day.date + " 10:10", "YYYY-MM-DD HH:mm")
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

    setAttendanceData([...finalData]);

    if (condition) {
      const totalPresent = finalData.filter(
        (item) => item.status === "Present" || item.status === "Late"
      );
      const lateCount = finalData.filter(
        (item) => item.status === "Late"
      ).length;

      setForm((prevState) => ({
        ...prevState,
        absents: totalWorkingDays - totalPresent.length,
        late: lateCount,
      }));
    }
  };

  async function handleSave() {
    setSaveLoading(true);

    axios
      .post(`/salary`, {
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
        payable: payable ,
      })
      .then(() => {
        toast({ title: "Salary saved" });
      })
      .finally(() => {
        setSaveLoading(false);
      });
  }

  async function handleAccounts() {
    setAccountsLoading(true);
    axios
      .get(`/accounts?month=${selectedMonth}&year=${selectedYear}`)
      .then(async (response) => {
        const apiData = response.data;
        const totalPayments = apiData.reduce(
          (sum, payment) => sum + Number(payment.payable),
          0
        );
        const blob = await pdf(
          <AccountsPdf
            data={apiData}
            total={totalPayments}
            headings={apiData.length > 0 ? apiData[0].salary_month : {}}
          />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 600000);
      })
      .finally(() => {
        setAccountsLoading(false);
      });
  }

  const RenderTTRate = ({ machines }) => {
    const total = machines.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );
    return (
      <div>
        <p>Total PKR: {total}</p>
        <p>USD rate: {ttRate}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap gap-4 justify-between items-start">
        <Heading
          className="my-4"
          title={"Generate Salary"}
          description={"Manage employee salaries"}
        />

        {data && Array.isArray(data?.machines) && data.machines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>TT Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <RenderTTRate machines={data?.machines || []} />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-end gap-4 flex-wrap ">
        <div className="flex w-full sm:w-[300px] flex-col gap-2">
          <Label>Select User</Label>
          <UserSearch value={user} onReturn={setUser} />
        </div>

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
        {UserState.value.data?.id && (
          <>
            <Button
              disabled={!user}
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
          </>
        )}

        {data?.user && (
          <>
            <Button
              onClick={() => {
                clearForm();
                setModal(true);
                setRefresh(true)
              }}
              className="mt-6"
            >
              Refresh
            </Button>
            <Button
              onClick={() => handleSave()}
              variant="destructive"
              className="mt-6"
            >
              {saveLoading && <Spinner />} Save
            </Button>
            <div className="flex flex-row gap-2 mt-6">
              <Label>Issue ?</Label>
              <Checkbox
                checked={checked}
                onCheckedChange={(checked) => {
                  setChecked(checked);
                }}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-row flex-wrap gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Configurable</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.keys(form).map((key) => (
                <div key={key} className="flex flex-col gap-1">
                  <Label>{key.replace(/_/g, " ").toUpperCase()}</Label>
                  {loading ? (
                    <Skeleton className={"h-[40px] w-[150px]"} />
                  ) : (
                    <Input
                      type="number"
                      value={form[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <Label>TOTAL SALARY</Label>
                <Input
                  value={data?.user?.total_salary || 0}
                  disabled
                  onChange={(e) => {}}
                  readOnly
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>BASIC SALARY</Label>
                <Input
                  value={data?.user?.basic_salary || 0}
                  disabled
                  onChange={(e) => {}}
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
                  onChange={(e) => {}}
                  readOnly
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>MONTHLY TARGET</Label>
                <Input
                  value={data?.user?.monthly_target || 0}
                  disabled
                  onChange={(e) => {}}
                  readOnly
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>KPI ACHIEVED</Label>
                <Input
                  value={kpi.toFixed(2)}
                  disabled
                  onChange={(e) => {}}
                  readOnly
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label>ABSENTS FINE</Label>
                <Input
                  value={absentsFine}
                  disabled
                  onChange={(e) => {}}
                  readOnly
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label>LATE COMING FINE</Label>
                <Input
                  value={lateComingFine}
                  disabled
                  onChange={(e) => {}}
                  readOnly
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Final Salary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="grid grid-cols-3 items-center">
            <Label>Reimbursements</Label>
            {loading ? (
              <Skeleton className={"h-[40px] w-[300px]"} />
            ) : (
              <Input
                value={form.reimbursement}
                disabled
                onChange={(e) => {}}
                readOnly
              />
            )}
          </div>

          <div className="grid grid-cols-3 items-center">
            <Label>Commission</Label>
            {loading ? (
              <Skeleton className={"h-[40px] w-[300px]"} />
            ) : (
              <Input
                value={form.commission}
                disabled
                onChange={(e) => {}}
                readOnly
              />
            )}
          </div>

          <div className="grid grid-cols-3 items-center">
            <Label>Miscellaneous</Label>
            {loading ? (
              <Skeleton className={"h-[40px] w-[300px]"} />
            ) : (
              <Input
                value={form.miscellaneous}
                disabled
                onChange={(e) => {}}
                readOnly
              />
            )}
          </div>

          <div className="grid grid-cols-3 items-center">
            <Label>ADDITIONAL FINE</Label>
            {loading ? (
              <Skeleton className={"h-[40px] w-[300px]"} />
            ) : (
              <Input
                value={form.additional_fine}
                disabled
                onChange={(e) => {}}
                readOnly
              />
            )}
          </div>

          <div className="grid grid-cols-3 items-center">
            <Label className="text-lg font-semibold text-green-600 tracking-wide">
              PAYABLE SALARY
            </Label>
            {loading ? (
              <Skeleton className={"h-[40px] w-[300px]"} />
            ) : (
              <Input value={payable } disabled onChange={(e) => {}} readOnly />
            )}
          </div>
        </CardContent>
      </Card>

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

      <Dialog open={TTModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Define USD conversion rate</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-2">
            <Label> Enter rate</Label>
            <Input
              value={ttRate}
              onChange={(e) => setTTRate(e.target.value)}
              type="number"
            />
          </div>
          <DialogFooter className="justify-start sm:justify-end gap-2">
            <Button
              onClick={() => {
                if (Number(ttRate) > 0 && Array.isArray(data?.machines)) {
                  const total = data.machines.reduce(
                    (sum, item) => sum + Number(item.price || 0),
                    0
                  );
                  const finalTotal = total / Number(ttRate);
                  setForm((prev) => ({
                    ...prev,
                    target_achieved: finalTotal.toFixed(0),
                  }));
                }
                setTTModal(false);
              }}
            >
              Ok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          totalItems={data.length}
          searchItem={"title"}
          searchName={"Search bill..."}
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
          totalItems={passingData.length}
          onRowClick={(val) => {}}
        ></PageTable>
      </div>
    </div>
  );
};

const TargetRecord = ({ passingData = [] }) => {
  const { state: UserState } = useContext(UserContext);
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
          totalItems={passingData.length}
          onRowClick={(val) => {
            const url = `/${UserState.value.data?.base_route}/member/${val.customer_id}/${val.id}`;
            window.open(url, "_blank");
          }}
        ></PageTable>
      </div>
    </div>
  );
};

const RecordComponent = () => {
  const { state: UserState } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (UserState.value.data?.id) {
      fetchData();
    }
  }, [UserState]);

  async function fetchData() {
    axios
      .get(`/record`)
      .then((response) => {
        setData(response.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const columns = [
    {
      accessorKey: "salary_month",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Salary Month
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">
          {row.getValue("salary_month")
            ? moment(new Date(row.getValue("salary_month"))).format("MMMM YYYY")
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
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const payment = row.original;

        return (
          <div className="flex gap-4">
            <FaRegFilePdf
              onClick={() => handleDownload(row.original)}
              className="h-7 w-7 text-red-500"
            />
            <Trash2
              onClick={() => handleDelete(row.original.id)}
              className="h-7 w-7 text-red-500"
            />
          </div>
        );
      },
    },
  ];

  async function handleDelete(id) {
    if (!id) return;
    setLoading(true);
    axios
      .delete(`/record/${id}`)
      .then(async () => {
        await fetchData();
      })
      .finally(() => {
        setLoading(false);
      });
  }

  async function handleDownload(item) {
    const blob = await pdf(<SalaryPdf data={item} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 600000);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Heading
        className="my-4"
        title={"Salary Record"}
        description={"Explore issued salaries"}
      />
      <div className="flex flex-1 min-h-[600px]">
        <PageTable
          loading={loading}
          columns={columns}
          data={data}
          totalItems={data.length}
          searchItem={"user_name"}
          searchName={"Search employee..."}
          onRowClick={(val) => {
            // setImageURL(val);
            // setVisible(true);
          }}
          // filter={true}
          // onFilterClick={() => setFilterVisible(true)}
        ></PageTable>
      </div>
    </div>
  );
};
