"use client";
import AppCalendar from "@/components/appCalendar";
import ProfilePicture from "@/components/ProfilePicture";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { storage } from "@/config/firebase";
import { BASE_URL } from "@/constants/data";
import { useToast } from "@/hooks/use-toast";
import { UserContext } from "@/store/context/UserContext";
import axios from "axios";
import { getDownloadURL, ref } from "firebase/storage";
import { useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import 'react-medium-image-zoom/dist/styles.css';

export default function Page() {
  const [data, setData] = useState();
  const search = useSearchParams();
  const userID = search.get("id");
  const { state: UserState } = useContext(UserContext);
  const [totalSales, setTotalSales] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [allowedExtraData, setAllowedExtraData] = useState(true);
  const [joiningDate, setJoiningDate] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [fixedData, setFixedData] = useState({
    designation: "",
    dp: "",
    email: "",
    name: "",
    cnic: "",
    police: "",
    education: "",
    resume : "",
    number : "",
    kin : ""
  });
  const [form, setForm] = useState({
    basic_salary: "",
    monthly_target: "",
    total_salary: "",
    note: "",
  });

  const [checks, setChecks] = useState({
    branch_expenses_assigned: false,
    branch_expenses_delete_access: false,
    inventory_assigned: false,
    customer_add_access: false,
    customer_delete_access: false,
    dms_write_access : false,
    limited_access : false,
    full_access : false
  });
  const { toast } = useToast();
  useEffect(() => {
    const id = search.get("id");
    axios
      .get(`${BASE_URL}/user?user=${id}`)
      .then((response) => {
        if (response.data.length > 0) {
          const apiData = response.data.length > 0 ? response.data[0] : {};
          setEmployeeId(apiData?.id);
          setFixedData({
            id: apiData?.id,
            cnic: apiData?.cnic,
            designation: apiData?.designation,
            dp: apiData?.dp,
            education: apiData?.education,
            email: apiData?.email,
            name: apiData?.name,
            police: apiData?.police,
            resume : apiData?.resume,
            number : apiData?.number || "",
            kin : apiData?.kin_number || ""
          });
          setChecks({
            branch_expenses_assigned: apiData?.branch_expenses_assigned,
            branch_expenses_delete_access: apiData?.branch_expenses_delete_access,
            customer_add_access: apiData?.customer_add_access,
            customer_delete_access: apiData?.customer_delete_access,
            inventory_assigned: apiData?.inventory_assigned,
            dms_write_access : apiData?.dms_write_access,
            limited_access : apiData?.limited_access,
            full_access : apiData?.full_access
          });
          setForm({
            basic_salary: apiData?.basic_salary || 0,
            monthly_target: apiData?.monthly_target || 0,
            note: apiData?.note || "",
            total_salary: apiData?.total_salary || 0,
          });

          setJoiningDate(apiData?.joining_date);
        } else {
          toast({
            title: "Employee details not found",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheck = (field, value) => {
    setChecks((prev) => ({
      ...prev,
      [field]: value,
    }));
    if(field == 'full_access' && value == true){
      setChecks((prev) => ({
        ...prev,
        ["limited_access"]: false,
      }));
    }
  };

  async function handleSave() {
    if (!employeeId) return;
    setDataLoading(true);
    axios
      .put(`${BASE_URL}/user/${employeeId}`, {
        basic_salary: form?.basic_salary || 0,
        monthly_target: form?.monthly_target || 0,
        note: form?.note || "",
        total_salary: form?.total_salary || 0,
        branch_expenses_assigned: checks?.branch_expenses_assigned,
        branch_expenses_delete_access: checks?.branch_expenses_delete_access,
        customer_add_access: checks?.customer_add_access,
        customer_delete_access: checks?.customer_delete_access,
        inventory_assigned: checks?.inventory_assigned,
        dms_write_access: checks?.dms_write_access,
        limited_access : checks?.limited_access,
        full_access : checks?.full_access,
        joining_date: joiningDate,
      })
      .then(() => {
        toast({ title: "Information updated" });
      })
      .finally(() => {
        setDataLoading(false);
      });
  }

  const DocumentCard = useCallback(
    ({ type }) => {
      const [loading, setLoading] = useState(false); // Track loading state
      const [fileUrl, setFileUrl] = useState(null);
      const [fileName, setFileName] = useState("");

    

      useEffect(() => {
      
        if (fixedData[type]) {
          setLoading(true);
          const filePath = fixedData[type];
          if (filePath.includes("http")) {
            setFileUrl(filePath);
            setFileName(filePath.split("/").pop());
            setLoading(false);
          } else {
            const storageRef = ref(storage, filePath);
            getDownloadURL(storageRef)
              .then((url) => {
                setFileUrl(url);
                setFileName(filePath.split("/").pop());
              })
              .catch((error) => console.error("Error loading image:", error))
              .finally(() => setLoading(false));
          }
        }
      }, []);

      return (
        <>
          <Label className="text-bold text-[20px]">{type?.toUpperCase()}</Label>
          {loading ? (
            <Skeleton className="h-[50px] w-full" />
          ) : (
            <div className="flex items-center space-x-4">
              {!fileUrl ? (
                <>
                 <Button variant="outline" asChild>
                    <a
                      href={"#"} 
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      Nil
                    </a>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <a
                      href={fileUrl}
                      download={fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      Download {fileName}
                    </a>
                  </Button>
               
                </>
              )}
            </div>
          )}
        </>
      );
    },
    [fixedData, UserState]
  );

  return (
    <div className="flex flex-1 justify-center items-center p-6">
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent>
            <div className="flex items-center gap-4 border-b pb-4 mb-6 mt-2">
              <ProfilePicture
                img={fixedData?.dp}
                name={fixedData?.name}
                loading={loading}
              />
              <div>
                <h1 className="text-2xl font-semibold">{fixedData?.name}</h1>
                <p className="text-muted-foreground">
                  {fixedData?.designation}
                </p>
              </div>
            </div>

            {/* Profile Editing Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Edit Profile Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.keys(form).map(
                    (key) =>
                      key !== "note" && (
                        <div key={key} className="flex flex-col gap-1">
                          <Label>{key.replace(/_/g, " ").toUpperCase()}</Label>
                          <Input
                            className="rounded-lg"
                            value={form[key]}
                            onChange={(e) =>
                              handleInputChange(key, e.target.value)
                            }
                          />
                        </div>
                      )
                  )}
                </CardContent>
              </Card>

              {/* Edit Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.keys(checks).map((key) => (
                    <div key={key} className="flex items-center gap-3">
                      <Checkbox
                        className="scale-110"
                        checked={checks[key]}
                        onCheckedChange={(checked) => handleCheck(key, checked)}
                      />
                      <Label>{key.replace(/_/g, " ").toUpperCase()}</Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Additional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                  <Label>PHONE NUMBER</Label>
                 <Input value={fixedData?.number} onChange={()=>{}} disabled/>
                </div>

                <div className="flex flex-col gap-1">
                  <Label>KINSHIP NUMBER</Label>
                  <Input value={fixedData?.kin} onChange={()=>{}} disabled/>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>NOTE</Label>
                  <Textarea
                    className="rounded-lg"
                    value={form.note}
                    onChange={(e) => handleInputChange("note", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>JOINING DATE</Label>
                  <AppCalendar
                    date={joiningDate}
                    onChange={(date) => setJoiningDate(date)}
                  />
                </div>

              
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSave}
                className="px-6 py-2 font-semibold rounded-lg shadow-md hover:shadow-lg"
              >
                {dataLoading && <Spinner />} Save
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-1 flex-col space-y-4 ">
              <DocumentCard type={"cnic"} />
              <DocumentCard type={"police"} />
              <DocumentCard type={"education"} />
              <DocumentCard type={"resume"} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
