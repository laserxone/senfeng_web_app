import React from "react";
import { Badge } from "./ui/badge";



const NotificationBadge = ({ count }) => {
  if (count === 0) return null;

  return (
    <div className="relative">
      {/* <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
        {count}
      </span> */}
      <Badge variant={"destructive"} className={"text-sm font-medium"}>
        {count}
      </Badge>
    </div>
  );
};

export default NotificationBadge;
