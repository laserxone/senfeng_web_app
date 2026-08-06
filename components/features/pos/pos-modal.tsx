import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import "./Button.css";
type POSModalProps = {
  modal: boolean;
  setModal: (value: boolean) => void;
  checked: boolean;
  setChecked: (value: any) => void;
  onClick: () => void;
  customer_id?: number | null;
};
const POSModal = ({
  modal,
  setModal,
  checked,
  setChecked,
  onClick,
}: POSModalProps) => {
  return (
    <Dialog open={modal} onOpenChange={setModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment status</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-2">
          <div className="flex flex-row items-center gap-2">
            <Label className="text-lg">Payment paid</Label>
            <Checkbox checked={checked} onCheckedChange={setChecked} />
          </div>
        </div>

        <DialogFooter className="justify-start gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
          <Button onClick={onClick}>Proceed</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default POSModal;
