import { readFileSync } from "node:fs";
import path from "path";


export const publicFile = (src: string) => {

    const cleanSrc = src.split("?")[0].replace(/^\//, "");
    return {
        data: readFileSync(path.join(process.cwd(), "public", cleanSrc)),
        format: "png" as const,
    }
};
