// pages/document-management.js
"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import  Heading  from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { supabase } from "@/lib/supabaseClient";
import { UserContext } from "@/store/context/UserContext";
import {
  ChevronRight,
  List,
  Table2
} from "lucide-react";
import moment from "moment";
import Image from "next/image";
import {
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./ui/context-menu";
import { OfficeContext } from "@/store/context/OfficeContext";
import useUserDetail from "@/hooks/use-user-detail";
import { useRouter } from "next/navigation";
import { startHolyLoader } from "holy-loader";

const SuperadminDocumentManagement = () => {
  const [selectedFile, setSelectedFile] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userID, name, email, superadmin_cloud_access, isAdmin, base_route } = useUserDetail()
  const { toast } = useToast();
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [visible, setVisible] = useState(false);
  const [allFolders, setAllFolders] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [folderBread, setFolderBread] = useState([{ name: "root", id: null }]);
  const [folderLoading, setFolderLoading] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newName, setNewName] = useState("")
  const [view, setView] = useState(false)
  const [selectedPreview, setSelectedPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const router = useRouter()


  useEffect(() => {

    if (userID) {
      if (isAdmin || superadmin_cloud_access) {
        setLoading(true)
        fetchFiles()
      } else {
          startHolyLoader()
          router.push(`/restricted`)
      }

    }

  }, [userID, currentFolder, superadmin_cloud_access]);

  const fetchFiles = async () => {
    return new Promise(async (resolve) => {
      try {
        const response = await axios.get(
          `/${userID}/cloud/folder?folder=${currentFolder?.id || null}`
        );
        setAllDocuments(response.data.documents);
        setAllFolders(response.data.folders);
        setLoading(false);
        setUploadLoading(false);
      } catch (error) {
        console.log(error);
      } finally {
        resolve()
      }
    })

  };

  const uploadFile = async () => {
    if (!selectedFile.length) {
      toast({
        title: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }
    setUploadLoading(true);
    handleUpload();
  };



  async function handleUpload() {
    for (const file of selectedFile) {
      const filePath = `${file.name}`;
      const { error } = await supabase.storage
        .from("superadmin.documents")
        .upload(filePath, file);

      if (error) {
        toast({
          title: error?.message || `Error uploading ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      await axios.post(`/${userID}/cloud/document`, {
        added_by: name || email,
        path: filePath,
        folder_id: currentFolder ? currentFolder.id : undefined,
        created_by: userID
      });
    }

    setSelectedFile([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    await fetchFiles();
    setUploadLoading(false);

  }

  async function handleCreateFolder() {
    setFolderLoading(true)
    axios
      .post(`/${userID}/cloud/folder`, {
        name: folderName,
        parent_folder: currentFolder ? currentFolder?.id : undefined,
        created_by: userID
      })
      .then(async () => {
        setFolderName("");
        setVisible(false);
        await fetchFiles()

      }).finally(() => {
        setFolderLoading(false)
      })
  }

  async function handleRenameFolder() {
    if (!selectedFolder) return
    setFolderLoading(true)
    axios
      .put(`/${userID}/cloud/folder/${selectedFolder?.id}`, {
        name: newName,
      })
      .then(async () => {
        setNewName("");
        setSelectedFolder(false);
        await fetchFiles()
      }).finally(() => {
        setFolderLoading(false)
      })
  }



  const RenderEachFile = ({ item, index, view, onPreview }) => {
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);


    async function handleDelete(file) {
      const id = file.id;
      await axios
        .delete(`/${userID}/cloud/document/${id}`)
        .then(async () => {
          await supabase.storage.from("superadmin.documents").remove([file.path]);
          await fetchFiles();
        })
        .finally(() => {
          setDeleteLoading(false)
        });
    }

    const RenderFile = ({ path, index }) => {
      let url = "/file-icon.png"
      if (path?.toLowerCase().includes("pdf")) {
        url = "/pdf-icon.png"
      }

      if (path?.toLowerCase().includes("doc")) {
        url = "/docx-icon.png"
      }

      if (path?.toLowerCase().includes("xls")) {
        url = "/xlsx-icon.png"
      }

      if (path?.toLowerCase().includes("ppt")) {
        url = "/ppt-icon.png"
      }



      return (
        <>
          <Image
            src={url}
            height={view ? 40 : 100}
            width={view ? 40 : 100}
            alt={`${index}-file`}

          />
          <Label className={view ? "text-left" : "text-center"}>{path}</Label>
        </>
      )
    }

    return (



      <ContextMenu>
        <ContextMenuTrigger
          onDoubleClick={() => {
            onPreview(item.path)
          }}>
          <div
            className={`flex ${view ? "flex-row items-center gap-4" : "flex-col items-center justify-center"} ${view ? "p-0" : "p-2"} rounded cursor-pointer ${view ? "w-full" : "max-w-[150px]"} ${view ? "h-auto" : "min-h-[120px]"} `}
            style={{
              border: "1px solid transparent",
              backgroundColor: "transparent",
            }}
          >
            {(downloadLoading || deleteLoading) ? <Spinner /> :
              <RenderFile path={item.path} index={index} />
            }
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>

          <ContextMenuItem

            onClick={async () => {
              onPreview(item.path)
            }}
          >
            Preview
          </ContextMenuItem>

          <ContextMenuItem
            onClick={async () => {
              setDownloadLoading(true);
              const { data, error } = await supabase.storage
                .from("superadmin.documents")
                .download(item.path);
              if (error) {
                console.error("Error downloading file", error);
                return;
              }
              const url = URL.createObjectURL(data);
              const link = document.createElement("a");
              link.href = url;
              link.download = item.path;
              link.click();
              URL.revokeObjectURL(url);
              setDownloadLoading(false);
            }}
          >
            Download
          </ContextMenuItem>

          <ContextMenuItem
            onClick={async () => {
              setDeleteLoading(true);
              await handleDelete(item);
            }}
          >
            Delete
          </ContextMenuItem>


          <ContextMenuItem className="hover:none">
            <div className="flex flex-1 flex-col">
              <Label>Date : {moment(item.created_at).format("YYYY-MM-DD")}</Label>
              <Label>Uploaded by : {item.added_by}</Label>
            </div>

          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>





    );
  };


  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-col space-y-4">
        <Heading
          title="Superadmin Cloud"
          description="Manage personal documents"
        />

        <div className="flex justify-between mb-4 gap-2 flex-wrap">
          <div className="flex gap-2 items-center">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={(e) => setSelectedFile(Array.from(e.target.files))}
              className="border p-2 rounded-md w-72"
            />
            {selectedFile.length > 0 && (
              <Button disabled={uploadLoading} onClick={uploadFile}>
                {uploadLoading && <Spinner />} Upload Files
              </Button>
            )}
          </div>
          <Button onClick={() => setVisible(true)}>
            Create new folder
          </Button>
        </div>

      </div>



      <div>
        <div className="flex justify-between items-center bg-gray-200 dark:bg-gray-800 mb-2 pr-2">
          <div className="flex space-x-2 p-2 ">
            <MyBreadcrumb folderBread={folderBread} setCurrentFolder={setCurrentFolder} setFolderBread={setFolderBread} />
          </div>
          {!view ? <Table2 className='cursor-pointer' onClick={() => setView(!view)} /> : <List className='cursor-pointer' onClick={() => setView(!view)} />}
        </div>

        {loading ? (
          <div className="flex flex-c items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className={view ? "flex flex-col gap-2" : "flex flex-row gap-4 flex-wrap"}>
            {allFolders.map((item, index) => (
              <RenderEachFolder key={index} item={item} index={index} view={view} setCurrentFolder={setCurrentFolder} setFolderBread={setFolderBread} setNewName={setNewName} setSelectedFolder={setSelectedFolder} fetchFiles={fetchFiles} />
            ))}

            {allDocuments.map((item, index) => (
              <RenderEachFile key={index} item={item} index={index} view={view} onPreview={async (path) => {
                setPreviewLoading(true);
                setPreview(true)
                try {
                  const { data, error } = await supabase.storage
                    .from("superadmin.documents")
                    .getPublicUrl(path)
                  if (error) {
                    console.error("Error downloading file", error);
                    return;
                  }

                  setSelectedPreview(data.publicUrl)
                } finally {
                  setPreviewLoading(false);
                }



              }} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new folder</DialogTitle>
          </DialogHeader>

          <div className="px-2">
            <Label>Folder name</Label>
            <Input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button onClick={handleCreateFolder}>{folderLoading && <Spinner />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={selectedFolder} onOpenChange={() => setSelectedFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>

          <div className="px-2">
            <Label>Folder name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button disabled={!newName || folderLoading} onClick={handleRenameFolder}>{folderLoading && <Spinner />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PreviewFile preview={preview} setPreview={setPreview} previewLoading={previewLoading} selectedPreview={selectedPreview} />
    </div>
  );
};


const RenderEachFolder = ({ item, index, view, setFolderBread, setCurrentFolder, setSelectedFolder, setNewName, fetchFiles }) => {

  const [deleteLoading, setDeleteLoading] = useState(false)
  const { userID } = useUserDetail()

  async function handleDeleteFolder(id) {
    try {
      setDeleteLoading(true)
      await axios.delete(`/${userID}/cloud/folder/${id}`)
      await fetchFiles()
    } finally {
      setDeleteLoading(false)
    }

  }

  const openFolder = () => {
    setFolderBread((prev) => [...prev, { name: item.name, id: item.id }]);
    setCurrentFolder({ name: item.name, id: item.id });
  }


  return (
    <ContextMenu>
      <ContextMenuTrigger
        onDoubleClick={openFolder}>
        <div
          className={`flex ${view ? "flex-row items-center gap-4" : "flex-col items-center justify-center"} ${view ? "p-0" : "p-2"} rounded cursor-pointer ${view ? "w-full" : "max-w-[150px]"} ${view ? "h-auto" : "min-h-[120px]"} `}
          style={{
            border:
              "1px solid transparent",
            backgroundColor:
              "transparent",
          }}
        >
          {deleteLoading ? <Spinner /> :
            <>
              <Image
                src="/folder-icon.png"
                height={view ? 40 : 100}
                width={view ? 40 : 100}
                alt={`${index}-folder`}
              />
              <Label className={view ? "text-left" : "text-center"}>{item.name}</Label>
            </>
          }
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={openFolder}
        >
          Open
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => {
            setSelectedFolder(item)
            setNewName(item.name)
          }}
        >
          Rename
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => handleDeleteFolder(item.id)}
        >
          Delete
        </ContextMenuItem>



      </ContextMenuContent>
    </ContextMenu>
  )
}

const MyBreadcrumb = ({ folderBread, setFolderBread, setCurrentFolder }) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {folderBread.map((crumb, index) => (
          <Fragment key={crumb.name + index}>
            {index !== folderBread.length - 1 && (
              <BreadcrumbItem className="block">
                <BreadcrumbLink

                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const path = folderBread.slice(0, index + 1);
                    setFolderBread(path);
                    setCurrentFolder(
                      path[path.length - 1]?.id ? path[path.length - 1] : null
                    );
                  }}
                  className="text-blue-600 text-lg hover:underline"
                >
                  {crumb.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}

            {index < folderBread.length - 1 && (
              <BreadcrumbSeparator className="block">
                <ChevronRight />
              </BreadcrumbSeparator>
            )}

            {index === folderBread.length - 1 && (
              <BreadcrumbPage className="text-lg">{crumb.name}</BreadcrumbPage>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const PreviewFile = ({ preview, setPreview, selectedPreview, previewLoading }) => {


  return (
    <Dialog open={preview} onOpenChange={setPreview}>
      <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Preview file
          </DialogTitle>
          {previewLoading ? <div className="flex flex-1 items-center justify-center"> <Spinner /> </div> :
            selectedPreview &&
              selectedPreview.toLowerCase().includes("pdf") ?

              <iframe
                src={selectedPreview}

                style={{ border: "none", flex: 1 }}
              />
              :
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedPreview)}`}
                style={{ border: "none", flex: 1 }}
              />

          }
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default SuperadminDocumentManagement;
