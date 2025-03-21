"use client";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
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
    basic_salary: "",
    monthly_target: "",
    total_salary: "",
    designation: "",
    email: "",
  });
  const inputRef = useRef();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (UserState?.value?.data?.id) {
      setFormData({
        name: UserState.value.data?.name,
        designation: UserState.value.data?.designation,
        password: "",
        confirmPassword: "",
        currentPassword: "",
        dp: UserState.value.data?.dp,
        cnic: UserState.value.data?.cnic,
        education: UserState.value.data?.education,
        police: UserState.value.data?.police,
        basic_salary: UserState.value.data?.basic_salary,
        monthly_target: UserState.value.data?.monthly_target,
        total_salary: UserState.value.data?.total_salary,
        email: UserState.value.data?.email,
      });
      setNewName(UserState.value.data?.name);
    }
    setNameLoading(false);
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
      const [localImage, setLocalImage] = useState(null);
      const [loading, setLoading] = useState(false); // Track loading state
      const localRef = useRef();

      useEffect(() => {
        if (formData?.[type]) {
          setLoading(true);
          if (formData?.[type].includes("http")) {
            setLocalImage(formData?.[type]);
            setLoading(false);
          } else {
            const storageRef = ref(storage, formData?.[type]);
            getDownloadURL(storageRef)
              .then((url) => {
                setLocalImage(url);
              })
              .catch((error) => console.error("Error loading image:", error))
              .finally(() => setLoading(false));
          }
        }
      }, []);

      const handleOtherPicture = async (event) => {
        setLoading(true);
        try {
          const fileList = Array.from(event.target.files);
          const name = `${UserState?.value?.data?.id}/profile/${UserState?.value?.data?.email}-${type}.png`;
          const img = await UploadImage(URL.createObjectURL(fileList[0]), name);

          let localData = { ...formData, [type]: name };
          const response = await axios.post(
            `${BASE_URL}/user/${UserState.value.data.id}/profile`,
            localData
          );

          setUser({
            ...UserState.value.data,
            ...localData,
          });

          toast({ title: "Profile Updated" });
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

      return (
        <>
          <Label className="text-bold text-[20px]">{type?.toUpperCase()}</Label>
          {loading ? (
            <Skeleton className="h-[200px] w-[200px]" />
          ) : localImage ? (
            <img src={localImage} className="h-[200px] w-[200px] hover:cursor-pointer" onClick={() => localRef.current?.click()}/>
          ) : (
            <div
              className="h-[200px] w-[200px] flex items-center justify-center 
                       bg-blue-100 border border-blue-300 rounded-lg 
                       shadow-md cursor-pointer hover:bg-blue-200 transition-all"
              onClick={() => localRef.current?.click()}
            >
              <Label className="text-blue-600 text-sm font-medium text-center hover:cursor-pointer">
                Upload {type.toUpperCase()} Picture
              </Label>
            </div>
          )}

          <input
            style={{ display: "none" }}
            ref={localRef}
            type="file"
            accept="image/*"
            multiple={false}
            onChange={handleOtherPicture}
          />
        </>
      );
    },
    [formData, UserState]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  async function handleSaveName() {
    setNameLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/user/${UserState.value.data.id}/profile`,
        {
          dp: formData.dp,
          cnic: formData.cnic,
          police: formData.police,
          education: formData.education,
          name: newName,
        }
      );
      setUser({
        ...UserState.value.data,
        name: newName,
      });
      toast({ title: "Profile Updated" });
    } catch (error) {
    } finally {
      setNameLoading(false);
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
            <div className="flex flex-col gap-5">
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
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={handleChange}
                disabled={true}
              />
              <Label>Basic salary</Label>
              <Input
                value={formData.basic_salary}
                onChange={handleChange}
                disabled={true}
              />
              <Label>Monthly target</Label>
              <Input
                value={formData.monthly_target}
                onChange={handleChange}
                disabled={true}
              />
              <Label>Total salary</Label>
              <Input
                value={formData.total_salary}
                onChange={handleChange}
                disabled={true}
              />
              {UserState.value.data?.name !== newName && (
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
          <div className="flex flex-1 flex-wrap gap-10">
            <DocumentCard type={"cnic"} />
            <DocumentCard type={"police"} />
            <DocumentCard type={"education"} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
