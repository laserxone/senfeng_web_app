"use client";
import AutoScrollMembers from "@/components/autoScroll";
import TeamTask from "@/components/teamTask";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Attendance from "@/components/users/attendance";
import { ProfilePicture } from "@/components/users/ProfilePicture";
import Reimbursement from "@/components/users/Reimbursement";
import SalaryRecord from "@/components/users/SalaryRecord";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import moment from "moment";
import { useCallback, useContext, useEffect, useState } from "react";
import "./styles.css";

export default function Page() {
  const [data, setData] = useState();
  const { state: UserState } = useContext(UserContext);
  const [reimbursementData, setReimbursementData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [activeTab, setActiveTab] = useState("attendance");

  useEffect(() => {
    if (UserState.value.data?.id) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
    
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
    }
  }, [UserState]);

  async function fetchReimbursementData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${UserState.value.data?.id}/reimbursement?start_date=${startDate}&end_date=${endDate}`
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
          `/${UserState.value.data.id}/attendance?start_date=${startDate}&end_date=${endDate}`
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
      .get(`/${UserState.value.data?.id}/dashboard`)
      .then((response) => {
        setData(response.data);
      });
  }

 
 

  const RenderReimbursement = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-2 flex flex-1">
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
       <Card className="flex flex-1">
        <CardContent className="pt-2 flex flex-1">
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
        
        <div className="flex justify-between mb-8 flex-wrap">
          <div className="flex items-center ">
            <ProfilePicture img={data?.user?.dp} name={data?.user?.name} />
            <div>
              <h1 className="text-3xl font-bold">{data?.user?.name}</h1>
              <p className="text-muted-foreground">{data?.user?.designation}</p>
            </div>
          </div>
        </div>

        <Tabs  className="relative flex w-full flex-1 flex-col"
          value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="justify-start">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>  
             <TabsTrigger value="task">Team Task</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
          </TabsList>

           <div className="flex flex-1 w-full mt-2">
          
            {activeTab === "reimbursement" && <RenderReimbursement />}
            {activeTab === "attendance" && <RenderAttendance />}
            {activeTab === "task" && (
              <Card className="flex flex-1">
                <CardContent className="pt-2 flex flex-1">
                  <TeamTask />
                </CardContent>
              </Card>
            )}
            {activeTab === "salary" && (
              <Card className="flex flex-1">
                <CardContent className="pt-2 flex flex-1">
                  <SalaryRecord id={UserState.value.data?.id} />
                </CardContent>
              </Card>
            )}
          </div>

         
        </Tabs>
      </div>

      <AutoScrollMembers />
    </div>
  );
}



