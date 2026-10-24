import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

type AppDialogProps = {
  title: string;
  description: string;
  open: boolean;
  onOpenChange?: (item: boolean) => void;
  Icon: LucideIcon;
  children: ReactNode;
};

export default function AppDialog({
  title,
  description,
  open,
  onOpenChange,
  Icon,
  children,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-md border-border bg-card p-0 text-card-foreground sm:max-w-4xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs text-muted-foreground">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          {children}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
