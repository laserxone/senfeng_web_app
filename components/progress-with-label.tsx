import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
type Status = {
  file: string;
  current?: number;
  track?: number;
  progress: number;
};

type ProgressWithLabelProps = {
  status?: Status;
  total?: number;
};

export function ProgressWithLabel({
  status = { file: "", current: 0, progress: 0 },
  total = 0,
}: ProgressWithLabelProps) {
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
