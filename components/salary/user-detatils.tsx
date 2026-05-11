"use client";
import AppCalendar from "@/components/appCalendar";
import ProfilePictureTeam from "@/components/ProfilePicture";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { storage } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { deleteObject, getDownloadURL, ref } from "firebase/storage";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChangeEvent, Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef, useState } from "react";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { UserContext } from "@/store/context/UserContext";

type DocsDataType = {
  cnic: string;
  education: string;
  police: string;
  resume: string;
  appointment_letter: string;
  father_cnic: string;
}


type UserProfile = {
  id?: number;
  designation: string;
  dp: string;
  email: string;
  name: string;
  number: string;
  kin: string;
};

export default function DetailComponent({ id }: { id: string | null }) {
  const { userID } = useUserDetail();
  const { state: OfficeState } = useContext(OfficeContext);
  const [joiningDate, setJoiningDate] = useState<Date | null>(null);
  const [leavingDate, setLeavingDate] = useState<Date | null>(null);
  const [active, setActive] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [fixedData, setFixedData] = useState<UserProfile>({
    designation: "",
    dp: "",
    email: "",
    name: "",
    number: "",
    kin: "",
  });
  const [form, setForm] = useState({
    basic_salary: "",
    monthly_target: "",
    total_salary: "",
    note: "",
    fuel: 0,
  });

  const [checks, setChecks] = useState({
    branch_expenses_assigned: false,
    branch_expenses_delete_access: false,
    branch_expenses_write_access: false,
    inventory_assigned: false,
    customer_add_access: false,
    customer_delete_access: false,
    dms_write_access: false,
    limited_access: false,
    full_access: false,
    pos_assigned: false,
    complaint_assigned: false,
    superadmin_cloud_access: false,
    customer_full_access: false,
    repairing_and_maintenance: false,
    team_attendance: false,
  });

  const [docsData, setDocsData] = useState({
    cnic: "",
    education: "",
    police: "",
    resume: "",
    appointment_letter: "",
    father_cnic: "",
    contract: "",
  });

  const [otherDocs, setOtherDocs] = useState([])



  useEffect(() => {
    if (userID && id) {
      fetchData();
    }
  }, [userID, id]);

  async function fetchData() {
    axios
      .get(`/${userID}/user?user=${id}`)
      .then((response) => {
        if (response.data.length > 0) {
          const apiData = response.data.length > 0 ? response.data[0] : {};
          setEmployeeId(apiData?.id);
          setFixedData({
            id: apiData?.id,
            designation: apiData?.designation,
            dp: apiData?.dp,
            email: apiData?.email,
            name: apiData?.name,
            number: apiData?.number || "",
            kin: apiData?.kin_number || "",
          });
          setChecks({
            branch_expenses_assigned: apiData?.branch_expenses_assigned,
            branch_expenses_delete_access:
              apiData?.branch_expenses_delete_access,
            branch_expenses_write_access: apiData?.branch_expenses_write_access,
            customer_add_access: apiData?.customer_add_access,
            customer_delete_access: apiData?.customer_delete_access,
            inventory_assigned: apiData?.inventory_assigned,
            dms_write_access: apiData?.dms_write_access,
            limited_access: apiData?.limited_access,
            full_access: apiData?.full_access,
            pos_assigned: apiData?.pos_assigned,
            complaint_assigned: apiData?.complaint_assigned,
            superadmin_cloud_access: apiData?.superadmin_cloud_access,
            customer_full_access: apiData?.customer_full_access,
            repairing_and_maintenance: apiData?.repairing_and_maintenance,
            team_attendance: apiData?.false,
          });
          setForm({
            basic_salary: apiData?.basic_salary || 0,
            monthly_target: apiData?.monthly_target || 0,
            note: apiData?.note || "",
            total_salary: apiData?.total_salary || 0,
            fuel: apiData?.fuel || 0,
          });

          setDocsData({
            cnic: apiData.cnic || "",
            education: apiData.education || "",
            police: apiData.police || "",
            resume: apiData.resume || "",
            appointment_letter: apiData.appointment_letter || "",
            father_cnic: apiData.father_cnic || "",
            contract: apiData?.contract || "",
          });
          setOtherDocs(apiData?.other_docs || [])
          setJoiningDate(apiData?.joining_date || null);
          setLeavingDate(apiData?.leaving_date || null);
          setActive(apiData?.active || false);
        } else {
          toast.error("Employee details not found");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheck = (field: string, value: boolean) => {
    setChecks((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field == "full_access" && value == true) {
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
      .put(`/${userID}/user/${employeeId}`, {
        basic_salary: form?.basic_salary || 0,
        fuel: form?.fuel || 0,
        monthly_target: form?.monthly_target || 0,
        note: form?.note || "",
        total_salary: form?.total_salary || 0,
        branch_expenses_assigned: checks?.branch_expenses_assigned,
        branch_expenses_delete_access: checks?.branch_expenses_delete_access,
        branch_expenses_write_access: checks?.branch_expenses_write_access,
        customer_add_access: checks?.customer_add_access,
        customer_delete_access: checks?.customer_delete_access,
        inventory_assigned: checks?.inventory_assigned,
        dms_write_access: checks?.dms_write_access,
        limited_access: checks?.limited_access,
        full_access: checks?.full_access,
        joining_date: joiningDate,
        leaving_date: leavingDate,
        pos_assigned: checks?.pos_assigned,
        complaint_assigned: checks?.complaint_assigned,
        superadmin_cloud_access: checks?.superadmin_cloud_access,
        customer_full_access: checks?.customer_full_access,
        repairing_and_maintenance: checks?.repairing_and_maintenance,
        team_attendance: checks?.team_attendance,
        active: active,

      })
      .then(() => {
        toast.success("Information updated");
      })
      .finally(() => {
        setDataLoading(false);
      });
  }


  return (
    <div className="flex w-full justify-center pb-4">
      <div className="w-full space-y-6">

        <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-6">
          <ProfilePictureTeam
            img={fixedData?.dp}
            name={fixedData?.name}
            loading={loading}
          />

          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{fixedData?.name}</h1>
            <p className="text-muted-foreground">{fixedData?.designation}</p>

            {fixedData?.designation === "Sales" && (
              <Link
                href={`/lahore/superadmin/team/${id}/dashboard`}
                target="blank"
                className="text-sm text-blue-500 hover:underline mt-1 inline-block"
              >
                Open Dashboard
              </Link>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
            >
              {dataLoading && <Spinner />} Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(form).map(
                (key) =>
                  key !== "note" && (
                    <div key={key} className="space-y-1">
                      <Label>{key.replace(/_/g, " ").toUpperCase()}</Label>
                      <Input
                        className="rounded-lg"
                        value={form[key as keyof typeof form]}
                        onChange={(e) =>
                          handleInputChange(key, e.target.value)
                        }
                      />
                    </div>
                  ),
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.keys(checks).map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    className="scale-110"
                    checked={checks[key as keyof typeof checks]}
                    onCheckedChange={(checked: boolean) =>
                      handleCheck(key, checked)
                    }
                  />
                  <Label>{key.replace(/_/g, " ").toUpperCase()}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>PHONE NUMBER</Label>
              <Input value={fixedData?.number} disabled />
            </div>

            <div className="space-y-1">
              <Label>KINSHIP NUMBER</Label>
              <Input value={fixedData?.kin} disabled />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>NOTE</Label>
              <Textarea
                className="rounded-lg"
                value={form.note}
                onChange={(e) => handleInputChange("note", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>JOINING DATE</Label>
              <AppCalendar
                date={joiningDate}
                onChange={(date) => setJoiningDate(date)}
              />
            </div>

            <div className="space-y-1">
              <Label>LEAVING DATE</Label>
              <AppCalendar
                date={leavingDate}
                onChange={(date) => setLeavingDate(date)}
              />
            </div>

            <div className="flex items-center gap-3 md:col-span-2">
              <Label>Status</Label>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </CardContent>
        </Card>



        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <DocumentCard type={"cnic"} docsData={docsData} employeeId={employeeId} fetchData={fetchData} userID={userID} />
              <DocumentCard type={"father_cnic"} docsData={docsData} employeeId={employeeId} fetchData={fetchData} userID={userID} />
              <DocumentCard type={"police"} docsData={docsData} employeeId={employeeId} fetchData={fetchData} userID={userID} />
              <DocumentCard type={"education"} docsData={docsData} employeeId={employeeId} fetchData={fetchData} userID={userID} />
              <DocumentCard type={"resume"} docsData={docsData} employeeId={employeeId} fetchData={fetchData} userID={userID} />
              <DocumentCard type={"appointment_letter"} docsData={docsData} employeeId={employeeId} fetchData={fetchData} userID={userID} />
              <DocumentCard type={"contract"} docsData={docsData} employeeId={employeeId} fetchData={fetchData} userID={userID} />
              <DocumentCardOther userID={userID} otherDocs={otherDocs} employeeId={employeeId} fetchData={fetchData} />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}


const DocumentCardOther = ({ userID, otherDocs, employeeId, fetchData }: { userID: number, otherDocs: string[], employeeId: string | null, fetchData: () => Promise<void> }) => {
  const [files, setFiles] = useState<
    {
      url: string;
      name: string;
      path: string;
    }[]
  >([]);

  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { state: OfficeState } = useContext(OfficeContext)
  const [open, setOpen] = useState(false)
  const userId = userID;

  useEffect(() => {
    async function loadFiles() {
      if (!otherDocs?.length) return;

      setLoading(true);

      try {
        const loadedFiles = await Promise.all(
          otherDocs.map(async (filePath: string) => {
            if (filePath.includes("http")) {
              return {
                url: filePath,
                name: filePath.split("/").pop() || "file",
                path: filePath,
              };
            }

            const storageRef = ref(storage, filePath);
            const url = await getDownloadURL(storageRef);

            return {
              url,
              name: filePath.split("/").pop() || "file",
              path: filePath,
            };
          })
        );

        setFiles(loadedFiles);
      } catch (error) {
        console.error("Error loading files:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, [otherDocs]);

  const handleFileUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event?.target?.files?.[0];

    if (!file) return;

    setLoading(true);

    try {
      const extension = file.name.split(".").pop();

      const fileName = `${Date.now()}-${file.name}`;

      const newFilePath = `${OfficeState.value.data}/${userId}/profile/other_docs/${fileName}`;

      await UploadImage(
        URL.createObjectURL(file),
        newFilePath,
        file.type || "application/octet-stream"
      );

      const updatedOtherDocs = [
        ...(otherDocs || []),
        newFilePath,
      ];

      const updatedData = {
        password: undefined,
        confirmPassword: undefined,
        currentPassword: undefined,
        other_docs: [...updatedOtherDocs],
      };

      await axios.put(`/${userId}/user/${employeeId}`, updatedData);

      await fetchData()

      toast.success("File uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setLoading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };



  return (
    <div className="space-y-2">
      {loading ? (
        <Skeleton className="h-[50px] w-full" />
      ) : (
        <>
          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          <Popover>
            <PopoverTrigger asChild className="w-full flex gap-4">
              <Button variant={"outline"}>
                OTHER DOCS
                {files.length > 0 && (
                  <CheckCircle className="text-green-500" />
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-64 p-2">
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {files.length > 0
                    ? "Add More Files"
                    : "Upload File"}
                </Button>

                {files.length > 0 &&
                  <Button onClick={() => setOpen(true)} variant="ghost" className="justify-start">
                    See Files
                  </Button>
                }


              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Additional Files</DialogTitle>
          </DialogHeader>
          {files.length > 0 ?
            <ScrollArea className="h-[60vh] pr-4">
              <div className="flex flex-col gap-3">

                {files.map((file, index) => {
                  return (
                    <RenderEachFile key={index} file={file} employeeId={employeeId} otherDocs={otherDocs} setFiles={setFiles} userId={userId} />
                  );
                })
                }
              </div>
            </ScrollArea>
            :
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              No files uploaded
            </div>

          }


        </DialogContent>
      </Dialog>
    </div>
  );
}


const DocumentCard =
  ({ type, userID, docsData, employeeId, fetchData }: { type: string, userID: number, docsData: DocsDataType, employeeId: string | null, fetchData: () => Promise<void> }) => {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string | undefined>("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { state: OfficeState } = useContext(OfficeContext);
    const userId = userID;

    useEffect(() => {
      if (docsData?.[type as keyof typeof docsData]) {
        setLoading(true);
        const filePath = docsData[type as keyof typeof docsData];
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
            .catch((error) => console.error("Error loading file:", error))
            .finally(() => setLoading(false));
        }
      }
    }, [docsData]);

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
      const file = event?.target?.files?.[0];
      if (!file) return;

      setLoading(true);
      try {
        const extension = file.name.split(".").pop();
        const newFilePath = `${OfficeState.value.data}/${userId}/profile/${type}.${extension}`;

        // Step 1: Delete old file if exists
        if (docsData?.[type as keyof typeof docsData] && !docsData[type as keyof typeof docsData].includes("http")) {
          const oldFileRef = ref(storage, docsData[type as keyof typeof docsData]);
          await deleteObject(oldFileRef).catch((err) =>
            console.log("Old file could not be deleted:", err),
          );
        }

        // Step 2: Upload new file
        const uploadedPath = await UploadImage(
          URL.createObjectURL(file),
          newFilePath,
          file.type || "application/octet-stream",
        );

        const updatedData = {
          ...docsData,
          password: undefined,
          confirmPassword: undefined,
          currentPassword: undefined,
          [type]: newFilePath,
        };
        await axios.put(`/${userId}/user/${employeeId}`, updatedData);

        toast.success("File uploaded successfully");
        await fetchData();
        setFileUrl(URL.createObjectURL(file));
        setFileName(file.name);
      } catch (error) {
        toast.error("Upload failed");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-2">
        {loading ? (
          <Skeleton className="h-[50px] w-full" />
        ) : (
          <>
            <input
              type="file"
              accept="*"
              hidden
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <Popover>
              <PopoverTrigger asChild className="w-full flex gap-4">
                <Button variant={"outline"}>
                  {type?.replace("_", " ").toUpperCase()}{" "}
                  {fileUrl && <CheckCircle className="text-green-500" />}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-48 p-2">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {fileUrl ? "Reupload File" : "Upload File"}
                  </Button>

                  {fileUrl && (
                    <Button variant="ghost" className="justify-start" asChild>
                      <a
                        href={fileUrl}
                        download={fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download File
                      </a>
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    );
  }

const RenderEachFile = ({ file, userId, otherDocs, employeeId, setFiles }: {
  file: any, userId: number, otherDocs: string[], employeeId: string | null, setFiles: Dispatch<SetStateAction<{
    url: string;
    name: string;
    path: string;
  }[]>>
}) => {
  const [loading, setLoading] = useState(false)
  const cleanName = file.name.replace(/^\d+-/, "");

  const handleDelete = async (path: string) => {
    if (!userId || !employeeId) return
    try {
      setLoading(true);

      if (!path.includes("http")) {
        const fileRef = ref(storage, path);

        await deleteObject(fileRef).catch((err) =>
          console.log("Could not delete file from storage:", err)
        );
      }

      const updatedOtherDocs = otherDocs.filter(
        (item) => item !== path
      );

      const updatedData = {
        password: undefined,
        confirmPassword: undefined,
        currentPassword: undefined,
        other_docs: updatedOtherDocs,
      };

      await axios.put(`/${userId}/user/${employeeId}`, updatedData);
      setFiles((prev) => prev.filter((file) => file.path !== path));

      toast.success("File deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
   <div
  className="
    grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto]
    gap-4
    rounded-2xl border p-4
    hover:bg-muted/40 transition-colors
  "
>
  <a
    href={file.url}
    download={cleanName}
    target="_blank"
    rel="noopener noreferrer"
    className="min-w-0 flex flex-col"
  >
    <span
      className="
        text-sm font-medium leading-relaxed
        break-words
      "
    >
      {cleanName}
    </span>

    <span className="text-xs text-muted-foreground mt-1">
      Click to download
    </span>
  </a>

  <div
    className="
      flex flex-row sm:flex-col
      items-stretch
      gap-2
      w-full sm:w-auto
    "
  >
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="flex-1 sm:flex-none"
      asChild
    >
      <a
        href={file.url}
        download={cleanName}
        target="_blank"
        rel="noopener noreferrer"
      >
        Download
      </a>
    </Button>

    <Button
      type="button"
      size="sm"
      variant="destructive"
      className="flex-1 sm:flex-none"
      onClick={() => handleDelete(file.path)}
      disabled={loading}
    >
      <div className="flex items-center gap-2">
        {loading && <Spinner />}
        Delete
      </div>
    </Button>
  </div>
</div>
  )
}
