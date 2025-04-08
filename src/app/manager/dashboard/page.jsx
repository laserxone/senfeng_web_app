"use client";
import AutoScrollMembers from "@/components/autoScroll";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Attendance from "@/components/users/attendance";
import Reimbursement from "@/components/users/Reimbursement";
import { BASE_URL } from "@/constants/data";
import { GetProfileImage } from "@/lib/getProfileImage";
import { UserContext } from "@/store/context/UserContext";
import axios from "axios";
import moment from "moment";
import { useCallback, useContext, useEffect, useState } from "react";
import "./styles.css";
import SalaryRecord from "@/components/users/SalaryRecord";

export default function Page() {
  const [data, setData] = useState();
  const { state: UserState } = useContext(UserContext);
  const [customers, setCustomers] = useState([]);
  const [reimbursementData, setReimbursementData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);

  useEffect(() => {
    if (UserState.value.data?.id) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
      fetchAllCustomers();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
    }
  }, [UserState]);

  async function fetchReimbursementData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `${BASE_URL}/user/${UserState.value.data?.id}/reimbursement?start_date=${startDate}&end_date=${endDate}`
        )
        .then((response) => {
          setReimbursementData(response.data);
          resolve(true);
        })
        .catch((e) => {
          console.log(e);
          reject(null);
        });
    });
  }

  async function fetchAttendanceData(startDate, endDate) {
    return new Promise((res, rej) => {
      axios
        .get(
          `${BASE_URL}/user/${UserState.value.data.id}/attendance?start_date=${startDate}&end_date=${endDate}`
        )
        .then((response) => {
          if (response.data.length > 0) {
            const apiData = response.data.map((item) => {
              return {
                ...item,
                date: item?.time_in,
                status: item?.time_in ? "Present" : "Absent",
              };
            });
            setAttendanceData(apiData);
          }
          res(true);
        })
        .catch((e) => {
          console.log(e);
          rej(null);
        });
    });
  }

  async function fetchData() {
    axios
      .get(`${BASE_URL}/user/${UserState.value.data?.id}`)
      .then((response) => {
        setData(response.data);
      });
  }

  async function fetchAllCustomers() {
    axios.get(`${BASE_URL}/customer`).then((response) => {
      setCustomers(response.data);
    });
  }
 

  const RenderReimbursement = useCallback(() => {
    return (
      <Card>
        <CardContent className="pt-5">
          <Reimbursement
            id={UserState.value.data?.id}
            passingData={reimbursementData || []}
            onAddRefresh={(temp) => setReimbursementData([...temp])}
            onFilterReturn={async (start, end) =>
              await fetchReimbursementData(start, end)
            }
          />
        </CardContent>
      </Card>
    );
  }, [reimbursementData]);

  const RenderAttendance = useCallback(() => {
    return (
      <Card>
        <CardContent className="pt-2">
          <Attendance
            passingData={attendanceData}
            onFilterReturn={async (start, end) =>
              await fetchAttendanceData(start, end)
            }
          />
        </CardContent>
      </Card>
    );
  }, [attendanceData]);

  return (
    <div className="flex flex-1 gap-5">
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 justify-between mb-8 flex-wrap">
          <div className="flex items-center ">
            <ProfilePicture img={data?.user?.dp} name={data?.user?.name} />
            <div>
              <h1 className="text-3xl font-bold">{data?.user?.name}</h1>
              <p className="text-muted-foreground">{data?.user?.designation}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="attendance" className="w-full flex flex-1 flex-col">
          <TabsList className="justify-start">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>  
            <TabsTrigger value="salary">Salary</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <RenderAttendance />
          </TabsContent>
          <TabsContent value="reimbursement">
            <RenderReimbursement />
          </TabsContent>
          <TabsContent value="salary">
            <Card>
              <CardContent className="pt-2">
                <SalaryRecord />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

     {customers.length > 0 && <AutoScrollMembers customers={customers} />}
    </div>
  );
}

const ProfilePicture = ({ img, name }) => {
  const [localImage, setLocalImage] = useState(null);

  useEffect(() => {
    async function fetchImage() {
      if (img?.includes("http")) {
        setLocalImage(img);
      } else {
        const imgResult = await GetProfileImage(img);
        setLocalImage(imgResult);
      }
    }

    if (img) {
      fetchImage();
    }
  }, [img]);

  return (
    <Avatar className="w-24 h-24 mr-4">
      <AvatarImage src={localImage} alt="Profile Picture" />
      <AvatarFallback>{name?.substring(0, 2)}</AvatarFallback>
    </Avatar>
  );
};