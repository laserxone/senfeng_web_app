import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

const ConfimationDialog = ({ children, title, description, onPressYes,onPressCancel, open, loading }) => {
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
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onPressCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onPressYes()}>
           {loading && <Loader2 className="animate-spin"/>} Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfimationDialog
