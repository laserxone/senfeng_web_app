
"use client";

import useUserDetail from "@/hooks/use-user-detail";
import {
    BadgeDollarSign,
    CalendarCheck,
    CloudUpload,
    FileText,
    Gift,
    GraduationCap,
    HandCoins,
    ShieldCheck,
} from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import Heading from "@/components/ui/heading";

const applications = [
    {
        title: "Apply for Loan",
        desc: "Request financing or employee loan",
        icon: BadgeDollarSign,
        color: "bg-emerald-50 text-emerald-600",
        path: "/applications/loan",
    },
    {
        title: "Apply for Backup",
        desc: "Request system or data backup",
        icon: CloudUpload,
        color: "bg-blue-50 text-blue-600",
        path: "/applications/backup",
    },
    {
        title: "Apply for Gift",
        desc: "Request gift approval",
        icon: Gift,
        color: "bg-pink-50 text-pink-600",
        path: "/applications/gift",
    },
    {
        title: "Apply for Advance",
        desc: "Request advance payment",
        icon: HandCoins,
        color: "bg-orange-50 text-orange-600",
        path: "/applications/advance",
    },
    {
        title: "Apply for Leave",
        desc: "Submit leave request",
        icon: CalendarCheck,
        color: "bg-purple-50 text-purple-600",
        path: "/applications/leave",
    },
    {
        title: "Apply for Document",
        desc: "Request official document",
        icon: FileText,
        color: "bg-cyan-50 text-cyan-600",
        path: "/applications/document",
    },
    {
        title: "Apply for Training",
        desc: "Request training approval",
        icon: GraduationCap,
        color: "bg-yellow-50 text-yellow-600",
        path: "/applications/training",
    },
    {
        title: "Apply for Security",
        desc: "Request security approval",
        icon: ShieldCheck,
        color: "bg-slate-50 text-slate-600",
        path: "/applications/security",
    },
];

export default function ApplicationsPage() {
    const router = useRouter();
    const { base_route, designation } = useUserDetail()


    return (
        <div className="flex flex-1 flex-col space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <Heading panel title="Applications" />
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {applications.map((item) => {
                    const Icon = item.icon;
                    if (designation === 'Engineer' && item.title === 'Apply for Backup') return null
                    return (
                        <button
                            key={item.title}
                            onClick={() => router.push(`/${base_route}${item.path}`)}
                            className="group bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                        >
                            <div
                                className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${item.color}`}
                            >
                                <Icon size={34} />
                            </div>

                            <h3 className="font-semibold text-slate-900">{item.title}</h3>
                            <p className="text-sm text-slate-500 mt-2">{item.desc}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
