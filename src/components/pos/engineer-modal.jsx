import axios from '@/lib/axios';
import { useContext, useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import './Button.css';
import { UserContext } from '@/store/context/UserContext';
import moment from 'moment';
import Spinner from '../ui/spinner';

const EngineerModal = ({engineersModal, setEngineersModal, allEngineersData, onRefresh}) => {
  return (
    <Dialog open={engineersModal} onOpenChange={setEngineersModal}>
      <DialogContent className="max-w-[90vw] h-[90vh]">
        <DialogHeader>
          <DialogTitle>Issued Items To Engineers</DialogTitle>
        </DialogHeader>

        {allEngineersData.length == 0 ? (
          <p>No data found</p>
        ) : (
          <div>
            <ScrollArea className="h-[80vh] px-2">
              {allEngineersData.map((item, index) => (
                <RenderEachEngineerRow
                  key={index}
                  item={item}
                  onRefresh={onRefresh}
                />
              ))}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};


  const RenderEachEngineerRow = ({ item, onRefresh }) => {
        const [updateLoading, setUpdateLoading] = useState(false)
        const {state : UserState} = useContext(UserContext)

        async function handleReceivedBack() {
            setUpdateLoading(true)
            axios.post(`/${UserState.value.data?.id}/pos/engineer/${item.id}`, { field: item.fields })
                .then(async () => {
                    await onRefresh()
                    setUpdateLoading(false)
                }).catch(() => {
                    setUpdateLoading(false)
                })
        }

        return (
            <div className="border rounded-lg shadow-sm mb-4 overflow-hidden">
                {/* Top Info Section */}
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <p className="font-medium text-sm md:text-base">Engineer Name: <span className="font-normal">{item.user_name}</span></p>
                        <p className="font-medium text-sm md:text-base">Name: <span className="font-normal">{item.name}</span></p>
                        <p className="font-medium text-sm md:text-base">Company: <span className="font-normal">{item.company}</span></p>
                    </div>

                    <div>
                        <p className="font-medium text-sm md:text-base">Address: <span className="font-normal">{item.address}</span></p>
                        <p className="font-medium text-sm md:text-base">Phone: <span className="font-normal">{item.phone}</span></p>
                        <p className="font-medium text-sm md:text-base">Issue Date: <span className="font-normal">{moment(item.created_at).format("YYYY-MM-DD")}</span></p>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white">
                            <tr>
                                <th className="px-4 py-2 text-left border-b">Name</th>
                                <th className="px-4 py-2 text-left border-b">Qty</th>
                                <th className="px-4 py-2 text-left border-b">Price</th>
                                <th className="px-4 py-2 text-left border-b">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {item.fields?.map((field, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-4 py-2 border-b">{field.name}</td>
                                    <td className="px-4 py-2 border-b">{field.qty}</td>
                                    <td className="px-4 py-2 border-b">{field.price}</td>
                                    <td className="px-4 py-2 border-b">{field.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Button className="m-2" onClick={handleReceivedBack}>
                    {updateLoading && <Spinner />}  Received back
                </Button>
            </div>
        );

    }

export default EngineerModal;
