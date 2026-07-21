import useUserDetail from '@/hooks/use-user-detail';
import axios from '@/lib/axios';
import { EngineerIssuedItems } from '@/lib/types';
import { Building2, CalendarDays, ClipboardCheck, MapPin, PackageCheck, Phone, UserRound } from 'lucide-react';
import moment from 'moment';
import { Dispatch, ReactNode, SetStateAction, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Spinner from '@/components/ui/spinner';
import './Button.css';

type EngineerModalType = {
  engineersModal: boolean
  setEngineersModal: Dispatch<SetStateAction<boolean>>
  allEngineersData: EngineerIssuedItems[]
  onRefresh: () => Promise<void>
}

const EngineerModal = ({ engineersModal, setEngineersModal, allEngineersData, onRefresh }: EngineerModalType) => {
  return (
    <Dialog open={engineersModal} onOpenChange={setEngineersModal}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-5xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Issued Items To Engineers
              </DialogTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {allEngineersData.length} active issue{allEngineersData.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="hidden rounded-md border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground sm:block">
              Store stock return queue
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
        {allEngineersData.length == 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <PackageCheck className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-bold">No issued items found</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Engineer issued stock will appear here when items are assigned.
            </p>
          </div>
        ) : (
          <div className="bg-background">
            <div className="space-y-3 p-3.5 pb-4">
              {allEngineersData.map((item, index) => (
                <RenderEachEngineerRow
                  key={index}
                  item={item}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </div>
        )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};


const RenderEachEngineerRow = ({ item, onRefresh }: { item: EngineerIssuedItems, onRefresh: () => Promise<void> }) => {
  const [updateLoading, setUpdateLoading] = useState(false)
  const { userID } = useUserDetail()
  const itemCount = item.fields?.length || 0
  const totalAmount = item.fields?.reduce((sum, field) => sum + Number(field.total || 0), 0) || 0

  async function handleReceivedBack() {
    setUpdateLoading(true)
    axios.post(`/${userID}/pos/engineer/${item.id}`, { field: item.fields })
      .then(async () => {
        await onRefresh()
        setUpdateLoading(false)
      }).catch(() => {
        setUpdateLoading(false)
      })
  }

  return (
    <div className="mb-3 overflow-hidden rounded-md border bg-card ring-1 ring-border/30">
      <div className="border-b bg-muted/25 px-3 py-2.5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight">{item.user_name}</p>
                <p className="text-xs text-muted-foreground">Engineer assigned stock</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:min-w-[420px]">
            <InfoChip icon={<PackageCheck className="h-3.5 w-3.5" />} label="Items" value={String(itemCount)} />
            <InfoChip icon={<ClipboardCheck className="h-3.5 w-3.5" />} label="Total" value={String(totalAmount)} />
            <InfoChip icon={<CalendarDays className="h-3.5 w-3.5" />} label="Issued" value={moment(item.created_at).format("YYYY-MM-DD")} />
            <Button
              className="h-8 rounded-md text-xs"
              onClick={handleReceivedBack}
              disabled={updateLoading}
              size="sm"
            >
              {updateLoading && <Spinner />} Received back
            </Button>
          </div>
        </div>

        <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
          <MetaLine icon={<UserRound className="h-3.5 w-3.5" />} label="Name" value={item.name} />
          <MetaLine icon={<Building2 className="h-3.5 w-3.5" />} label="Company" value={item.company} />
          <MetaLine icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={item.phone} />
          <MetaLine icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={item.address} />
        </div>
      </div>

      <div className="overflow-x-auto p-2">
        <table className="w-full min-w-[520px] table-auto text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="rounded-l-md px-3 py-2 text-left font-bold">Name</th>
              <th className="px-3 py-2 text-right font-bold">Qty</th>
              <th className="px-3 py-2 text-right font-bold">Price</th>
              <th className="rounded-r-md px-3 py-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {item.fields?.map((field, idx) => (
              <tr key={idx} className="border-b last:border-b-0 odd:bg-muted/20 hover:bg-muted/40">
                <td className="px-3 py-2 font-medium">{field.name}</td>
                <td className="px-3 py-2 text-right">{field.qty}</td>
                <td className="px-3 py-2 text-right">{field.price}</td>
                <td className="px-3 py-2 text-right font-bold">{field.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

}

function InfoChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
      <span className="text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase leading-none text-muted-foreground">{label}</p>
        <p className="truncate text-xs font-bold leading-tight text-foreground">{value || "-"}</p>
      </div>
    </div>
  );
}

function MetaLine({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md bg-background/70 px-2 py-1.5">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <p className="min-w-0 truncate">
        <span className="font-semibold text-foreground">{label}: </span>
        {value || "-"}
      </p>
    </div>
  );
}

export default EngineerModal;
