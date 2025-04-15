import React from "react";



const NotificationBadgeWithoutCount = ({ count }) => {
  if (count === 0) return null;

  return (
    <div className="relative">
      <span className="flex h-2 w-2 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
      </span>
    </div>
  );
};

export default NotificationBadgeWithoutCount;
