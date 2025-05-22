"use client";
import { useContext, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Heading } from "@/components/ui/heading";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { UserContext } from "@/store/context/UserContext";
import axios from "@/lib/axios";
import AppCalendar from "@/components/appCalendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import moment from "moment";

export default function NewsPage() {
  const [newsList, setNewsList] = useState([]);
  const [newsText, setNewsText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { state: UserState } = useContext(UserContext);

  useEffect(() => {
    if (UserState.value.data?.id) {
      fetchData();
    }
  }, [UserState]);

  async function fetchData() {
    setLoading(true);

    try {
      axios.get("/news").then((response) => {
        console.log(response.data);
        setNewsList(response.data);
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const addNews = async () => {
    if (!newsText || !startDate || !endDate)
      return alert("All fields required");
    setLoading(true);
    try {
      axios
        .post("/news", {
          news: newsText,
          start_date: startDate,
          end_date: endDate,
        })
        .then(async () => {
          await fetchData();
        });
    } catch (err) {
      console.log("Submit Error:", err);
    } finally {
      setNewsText("");
      setStartDate("");
      setEndDate("");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col space-y-6 p-4">
      <Heading title="News" description="Manage all news updates" />

      {/* Form */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border space-y-4">
        <div>
          <Label htmlFor="news">News Text</Label>
          <Textarea
            id="news"
            value={newsText}
            onChange={(e) => setNewsText(e.target.value)}
            placeholder="Enter news"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="start_date">Start Date</Label>
            <AppCalendar date={startDate} onChange={setStartDate} />
          </div>

          <div className="flex-1">
            <Label htmlFor="end_date">End Date</Label>
            <AppCalendar date={endDate} onChange={setEndDate} />
          </div>
        </div>

        <Button onClick={addNews} disabled={loading}>
          {loading ? "Saving..." : "Submit News"}
        </Button>
      </div>

      {/* News List */}
      <ScrollArea className="h-[calc(100dvh-450px)] pr-4">
      <div className="space-y-4">
        {newsList.length > 0 ? (
          newsList.map((item) => (
           <Card key={item.id}>
              <CardContent className="p-4">
                <p className="font-medium mb-1">{item.news}</p>
                <div className="text-sm text-gray-500">
                  Start {moment(item.start_date).format("YYYY-MM-DD")} -{" "}
                  End {moment(item.end_date).format("YYYY-MM-DD")}
                </div>
              </CardContent>
            </Card>
            
          ))
        ) : (
          <div className="text-gray-500 text-center">No news available</div>
        )}
      </div>
      </ScrollArea>
    </div>
  );
}
