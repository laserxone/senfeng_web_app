// pages/document-management.js
"use client";
import { supabase } from '@/lib/supabaseClient';
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button } from './ui/button';
import { UserContext } from '@/store/context/UserContext';
import { Heading } from './ui/heading';
import PageTable from './app-table';
import { ArrowUpDown, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Spinner from './ui/spinner';

const DocumentManagement = () => {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true)
    const { state: UserState } = useContext(UserContext)
    const { toast } = useToast()
    const [uploadLoading, setUploadLoading] = useState(true)
    const fileInputRef = useRef(null);

    // Fetch files from the public storage bucket when the component mounts
    useEffect(() => {
        if (UserState.value.data?.id)
            fetchFiles();
    }, [UserState]);

    // Fetch files function
    const fetchFiles = async () => {


        const { data, error } = await supabase.storage.from('documents').list('')

        if (error) {
            setError('Error fetching files.');
            toast({ title: 'Error fetching files.', variant: "destructive" })
            setUploadLoading(false)
            setLoading(false)
            return;
        }
        let temp = [...data]
        temp.sort((a, b) => {
            const nameA = a.name ? a.name.toLowerCase() : "";
            const nameB = b.name ? b.name.toLowerCase() : "";

            if (!nameA && nameB) return 1;
            if (nameA && !nameB) return -1;

            return nameA.localeCompare(nameB);
        });
        const finalData = temp.map((item, index) => {
            return ({ ...item, id: index + 1 })
        })
        setFiles([...finalData]);
        setLoading(false)
        setUploadLoading(false)
    };

    // Handle file upload
    const uploadFile = async () => {
        if (!selectedFile) {
            toast({ title: 'Please select a file to upload.', variant: "destructive" })
            return;
        }
        setUploadLoading(true)
        handleUpload()

    };

    async function handleDelete(file) {
        const { data, error } = await supabase
            .storage
            .from('documents')
            .remove([file.name]).finally(() => {
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
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        fetchFiles();
    }

    const columns = [
        {
            accessorKey: "id",
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
                    {row.getValue("id")}
                </div>
            ),
        },
        {
            accessorKey: "name",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Name
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <div className="ml-2">
                    {row.getValue("name")}
                </div>
            ),
        },

        {
            id: "actions",
            cell: ({ row }) => {
                const file = row.original;
                const [deleteLoading, setDeleteLoading] = useState(false)
                return (
                    <div className='flex gap-4'>

                        <Download className="h-5 w-5 hover:opacity-50" onClick={
                            async () => {
                                const { data, error } = await supabase
                                    .storage
                                    .from('documents')
                                    .download(file.name)
                                if (error) {
                                    console.error("Error downloading file", error);
                                    return;
                                }
                                const url = URL.createObjectURL(data);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = file.name;  // Optional: Specify the download file name
                                link.click();

                                // Clean up the Blob URL after the download is triggered
                                URL.revokeObjectURL(url);
                            }
                        } />


                        {UserState?.value?.data && UserState?.value?.data?.designation == 'Owner' &&  deleteLoading ? <Spinner className="h-5 w-5" /> : <Trash2 className="h-5 w-5 text-red-500 hover:opacity-50" onClick={async () => {
                            setDeleteLoading(true)
                            await handleDelete(file)
                            setDeleteLoading(false)
                        }} />}

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
                    UserState.value.data?.designation == 'Owner' && (
                        <div className="flex justify-between mb-6">
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
