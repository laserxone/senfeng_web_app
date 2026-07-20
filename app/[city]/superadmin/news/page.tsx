"use client";
import AppCalendar from "@/components/features/calendar/app-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Heading from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { News } from "@/lib/types";
import { Trash } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";

export default function NewsPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [newsText, setNewsText] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail()


  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/news`);
      setNewsList(response.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNews = async () => {
    setLoading(true);
    try {
      await axios.post(`/${userID}/news`, {
        news: newsText,
        start_date: startDate,
        end_date: endDate,
      });

      await fetchData();
      setNewsText("");
      setStartDate(null);
      setEndDate(null);
    } catch (error) {
      console.error("Submit Error:", error);
    } finally {
      setLoading(false);
    }
  };

  async function handleDelete(id: number) {
    try {
      await axios.delete(`/${userID}/news/${id}`);
      await fetchData();
    } catch (error) {
      console.error("Submit Error:", error);
    }
  }


  return (
    <div className="flex flex-1 flex-col space-y-6">
      <Heading title="News" description="Manage all news updates" />

      {/* Form */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border space-y-4">
        <div>
          <Label htmlFor="news" className="pb-2">News Text</Label>
          <Textarea
            id="news"
            value={newsText}
            onChange={(e) => setNewsText(e.target.value)}
            placeholder="Enter news"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <AppCalendar date={startDate} onChange={(d)=>{
              setStartDate(moment(d).startOf("day").toDate())}} max={""}/>
          </div>

          <div className="flex-1 space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <AppCalendar date={endDate} onChange={(d)=>{
              
              setEndDate(moment(d).endOf("day").toDate())}} max={""}/>
          </div>
        </div>

        <Button
          onClick={addNews}
          disabled={loading || !newsText || !startDate || !endDate}
        >
          {loading && <Spinner />} Submit News
        </Button>
      </div>

      {/* News List */}
     
        <div className="space-y-4">
          {newsList.length > 0 ? (
            newsList.map((item) => <RenderEachRow key={item.id} item={item} handleDelete={handleDelete} />)
          ) : (
            <div className="text-gray-500 text-center">No news available</div>
          )}
        </div>
   
    </div>
  );
}

const RenderEachRow = ({ item, handleDelete }: { item: News, handleDelete: (id: number) => Promise<void> }) => {

  const [deleteLoading, setDeleteLoading] = useState(false);



  return (
    <Card >
      <CardContent className="flex flex-row justify-between p-4">
        <div className="flex flex-col flex-1 pr-2">
          <p className="font-medium mb-1">{item.news}</p>
          <div className="text-sm text-gray-500">
            Start {moment(item.start_date).format("YYYY-MM-DD")} - End{" "}
            {moment(item.end_date).format("YYYY-MM-DD")}
          </div>
        </div>

        <Button
          variant="destructive"
          size="icon"
          onClick={(e) => {
            setDeleteLoading(true);
            handleDelete(item.id);
          }}
        >
          {deleteLoading ? <Spinner /> : <Trash size={16} />}
        </Button>
      </CardContent>
    </Card>
  );
};
