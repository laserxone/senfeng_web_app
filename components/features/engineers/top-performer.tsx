"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Users } from "lucide-react";
import { Performer } from "@/lib/types";
import { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/config/firebase";

interface TopPerformersProps {
  performers: Performer[];
}

export function TopPerformers({ performers }: TopPerformersProps) {
  const [topPerformer, ...otherPerformers] = performers;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {topPerformer && (
        <Card className="border border-border bg-gradient-to-br from-amber-50 to-white shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-amber-100 p-1.5">
                <Crown className="h-4 w-4 text-amber-600" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">
                Top Performer
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-33 w-33 border-2 border-amber-200">
                  <RenderProfilePicture dp={topPerformer.dp} />
                  <AvatarFallback className="bg-amber-100 text-lg font-semibold text-amber-700">
                    {getInitials(topPerformer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -right-1 -bottom-1 rounded-full bg-amber-500 p-1 shadow-sm">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              </div>
              <h3 className="mt-3 text-lg font-bold text-foreground">
                {topPerformer.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {topPerformer.designation}
              </p>
              <div className="mt-3 flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-amber-600">
                  {topPerformer.completion_rate.toFixed(1)}%
                </span>
              </div>
              <div className="mt-3 grid w-full grid-cols-3 gap-2 rounded-lg bg-secondary/50 p-2">
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">
                    {topPerformer.total_assigned}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Assigned</p>
                </div>
                <div className="border-x border-border text-center">
                  <p className="text-success text-sm font-bold">
                    {topPerformer.total_completed}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Done</p>
                </div>
                <div className="text-center">
                  <p className="text-warning text-sm font-bold">
                    {topPerformer.total_pending}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Top Performers */}
      <Card className="border border-border bg-card shadow-sm lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-secondary p-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-semibold text-foreground">
              Leaderboard
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {otherPerformers.map((performer, index) => (
              <div
                key={performer.engineer_id}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                  {index + 2}
                </div>
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-secondary text-xs text-foreground">
                    {getInitials(performer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {performer.name}
                  </p>
                  <p className="font-semibold text-foreground">
                    {performer.total_assigned} / {performer.total_completed}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-primary">
                    {performer.completion_rate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {performer.total_pending} Pending
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const RenderProfilePicture = ({ dp }: { dp?: string }) => {
  const [localImage, setLocalImage] = useState<string | null>(null);

  useEffect(() => {
    if (dp) {
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
      }
    }
  }, []);

  if (localImage) return <AvatarImage src={localImage || ""} />;
};
