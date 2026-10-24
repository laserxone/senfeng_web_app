import {
  GET as sharedGET,
  createQuotationPostHandler,
} from "@/app/api/lahore/[uid]/quotation/route";

export const POST = createQuotationPostHandler("karachi");
export const GET = sharedGET;
