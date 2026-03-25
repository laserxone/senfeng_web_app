import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";

export function ProgressWithLabel({ status = {file : "", current : 0, progress : 0}, total = 0 }) {
  return (
    <Field className="w-full">
      <FieldLabel htmlFor="progress-upload">
        <span>Uploading {status?.file} - {status?.current} of {total}</span>
        <span className="ml-auto">{status?.progress}%</span>
      </FieldLabel>
      <Progress value={status?.progress} id="progress-upload" />
    </Field>
  );
}
