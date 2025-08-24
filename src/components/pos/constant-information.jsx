import { Copy } from "lucide-react";
import { Label } from "../ui/label";
import {  FaPhone } from "react-icons/fa6";
import { FaGlobe } from "react-icons/fa";


const Disclaimer = () => {
    return (
        <div className="text-center text-gray-500 text-sm" style={{ color: '#0072BC', fontWeight: '600' }}>
            <Label>DISCLAIMER: This is an auto generated Invoice and does not require a signature.</Label>
        </div>
    )
}

const Footer = () => {
    return (
        < div style={{ paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0072BC', marginLeft: 20 }} >
            <div style={{ fontWeight: '600', fontSize: 18, display: 'flex', alignItems: 'center', gap: 5 }}>
                <FaPhone size={'25px'} />
                <Label>+92 333 9180410</Label>
            </div>
            <div style={{ marginRight: 20, fontWeight: '600', fontSize: 18, display: 'flex', alignItems: 'center', gap: 5 }}>
                <FaGlobe size={'25px'} />
                <Label>www.senfenglaserpk.com</Label>
            </div>
        </div >
    )
}

const CompanyDetails = () => {
    return (
        <div className="flex flex-col items-end">
            <div className="mr-2 gap-0 font-semibold text-sm">
                <p className="text-[#0072BC] text-lg font-bold mb-0 mt-0">SENFENG PAKISTAN</p>
                <p className="text-[#7F7F7F] mb-0 mt-0">Street# 2, Sharif Garden Daroghawala,</p>
                <p className="text-[#7F7F7F] mb-0 mt-0">Lahore, Punjab 54000, Pakistan</p>
                <p className="text-[#7F7F7F] mb-0 mt-0">senfenglaserpakistan@gmail.com</p>
            </div>
        </div>
    );
};


const Header = ({ onClick }) => {
    return (
        <div className="flex justify-between items-end ">
            <img src="/logo.png" alt="My Local Image" className="h-12 w-[250px]" />
            <div className='flex  items-center mr-[-20px]'>
                <div className="bg-[#0072BC] rounded-tl-2xl rounded-tr-2xl  w-[250px] h-11 flex items-center justify-center">
                    <p className="text-2xl font-semibold text-white">
                        INVOICE
                    </p>
                </div>
                <Copy onClick={onClick} className='ml-4 hover:cursor-pointer text-black' />
            </div>


        </div>
    );
};


const FormField = ({ phoneNumber, address, companyName, name, manager, inv, selectedUser }) => {
    return (
        <div style={{ display: 'grid', gap: 0, marginBottom: 5 }}>
            {['Company', 'Name', 'Contact', 'Address', 'Manager', selectedUser?.id ? "Engineer" : 'Invoice No'].map((label, index) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ color: '#7F7F7FFF', marginLeft: 10, fontWeight: '600' }}>{label}:</label>
                    <div style={{ backgroundColor: '#dce4f1', paddingLeft: 10, border: '1px solid #E5E7EB', maxWidth: '600px', height: 30, fontSize: 18, display: 'flex', alignItems: 'center' }}>
                        <Label className="text-black">
                            {index == 0 ? companyName : index == 1 ? name : index == 2 ? phoneNumber : index == 3 ? address : index == 4 ? manager : index == 5 ? selectedUser?.id ? selectedUser?.label : inv : ""}
                        </Label>
                    </div>

                </div>
            ))}
        </div>
    )
}

const BankDetail = () => {

    return (
        <div className="mb-8">
            <table className="w-full border-collapse">
                <tbody style={{ fontSize: 14 }}>
                    <tr style={{ height: 40 }}>
                        <td className="border border-gray-300 w-50" style={{ paddingLeft: 5 }}><Label className="text-black">Bank</Label></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300"><Label>United Bank Limited (UBL)</Label></td>
                    </tr>
                    <tr className="bg-[#FFE4E1]" style={{ height: 40 }}>
                        <td className="border border-gray-300"><Label className="text-black" style={{ paddingLeft: 5 }}>Account Title</Label></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Label>SENFENG PAKISTAN</Label></td>
                    </tr>
                    <tr style={{ height: 40 }}>
                        <td className="border border-gray-300"><Label className="text-black" style={{ paddingLeft: 5 }}>Account Number</Label></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Label>321618245</Label></td>
                    </tr>
                    <tr className="bg-[#FFE4E1]" style={{ height: 40 }}>
                        <td className="border border-gray-300"><Label className="text-black" style={{ paddingLeft: 5 }}>IBAN</Label></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Label>PK33UNIL0109000321618245</Label></td>
                    </tr>
                    <tr style={{ height: 40 }}>
                        <td className="border border-gray-300"><Label className="text-black" style={{ paddingLeft: 5 }}>Branch Code</Label></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Label>0508</Label></td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export {BankDetail, CompanyDetails, Disclaimer, Footer, FormField, Header }