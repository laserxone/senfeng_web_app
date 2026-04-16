import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import Spinner from "./ui/spinner";
import { ReactNode } from "react";
type ConfirmationDialogProps = {
  title: string;
  description: string;
  onPressYes: () => void;
  onPressCancel: () => void;
  open: boolean;
  loading?: boolean;
  children?: ReactNode | null;
  valid?: boolean;
};
const ConfimationDialog = ({ title, description, onPressYes,onPressCancel, open, loading, children = null, valid = true }: ConfirmationDialogProps) => {
  return (
    <AlertDialog open={open}>
      {/* <AlertDialogTrigger >{children}</AlertDialogTrigger> */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onPressCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!valid || loading} onClick={() => onPressYes()}>
           {loading && <Spinner />} Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfimationDialog
