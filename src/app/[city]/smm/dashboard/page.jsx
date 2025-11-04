"use client";
import AutoScrollMembers from "@/components/autoScroll";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Attendance from "@/components/users/attendance";
import CustomerEmployee from "@/components/users/customer";
import { CustomerExtraData } from "@/components/users/ExtraData";
import { ProfilePicture } from "@/components/users/ProfilePicture";
import Reimbursement from "@/components/users/Reimbursement";
import SalaryRecord from "@/components/users/SalaryRecord";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import "./styles.css";
import RenderFines from "@/components/users/render-fines";
import OldRecordSheet from "@/components/users/old-record-sheet";

export default function Page() {
  const [data, setData] = useState();
  const [extraData, setExtraData] = useState({});
  const [selectedOption, setSelectedOption] = useState("thisMonth");
  const [oldRecordVisible, setOldRecordVisible] = useState(false)
  const [reimbursementData, setReimbursementData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [activeTab, setActiveTab] = useState("newCustomers");
  const { userID } = useUserDetail();

  useEffect(() => {
    if (userID) {
      const startDate = moment().startOf("month").toISOString();
      const endDate = moment().endOf("month").toISOString();
      fetchData();
      fetchExtraCustomerOptions();
      fetchReimbursementData(startDate, endDate);
      fetchAttendanceData(startDate, endDate);
    }
  }, [userID]);

  async function fetchReimbursementData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${userID}/reimbursement?start_date=${startDate}&end_date=${endDate}`
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
          `/${userID}/attendance?start_date=${startDate}&end_date=${endDate}`
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
    axios.get(`/${userID}/dashboard`).then((response) => {
      setData(response.data);
    });
  }

  async function fetchExtraCustomerOptions() {
    axios.get(`/${userID}/dashboard/group`).then((response) => {
      setExtraData(response.data);
    });
  }

  const RenderNewCustomer = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-5 flex flex-1">
          <div className="flex flex-1 gap-5">
            <CustomerExtraData
              data={extraData || {}}
              option={selectedOption}
              onSelect={(val) => {
                if (val === "record") {
                  setOldRecordVisible(true);
                } else {
                  setSelectedOption(val);
                }
              }}
            />
            <CustomerEmployee
              totalCustomerText={"Total Customers"}
              user_id={null}
              ownership={true}
              customer_data={
                extraData && selectedOption ? extraData[selectedOption] : []
              }
              onRefresh={() => fetchExtraCustomerOptions()}
            />
          </div>
        </CardContent>
      </Card>
    );
  }, [userID, data, extraData, selectedOption]);

  const RenderReimbursement = useCallback(() => {
    return (
      <Card className="flex flex-1">
        <CardContent className="pt-5 flex flex-1">
          <Reimbursement
            id={userID}
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
        <CardContent className="pt-5 flex flex-1">
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

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex w-full flex-1 flex-col"
        >
          <TabsList className="justify-start">
            <TabsTrigger value="newCustomers">New Customers</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
            <TabsTrigger value="fines">Fines</TabsTrigger>
          </TabsList>

          <div className="flex flex-1 w-full mt-2">
            {activeTab === "newCustomers" && <RenderNewCustomer />}
            {activeTab === "reimbursement" && <RenderReimbursement />}
            {activeTab === "attendance" && <RenderAttendance />}
            {activeTab === "salary" && (
              <Card className="flex flex-1">
                <CardContent className="pt-2 flex flex-1">
                  <SalaryRecord id={userID} />
                </CardContent>
              </Card>
            )}
            {activeTab === 'fines' && <RenderFines />}
          </div>
        </Tabs>
      </div>

      <OldRecordSheet
        visible={oldRecordVisible}
        onClose={setOldRecordVisible}
        user_id={userID}
      />
      <AutoScrollMembers />
    </div>
  );
}
