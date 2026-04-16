import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
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
}:POSModalProps) => {
  return (
    <Dialog open={modal} onOpenChange={setModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment status</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-2">
          <div className="flex flex-row gap-2 items-center">
            <Label className="text-lg">Payment paid</Label>
            <Checkbox checked={checked} onCheckedChange={setChecked} />
          </div>
        </div>

        <DialogFooter className="justify-start sm:justify-end gap-2">
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
