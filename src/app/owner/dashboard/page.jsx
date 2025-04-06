"use client";
import { AreaStats } from "@/components/charts/area_stats/page";
import { BarStats } from "@/components/charts/bar_stats/page";
import { Stats } from "@/components/charts/pie_stats/page";
import { Sale } from "@/components/charts/sales/page";
import { CustomerMapComponent } from "@/components/customerMapComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BASE_URL, PakCities } from "@/constants/data";
import { MapProvider } from "@/providers/map-provider";
import { UserContext } from "@/store/context/UserContext";
import axios from "axios";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";

export default function Page() {
  const [customers, setCustomers] = useState([]);
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  const { state: UserState } = useContext(UserContext);

  useEffect(() => {
    if (UserState?.value?.data?.id) {
      fetchCustomerList();
      fetchDashboardData();
    }
  }, [UserState?.value?.data]);

  async function fetchDashboardData() {
    axios
      .get(`${BASE_URL}/dashboard`)
      .then((response) => {
        console.log(response.data)
        setData(response.data);
      })
      .catch((e) => console.log(e))
      .finally(() => {
        setLoading(false);
      });
  }

  async function fetchCustomerList() {
    try {
      let list1 = [];
      axios.get(`${BASE_URL}/customer`).then((response) => {
        const customerList = response.data;
        const newArray = mergeArrays(customerList, PakCities);
    
        setCustomers(newArray);
      });
    } catch (error) {
      console.log(error);
    }
  }

  function mergeArrays(array1, array2) {
    return array1
      .map((obj1) => {
        const matchingCity = array2.find((obj2) => obj2.name === obj1.location);

        if (matchingCity) {
          return {
            ...obj1,
            latitude: matchingCity.lat,
            longitude: matchingCity.lng,
          };
        } else {
          return null;
        }
      })
      .filter(Boolean);
  }

  return (
    <div className="flex flex-1 flex-col space-y-2">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Hi, Welcome back 👋
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments This Month
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.total_payment_this_month
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PKR",
                    }).format(data?.total_payment_this_month || 0)
                  : ""}
              </div>
            )}
            {loading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <p className="text-xs text-muted-foreground">
                {data?.payment_change_percentage}% from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Machines Sold This Month
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.total_machines_sold_this_month}
              </div>
            )}
            {loading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <p className="text-xs text-muted-foreground">
                {data?.machines_sold_change_percentage}% from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Customers This Month
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.total_new_customers_this_month}
              </div>
            )}
            {loading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <p className="text-xs text-muted-foreground">
                {data?.new_customer_change_percentage}% from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <Link href={"/owner/inventory"}>
                <div className="text-2xl font-bold hover:underline cursor-pointer">
                  {data?.total_low_stock}
                </div>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <BarStats data={data?.machines_sold_last_3_months || []} />
          )}
        </div>
        <div className="col-span-4 md:col-span-3">
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <Sale data={data?.recent_sales || []} />
          )}
        </div>
        <div className="col-span-4">
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <AreaStats data={data?.feedback_status_last_6_months || []} />
          )}
        </div>
        <div className="col-span-4 md:col-span-3">
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <Stats
              industryData={
                data?.industry_count?.filter((item) => item.industry) || []
              }
            />
          )}
        </div>
      </div>

      <div className="mb-5">
        {loading ? (
          <Skeleton className="h-96" />
        ) : (
          customers.length > 0 && (
            <MapProvider>
              <CustomerMapComponent data={customers} />
            </MapProvider>
          )
        )}
      </div>
    </div>
  );
}
