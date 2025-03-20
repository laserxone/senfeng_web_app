import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";

export const MachinesSoldCard = ({ value, percentage }) => {
  return (
    <div className="shadow-md border border-gray-200 rounded-lg bg-white p-4" style={{height:'fit-content'}}>
    {/* Header */}
    <div className="flex flex-row items-center justify-between">
      <div className="flex items-center space-x-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-gray-500"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <path d="M2 10h20" />
        </svg>
        <span className="text-xs font-medium text-gray-600">
          Machines Sold This Month
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 ml-4">{value}</div>
    </div>
  
    {/* Content */}
    <div className="mt-1">
      <p
        className={`text-xs font-medium ${
          percentage >= 0 ? "text-green-500" : "text-red-500"
        } flex items-center`}
      >
        {percentage >= 0 ? "▲" : "▼"} {Math.abs(percentage)}% from last month
      </p>
    </div>
  </div>
  
  );
};

export const FeedbackTakenCard = ({ value, remaining, total }) => {
  return (
    <div
      className="shadow-md border border-gray-200 rounded-lg bg-white p-4"
      style={{ height: "fit-content" }}
    >
      {/* Header */}
      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-gray-500"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="text-xs font-medium text-gray-600">
            Feedbacks Taken This Month
          </span>
        </div>
        <div className="flex items-baseline space-x-1 text-gray-900 ml-4">
          <span className="text-2xl font-extrabold">{value}</span>
          <span className="text-sm font-medium text-gray-600">/ {total}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mt-1">
        <p
          className={`text-xs font-medium ${
            remaining === 0 ? "text-green-500" : "text-red-500"
          } flex items-center`}
        >
          {remaining === 0 ? "No" : remaining} feedbacks remaining
        </p>
      </div>
    </div>
  );
};
