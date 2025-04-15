"use client";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { auth, storage } from "@/config/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserContext } from "@/store/context/UserContext";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadImage } from "@/lib/uploadFunction";
import moment from "moment";
import axios from "@/lib/axios";
import {
  updatePassword,
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/constants/data";
import { Textarea } from "../ui/textarea";
import Spinner from "../ui/spinner";

export default function ProfilePage() {
  const { state: UserState, setUser } = useContext(UserContext);

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
  const [docsData, setDocsData] = useState({
    cnic: "",
    education: "",
    police: "",
    resume: "",
    appointment_letter: "",
    father_cnic: "",
  });
  const inputRef = useRef();
  const { toast } = useToast();

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
    }
  }, [UserState]);

  const RenderProfilePicture = useCallback(() => {
    const [localImage, setLocalImage] = useState(null);
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

    const handleImage = async (event) => {
      setLoading(true);
      try {
        const fileList = Array.from(event.target.files);
        const name = `${UserState?.value?.data?.id}/profile/${UserState?.value?.data?.email}-dp.png`;
        const img = await UploadImage(URL.createObjectURL(fileList[0]), name);
        const response = await axios.put(
          `/user/${UserState.value.data.id}`,
          {
            ...formData,
            dp: name,
            password: undefined,
            confirmPassword: undefined,
            currentPassword: undefined,
          }
        );
        setUser({
          ...UserState.value.data,
          ...formData,
          dp: name,
          password: undefined,
          confirmPassword: undefined,
          currentPassword: undefined,
        });
        toast({ title: "Profile Updated" });
      } catch (error) {
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
              <AvatarImage src={localImage} />
              <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
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

  const DocumentCard = useCallback(
    ({ type }) => {
      const [fileUrl, setFileUrl] = useState(null);
      const [loading, setLoading] = useState(false);
      const [fileName, setFileName] = useState("");
      const fileInputRef = useRef();

      const userId = UserState?.value?.data?.id;
      const userEmail = UserState?.value?.data?.email;

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
      }, []);

      const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
          const extension = file.name.split(".").pop();
          const newFilePath = `${userId}/profile/${type}.${extension}`;

          // Step 1: Delete old file if exists
          if (docsData?.[type] && !docsData[type].includes("http")) {
            const oldFileRef = ref(storage, docsData[type]);
            await deleteObject(oldFileRef).catch((err) =>
              console.log("Old file could not be deleted:", err)
            );
          }

          // Step 2: Upload new file
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
          await axios.put(`/user/${userId}`, updatedData);

          setUser({
            ...UserState.value.data,
            ...updatedData,
          });

          toast({ title: "File uploaded successfully" });
          setFileUrl(URL.createObjectURL(file)); // Optional: for local preview
          setFileName(file.name);
        } catch (error) {
          console.error("Upload failed:", error);
          toast({ title: "Upload failed", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };

      const handleFileDelete = async () => {
        if (!docsData?.[type]) return;

        setLoading(true);
        try {
          // Step 1: Delete from storage if it's not a URL
          if (!docsData[type].includes("http")) {
            const fileRef = ref(storage, docsData[type]);
            await deleteObject(fileRef);
          }

          // Step 2: Update backend with empty string
          const updatedData = {
            ...docsData,
            password: undefined,
            confirmPassword: undefined,
            currentPassword: undefined,
            [type]: "",
          };
          await axios.put(`/user/${userId}`, updatedData);

          // Step 3: Update local state
          setUser({
            ...UserState.value.data,
            ...updatedData,
          });

          toast({ title: `${type} deleted successfully` });

          // Step 4: Reset local preview
          setFileUrl(null);
          setFileName("");
        } catch (error) {
          console.error("Delete failed:", error);
          toast({ title: "Delete failed", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="space-y-2">
          <Label className="font-semibold text-lg">
            {type?.replace("_", " ").toUpperCase()}
          </Label>

          {loading ? (
            <Skeleton className="h-[50px] w-full" />
          ) : (
            <div className="flex items-center space-x-4">
              {!fileUrl ? (
                <>
                  <input
                    type="file"
                    accept="*"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    Upload {type.replace("_", " ")}
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
                  <input
                    type="file"
                    accept="*"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  {/* <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-[180px]"
                  >
                    Update {type}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleFileDelete}
                    className="w-[180px]"
                  >
                    Delete {type}
                  </Button> */}
                </>
              )}
            </div>
          )}
        </div>
      );
    },
    [docsData]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  async function handleSave() {
    setFormLoading(true);

    try {
      const response = await axios.put(
        `/user/${UserState.value.data.id}`,
        {
          ...formData,
          password: undefined,
          confirmPassword: undefined,
          currentPassword: undefined,
        }
      );
      setUser({
        ...UserState.value.data,
        ...formData,
        password: undefined,
        confirmPassword: undefined,
        currentPassword: undefined,
      });
      toast({ title: "Profile Updated" });
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
      toast({
        variant: "destructive",
        title: "Password do not match",
      });
      return;
    }

    const user = auth.currentUser;
    if (user) {
      setPasswordLoading(true);
      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword
      );

      reauthenticateWithCredential(user, credential)
        .then(() => {
          updatePassword(user, formData.password).then(() => {
            handlePasswordResetToggle();
            toast({ title: "Password changed" });
            setFormData({
              ...formData,
              currentPassword: "",
              password: "",
              confirmPassword: "",
            });
          });
        })
        .catch((error) => {
          toast({ title: error?.message || "Error", variant: "destructive" });
          console.log(error);
        })
        .finally(() => {
          setPasswordLoading(false);
        });
    }
  };

  return (
    <div className="flex flex-1 flex-col flex-wrap">
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
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-1 flex-col space-y-4">
            <DocumentCard type={"cnic"} />
            <DocumentCard type={"father_cnic"} />
            <DocumentCard type={"police"} />
            <DocumentCard type={"education"} />
            <DocumentCard type={"resume"} />
            <DocumentCard type={"appointment_letter"} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
