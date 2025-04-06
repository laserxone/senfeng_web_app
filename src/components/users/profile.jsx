"use client";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "@/config/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserContext } from "@/store/context/UserContext";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadImage } from "@/lib/uploadFunction";
import moment from "moment";
import axios from "axios";
import {
  updatePassword,
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/constants/data";

export default function ProfilePage() {
  const { state: UserState, setUser } = useContext(UserContext);
  const [nameLoading, setNameLoading] = useState(true);
  const [isPasswordResetVisible, setIsPasswordResetVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    currentPassword: "",
    dp: "",
    cnic: "",
    education: "",
    police: "",
    resume: "",
    basic_salary: "",
    monthly_target: "",
    total_salary: "",
    designation: "",
    email: "",
  });
  const inputRef = useRef();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newKin, setNewKin] = useState("");
  const [numberLoading, setNumberLoading] = useState(true);
  const [kinLoading, setKinLoading] = useState(true);

  useEffect(() => {
    if (UserState?.value?.data?.id) {
      setFormData({
        name: UserState.value.data?.name || "",
        designation: UserState.value.data?.designation,
        number: UserState.value.data?.number || "",
        kin: UserState.value.data?.kin_number || "",
        password: "",
        confirmPassword: "",
        currentPassword: "",
        dp: UserState.value.data?.dp || "",
        cnic: UserState.value.data?.cnic || "",
        education: UserState.value.data?.education || "",
        police: UserState.value.data?.police || "",
        resume: UserState.value.data?.resume || "",
        basic_salary: UserState.value.data?.basic_salary || "",
        monthly_target: UserState.value.data?.monthly_target || "",
        total_salary: UserState.value.data?.total_salary || "",
        email: UserState.value.data?.email || "",
      });
      setNewName(UserState.value.data?.name || "");
      setNewNumber(UserState.value.data?.number || "");
      setNewKin(UserState.value.data?.kin_number || "");
    }
    setNameLoading(false);
    setNumberLoading(false);
    setKinLoading(false);
  }, [UserState]);

  const RenderProfilePicture = useCallback(() => {
    const [localImage, setLocalImage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (formData?.dp) {
        setLoading(true);
        try {
          if (formData?.dp?.includes("http")) {
            setLocalImage(formData?.dp);
          } else {
            const storageRef = ref(storage, formData?.dp);
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
        const response = await axios.post(
          `${BASE_URL}/user/${UserState.value.data.id}/profile`,
          {
            dp: name,
            cnic: formData.cnic,
            police: formData.police,
            education: formData.education,
            name: formData.name,
          }
        );
        setUser({
          ...UserState.value.data,
          dp: name,
          cnic: formData.cnic,
          police: formData.police,
          education: formData.education,
          name: formData.name,
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
  }, [formData]);

  const DocumentCard = useCallback(
    ({ type }) => {
      const [fileUrl, setFileUrl] = useState(null);
      const [loading, setLoading] = useState(false);
      const [fileName, setFileName] = useState("");
      const fileInputRef = useRef();

      const userId = UserState?.value?.data?.id;
      const userEmail = UserState?.value?.data?.email;

      useEffect(() => {
        if (formData?.[type]) {
          setLoading(true);
          const filePath = formData[type];
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
          if (formData?.[type] && !formData[type].includes("http")) {
            const oldFileRef = ref(storage, formData[type]);
            await deleteObject(oldFileRef).catch((err) =>
              console.warn("Old file could not be deleted:", err)
            );
          }

          // Step 2: Upload new file
          const uploadedPath = await UploadImage(
            URL.createObjectURL(file),
            newFilePath,
            file.type || "application/octet-stream"
          );

          const updatedData = { ...formData, [type]: newFilePath };
          await axios.post(`${BASE_URL}/user/${userId}/profile`, updatedData);

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
        if (!formData?.[type]) return;

        setLoading(true);
        try {
          // Step 1: Delete from storage if it's not a URL
          if (!formData[type].includes("http")) {
            const fileRef = ref(storage, formData[type]);
            await deleteObject(fileRef);
          }

          // Step 2: Update backend with empty string
          const updatedData = { ...formData, [type]: "" };
          await axios.post(`${BASE_URL}/user/${userId}/profile`, updatedData);

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
          <Label className="font-semibold text-lg">{type?.toUpperCase()}</Label>

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
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                    Upload {type}
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
                  <Button
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
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      );
    },
    [formData, UserState]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  async function handleSaveName() {
    if (UserState.value.data?.name !== newName) {
      setNameLoading(true);
    }

    if (UserState.value.data?.number !== newNumber) {
      setNumberLoading(true);
    }
    if (UserState.value.data?.kin_number !== newKin) {
      setKinLoading(true);
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/user/${UserState.value.data.id}/profile`,
        {
          dp: formData.dp,
          cnic: formData.cnic,
          police: formData.police,
          education: formData.education,
          resume: formData.resume,
          name: newName,
          number: newNumber,
          kin_number: newKin,
        }
      );
      setUser({
        ...UserState.value.data,
        name: newName,
        number: newNumber,
        kin_number: newKin,
      });
      toast({ title: "Profile Updated" });
    } catch (error) {
    } finally {
      setNameLoading(false);
      setKinLoading(false);
      setNumberLoading(false);
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
      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword
      );

      reauthenticateWithCredential(user, credential)
        .then(() => {
          updatePassword(user, formData.password)
            .then(() => {
              handlePasswordResetToggle();
            })
            .catch((error) => {});
        })
        .catch((error) => {
          console.log(error);
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
                <Button onClick={handlePasswordUpdate}>Update Password</Button>
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
              <Label>Display name</Label>
              {nameLoading ? (
                <Skeleton className={"w-full h-[50px]"} />
              ) : (
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter your name"
                />
              )}

              <Label>Designation</Label>
              <Input
                value={formData.designation}
                onChange={handleChange}
                disabled={true}
              />

              <Label>Phone Number</Label>
              {numberLoading ? (
                <Skeleton className={"w-full h-[50px]"} />
              ) : (
                <Input
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="Enter your number"
                />
              )}

              <Label>Kinship Number</Label>
              {kinLoading ? (
                <Skeleton className={"w-full h-[50px]"} />
              ) : (
                <Input
                  value={newKin}
                  onChange={(e) => setNewKin(e.target.value)}
                  placeholder="Enter your kinship number"
                />
              )}
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={handleChange}
                disabled={true}
              />
              <div className="w-full flex gap-2">
                <div className="flex flex-col flex-1 gap-3">
                  <Label>Basic salary</Label>
                  <Input
                    value={formData.basic_salary}
                    onChange={handleChange}
                    disabled={true}
                  />
                </div>
                <div className="flex flex-col flex-1 gap-3">
                  <Label>Monthly target</Label>
                  <Input
                    value={formData.monthly_target}
                    onChange={handleChange}
                    disabled={true}
                  />
                </div>
                <div className="flex flex-col flex-1 gap-3">
                  <Label>Total salary</Label>
                  <Input
                    value={formData.total_salary}
                    onChange={handleChange}
                    disabled={true}
                  />
                </div>
              </div>

              {(UserState.value.data?.name !== newName ||
                UserState.value.data?.number !== newNumber ||
                UserState.value.data?.kin_number !== newKin) && (
                <Button onClick={handleSaveName}>Save</Button>
              )}
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
            <DocumentCard type={"police"} />
            <DocumentCard type={"education"} />
            <DocumentCard type={"resume"} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
