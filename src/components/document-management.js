// pages/document-management.js
"use client";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { UserContext } from '@/store/context/UserContext';
import { ArrowUpDown, Download, Trash2 } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';
import PageTable from './app-table';
import { Button } from './ui/button';
import { Heading } from './ui/heading';
import Spinner from './ui/spinner';
import axios from '@/lib/axios';
import { BASE_URL } from '@/constants/data';
import moment from 'moment';

const DocumentManagement = () => {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true)
    const { state: UserState } = useContext(UserContext)
    const { toast } = useToast()
    const [uploadLoading, setUploadLoading] = useState(false)
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (UserState.value.data?.id)
            fetchFiles();
    }, [UserState]);

    const fetchFiles = async () => {

        try {
            const response = await axios.get(`/dms`)
            const finalData = response.data.map((item, index)=>{
                return {...item, sr : index + 1}
            })
            setFiles([...finalData]);
            setLoading(false)
            setUploadLoading(false)
        } catch (error) {
            console.log(error)
            setLoading(false)
            setUploadLoading(false)
        }





        // const { data, error } = await supabase.storage.from('documents').list('')

        // if (error) {
        //     setError('Error fetching files.');
        //     toast({ title: 'Error fetching files.', variant: "destructive" })
        //     setUploadLoading(false)
        //     setLoading(false)
        //     return;
        // }
        // let temp = [...data]
        // temp.sort((a, b) => {
        //     const nameA = a.name ? a.name.toLowerCase() : "";
        //     const nameB = b.name ? b.name.toLowerCase() : "";

        //     if (!nameA && nameB) return 1;
        //     if (nameA && !nameB) return -1;

        //     return nameA.localeCompare(nameB);
        // });
        // const finalData = temp.map((item, index) => {
        //     return ({ ...item, id: index + 1 })
        // })
        // setFiles([...finalData]);
        // setLoading(false)
        // setUploadLoading(false)
    };

    const uploadFile = async () => {
        if (!selectedFile) {
            toast({ title: 'Please select a file to upload.', variant: "destructive" })
            return;
        }
        setUploadLoading(true)
        handleUpload()

    };

    async function handleDelete(file) {
        const id = file.id
        await axios.delete(`/dms/${id}`).then(async () => {
            await supabase
                .storage
                .from('documents')
                .remove([file.path])
        }).finally(() => {
            fetchFiles()
        })
    }

    async function handleUpload() {
        const filePath = `${selectedFile.name}`;
        const { error } = await supabase.storage
            .from('documents')
            .upload(filePath, selectedFile);

        if (error) {
            toast({ title: error?.message || 'Error uploading file', variant: "destructive" })
            setUploadLoading(false)
            return;
        }
        const response = await axios.post(`/dms`, {
            added_by: UserState.value.data?.name || UserState.value.data?.email,
            path: filePath
        })
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        fetchFiles();
    }

    const columns = [
        {
            accessorKey: "sr",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Sr.
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <div className="ml-2">
                    {row.getValue("sr")}
                </div>
            ),
        },
        {
            accessorKey: "path",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        File Name
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <div className="ml-2">
                    {row.getValue("path")}
                </div>
            ),
        },

        {
            accessorKey: "added_by",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Added By
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <div className="ml-2">
                    {row.getValue("added_by")}
                </div>
            ),
        },

        {
            accessorKey: "created_at",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Date
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <div className="ml-2">
                    {moment(row.getValue("created_at")).format("YYYY-MM-DD")}
                </div>
            ),
        },

        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => {
                const file = row.original;
                const [deleteLoading, setDeleteLoading] = useState(false)
                const [downloadLoading, setDownloadLoading] = useState(false)
                return (
                    <div className='flex gap-4'>
                        {downloadLoading ? (
                            <Spinner className="h-5 w-5" />
                        ) :
                            <Download className="h-5 w-5 hover:opacity-50" onClick={
                                async () => {
                                    setDownloadLoading(true)
                                    const { data, error } = await supabase
                                        .storage
                                        .from('documents')
                                        .download(file.path)
                                    if (error) {
                                        console.error("Error downloading file", error);
                                        return;
                                    }
                                    const url = URL.createObjectURL(data);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = file.path;  // Optional: Specify the download file name
                                    link.click();

                                    // Clean up the Blob URL after the download is triggered
                                    URL.revokeObjectURL(url);
                                    setDownloadLoading(false)
                                }
                            } />
                        }

                        {
                            UserState?.value?.data &&
                            (UserState.value.data.designation === 'Owner' || UserState.value.data.full_access) &&
                            (
                                deleteLoading ? (
                                    <Spinner className="h-5 w-5" />
                                ) : (
                                    <Trash2
                                        className="h-5 w-5 text-red-500 hover:opacity-50"
                                        onClick={async () => {
                                            setDeleteLoading(true);
                                            await handleDelete(file);
                                            setDeleteLoading(false);
                                        }}
                                    />
                                )
                            )
                        }

                    </div>
                );
            },
        },

    ];


    return (
        <div className="flex flex-1 flex-col space-y-4">
            <div className="flex flex-col space-y-4">
                <Heading title="Documents Management" description="Manage office documents" />
                {UserState.value.data &&
                    UserState.value.data?.dms_write_access && (
                        <div className="flex justify-between mb-6 gap-4 flex-wrap">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                className="border p-2 rounded-md w-72"
                            />
                            <Button

                                disabled={uploadLoading}
                                onClick={uploadFile}

                            >
                                {uploadLoading && <Spinner />}  Upload File
                            </Button>
                        </div>
                    )}

            </div>

            {error && <div className="text-red-500 text-center mb-4">{error}</div>}

            <PageTable
                disableInput={true}
                loading={loading}
                columns={columns}
                data={files}
                totalItems={files.length}
                onRowClick={async (file) => {

                }}

            // filter={true}
            // onFilterClick={() => setFilterVisible(true)}
            >
            </PageTable>

        </div>
    );
};

export default DocumentManagement;
