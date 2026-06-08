"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, storage } from "@/config/firebase";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { UserContext } from "@/store/context/UserContext";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { deleteObject, getDownloadURL, ref } from "firebase/storage";
import { CheckCircle } from "lucide-react";
import { ChangeEvent, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import Spinner from "../ui/spinner";
import { Textarea } from "../ui/textarea";

type DocsDataType = {
  cnic: string;
  education: string;
  police: string;
  resume: string;
  appointment_letter: string;
  father_cnic: string;
}

export default function ProfilePage() {
  const { state: UserState, setUser } = useContext(UserContext);
  const { userID } = useUserDetail();
  const { state: OfficeState } = useContext(OfficeContext)!
  const [isPasswordResetVisible, setIsPasswordResetVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    father: "",
    number: "",
    official_number: "",
    kin_number: "",
    address: "",
    pin: "",
    password: "",
    confirmPassword: "",
    currentPassword: "",
    dp: "",
    basic_salary: "",
    monthly_target: "",
    total_salary: "",
    designation: "",
    email: "",
  });
  const [docsData, setDocsData] = useState<DocsDataType>({
    cnic: "",
    education: "",
    police: "",
    resume: "",
    appointment_letter: "",
    father_cnic: "",
  });
  const [otherDocs, setOtherDocs] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null);


  const [dp, setDp] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (UserState.value.data?.id) {
      const u = UserState.value.data;
      setFormData({
        name: u.name || "",
        father: u.father || "",
        number: u.number || "",
        official_number: u.official_number || "",
        kin_number: u.kin_number || "",
        address: u.address || "",
        pin: u.pin || "",
        password: "",
        confirmPassword: "",
        currentPassword: "",

        basic_salary: u.basic_salary || "",
        monthly_target: u.monthly_target || "",
        total_salary: u.total_salary || "",
        designation: u.designation || "",
        email: u.email || "",
        dp: u.dp || "",
      });
      setDp(u.dp || "");
      setDocsData({
        cnic: u.cnic || "",
        education: u.education || "",
        police: u.police || "",
        resume: u.resume || "",
        appointment_letter: u.appointment_letter || "",
        father_cnic: u.father_cnic || "",
      });
      setOtherDocs(u.other_docs || [])
    }
  }, [UserState.value.data]);



  const RenderProfilePicture = useCallback(() => {
    const [localImage, setLocalImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (dp) {
        setLoading(true);
        try {
          if (dp?.includes("http")) {
            setLocalImage(dp);
          } else {
            const storageRef = ref(storage, dp);
            getDownloadURL(storageRef).then((url) => {
              setLocalImage(url);
            });
          }
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      }
    }, []);

    const handleImage = async (event: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
      if (!event.target.files) return
      setLoading(true);
      try {
        const fileList = Array.from(event.target.files);
        const name = `${OfficeState.value.data}/${userID}/profile/${UserState.value.data?.email}-dp.png`;
        const img = await UploadImage(URL.createObjectURL(fileList[0]), name);
        const response = await axios.put(`/${userID}`, {
          ...formData,
          dp: name,
          password: undefined,
          confirmPassword: undefined,
          currentPassword: undefined,
        });
        if (UserState.value.data?.id) {
          setUser({
            ...UserState.value.data,
            ...formData,
            dp: name,
          });
        }

        toast.success("Profile Updated");
      } catch (error: any) {
        toast.error(error?.message || "Error updating image")
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <div className="flex items-center space-x-4">
          {loading ? (
            <Skeleton className="h-[350px] w-[350px]" />
          ) : (
            <Avatar
              className="h-[350px] w-[350px] hover : cursor-pointer"
              onClick={() => {
                if (inputRef.current) inputRef.current.click();
              }}
            >
              <AvatarImage src={localImage || ""} />
              <AvatarFallback>{UserState.value.data?.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
          )}
        </div>
        <input
          style={{ display: "none" }}
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={false}
          onChange={(e) => handleImage(e)}
        ></input>
      </>
    );
  }, [dp]);

  const handleChange = (e: ChangeEvent<HTMLInputElement, HTMLInputElement> | ChangeEvent<HTMLTextAreaElement, HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  async function handleSave() {
    setFormLoading(true);

    try {
      const response = await axios.put(`/${userID}`, {
        ...formData,
        password: undefined,
        confirmPassword: undefined,
        currentPassword: undefined,
      });
      if (UserState.value.data?.id) {
        setUser({
          ...UserState.value.data,
          ...formData,

        });
      }

      toast.success("Profile Updated");
    } catch (error) {
    } finally {
      setFormLoading(false);
    }
  }

  const handlePasswordResetToggle = () =>
    setIsPasswordResetVisible(!isPasswordResetVisible);

  const handlePasswordUpdate = async () => {
    if (!formData.password || !formData.confirmPassword) {
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.info("Password do not match");
      return;
    }

    const user = auth.currentUser;
    if (user?.email) {
      setPasswordLoading(true);
      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword
      );

      reauthenticateWithCredential(user, credential)
        .then(() => {
          updatePassword(user, formData.password).then(() => {
            handlePasswordResetToggle();
            toast.success("Password changed");
            setFormData({
              ...formData,
              currentPassword: "",
              password: "",
              confirmPassword: "",
            });
          });
        })
        .catch((error) => {
          toast.error(error?.message || "Error");
          console.log(error);
        })
        .finally(() => {
          setPasswordLoading(false);
        });
    }
  };

  return (
    <div className="flex flex-1 flex-col flex-wrap pb-4">
      <div className="flex flex-1 flex-wrap gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <RenderProfilePicture />
            {isPasswordResetVisible ? (
              <div className="flex flex-col gap-5">
                <div>
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button onClick={handlePasswordUpdate}>
                  {passwordLoading && <Spinner />}Update Password
                </Button>
              </div>
            ) : (
              <Button
                className="w-full mt-5"
                onClick={handlePasswordResetToggle}
              >
                Change Password
              </Button>
            )}
          </CardContent>
        </Card>
        <Card className="flex flex-1 flex-col py-5">
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex flex-row w-full gap-5">
                <div className="flex flex-1 flex-col space-y-2">
                  <Label>Display name</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="flex flex-1 flex-col space-y-2">
                  <Label>Father's name</Label>
                  <Input
                    name="father"
                    value={formData.father}
                    onChange={handleChange}
                    placeholder="Enter your father's name"
                  />
                </div>
              </div>

              <Label>Designation</Label>
              <Input
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                disabled
              />

              <div className="flex flex-row w-full gap-5">
                <div className="flex flex-1 flex-col space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="Enter your number"
                  />
                </div>
                <div className="flex flex-1 flex-col space-y-2">
                  <Label>Official Number</Label>
                  <Input
                    name="official_number"
                    value={formData.official_number}
                    onChange={handleChange}
                    placeholder="Enter your official number"
                  />
                </div>
                <div className="flex flex-1 flex-col space-y-2">
                  <Label>Kinship Number</Label>
                  <Input
                    name="kin_number"
                    value={formData.kin_number}
                    onChange={handleChange}
                    placeholder="Enter your kinship number"
                  />
                </div>
              </div>

              <Label>Email</Label>
              <Input
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
              />

              <div className="w-full flex gap-2">
                <div className="flex flex-col flex-1 gap-3">
                  <Label>Basic salary</Label>
                  <Input
                    name="basic_salary"
                    value={formData.basic_salary}
                    onChange={handleChange}
                    disabled
                  />
                </div>
                <div className="flex flex-col flex-1 gap-3">
                  <Label>Monthly target</Label>
                  <Input
                    name="monthly_target"
                    value={formData.monthly_target}
                    onChange={handleChange}
                    disabled
                  />
                </div>
                <div className="flex flex-col flex-1 gap-3">
                  <Label>Total salary</Label>
                  <Input
                    name="total_salary"
                    value={formData.total_salary}
                    onChange={handleChange}
                    disabled
                  />
                </div>
              </div>

              <Label>Address</Label>
              <Textarea
                placeholder="Enter your address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />

              <Label>Home google pin location</Label>
              <Input
                name="pin"
                placeholder="Enter your google pin location"
                value={formData.pin}
                onChange={handleChange}
              />

              <Button onClick={handleSave}>
                {formLoading && <Spinner />}Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {UserState.value.data?.designation !== "Dealer" && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ">
              <DocumentCard type={"cnic"} userID={userID} docsData={docsData} />
              <DocumentCard type={"father_cnic"} userID={userID} docsData={docsData} />
              <DocumentCard type={"police"} userID={userID} docsData={docsData} />
              <DocumentCard type={"education"} userID={userID} docsData={docsData} />
              <DocumentCard type={"resume"} userID={userID} docsData={docsData} />
              <DocumentCard type={"appointment_letter"} userID={userID} docsData={docsData} />
              <DocumentCard type={"appointment_letter"} userID={userID} docsData={docsData} />
              <DocumentCardOther userID={userID} otherDocs={otherDocs} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


const DocumentCard =
  ({ type, userID, docsData }: { type: keyof DocsDataType, userID: number | string, docsData: DocsDataType }) => {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string | undefined>("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { state: UserState, setUser } = useContext(UserContext)
    const { state: OfficeState } = useContext(OfficeContext)!
    const userId = userID;

    useEffect(() => {
      if (docsData?.[type]) {
        setLoading(true);
        const filePath = docsData[type];
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


        if (docsData?.[type] && !docsData[type].includes("http")) {
          const oldFileRef = ref(storage, docsData[type]);
          await deleteObject(oldFileRef).catch((err) =>
            console.log("Old file could not be deleted:", err)
          );
        }


        const uploadedPath = await UploadImage(
          URL.createObjectURL(file),
          newFilePath,
          file.type || "application/octet-stream"
        );

        const updatedData = {
          ...docsData,
          password: undefined,
          confirmPassword: undefined,
          currentPassword: undefined,
          [type]: newFilePath,
        };
        await axios.put(`/${userId}`, updatedData);
        if (UserState.value.data?.id) {

          setUser({
            ...UserState.value.data,
            ...updatedData,
          });
        }

        toast.success("File uploaded successfully");
        setFileUrl(URL.createObjectURL(file))
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
                  {!fileUrl &&
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {"Upload File"}
                    </Button>
                  }

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


const DocumentCardOther = ({ userID, otherDocs }: { userID: number | string, otherDocs: string[] }) => {
  const [files, setFiles] = useState<
    {
      url: string;
      name: string;
      path: string;
    }[]
  >([]);

  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { state: UserState, setUser } = useContext(UserContext)
  const { state: OfficeState } = useContext(OfficeContext)!
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

      await axios.put(`/${userId}`, updatedData);
      if (UserState.value.data?.id) {
        setUser({
          ...UserState.value.data,
          ...updatedData,
        });

      }

      setFiles((prev) => [
        ...prev,
        {
          url: URL.createObjectURL(file),
          name: file.name,
          path: newFilePath,
        },
      ]);

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
                  const cleanName = file.name.replace(/^\d+-/, "");

                  return (
                    <a
                      key={index}
                      href={file.url}
                      download={cleanName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                  flex items-center justify-between gap-3
                  rounded-xl border p-3
                  hover:bg-muted/50 transition-colors
                "
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium truncate">
                          {cleanName}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          Click to download
                        </span>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="shrink-0"
                      >
                        Download
                      </Button>
                    </a>
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
