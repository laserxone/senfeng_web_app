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
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { supabase } from "@/lib/supabaseClient";
import { ChevronRight, List, Table2 } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import React, {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ProgressWithLabel } from "./progress-with-label";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
type FolderItem = {
  id: string | number;
  name: string;
};

type RenderEachFolderProps = {
  item: FolderItem;
  index: number;
  view: boolean;
  setFolderBread: React.Dispatch<
    React.SetStateAction<{ name: string; id: string | number }[]>
  >;
  setCurrentFolder: React.Dispatch<
    React.SetStateAction<{ name: string; id: string | number } | null>
  >;
  setSelectedFolder: React.Dispatch<any>;
  setNewName: React.Dispatch<React.SetStateAction<string>>;
  fetchFiles: () => Promise<void>;
};
type PreviewFileProps = {
  preview: boolean;
  setPreview: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPreview: string | null;
  previewLoading: boolean;
};
const videoThumbnailCache = {};

const DocumentManagement = () => {
  const [selectedFile, setSelectedFile] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userID, name, email, dms_write_access, isAdmin } = useUserDetail();
 
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [visible, setVisible] = useState(false);
  const [allFolders, setAllFolders] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [folderBread, setFolderBread] = useState([{ name: "root", id: null }]);
  const [folderLoading, setFolderLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newName, setNewName] = useState("");
  const [view, setView] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState({
    file: "",
    progress: 0,
    track: 0,
  });

  useEffect(() => {
    if (userID) {
      setLoading(true);
      fetchFiles();
    }
  }, [userID, currentFolder]);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await axios.get(
        `/${userID}/folder?folder=${currentFolder?.id || null}`,
      );
      setAllDocuments(response.data.documents);
      setAllFolders(response.data.folders);
      setLoading(false);
      setUploadLoading(false);
    } catch (error) {
      console.log(error);
    }
  }, [userID, currentFolder]);

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
    for (const [index, file] of selectedFile.entries()) {
      try {
        await uploadWithProgress(file, index);
      } catch (err) {
        toast({
          title: `Error uploading ${file.name}`,
          description: JSON.parse(err)?.message,
          variant: "destructive",
        });
        continue;
      }
    }

    setSelectedFile([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setUploadingStatus({ file: "", progress: 0, track: 0 });

    await fetchFiles();
    setUploadLoading(false);
  }

  async function uploadWithProgress(file, idx) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      const filePath = file.name;
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/documents/${filePath}`;

      xhr.open("POST", url, true);
      xhr.setRequestHeader(
        "Authorization",
        `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      );
      xhr.setRequestHeader("Content-Type", file.type);

      let lastProgress = 0;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          if (percent !== lastProgress) {
            lastProgress = percent;

            setUploadingStatus({
              file: file.name,
              progress: percent,
              track: idx + 1,
            });
          }
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            await axios.post(`/${userID}/document`, {
              added_by: name || email,
              path: filePath,
              folder_id: currentFolder ? currentFolder.id : undefined,
            });

            resolve(true);
          } catch (err) {
            reject("DB save failed");
          }
        } else {
          reject(xhr.response);
        }
      };

      xhr.onerror = () => reject("Upload failed");

      xhr.send(file);
    });
  }

  async function handleCreateFolder() {
    setFolderLoading(true);
    axios
      .post(`/${userID}/folder`, {
        name: folderName,
        parent_folder: currentFolder ? currentFolder?.id : undefined,
      })
      .then(async () => {
        setFolderName("");
        setVisible(false);
        await fetchFiles();
      })
      .finally(() => {
        setFolderLoading(false);
      });
  }

  async function handleRenameFolder() {
    if (!selectedFolder) return;
    setFolderLoading(true);
    axios
      .put(`/${userID}/folder/${selectedFolder?.id}`, {
        name: newName,
      })
      .then(async () => {
        setNewName("");
        setSelectedFolder(false);
        await fetchFiles();
      })
      .finally(() => {
        setFolderLoading(false);
      });
  }

  const handlePreview = useCallback(async (path) => {
    setPreviewLoading(true);
    setPreview(true);
    try {
      const { data } = await supabase.storage
        .from("documents")
        .getPublicUrl(path);

     

      setSelectedPreview(data.publicUrl);
    }catch(error) {
        console.error("Error downloading file", error);
      } finally {
      setPreviewLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-col space-y-4">
        <Heading
          title="Documents Management"
          description="Manage office documents"
        />
        {dms_write_access && (
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
            <Button onClick={() => setVisible(true)}>Create new folder</Button>
          </div>
        )}
      </div>

      {uploadLoading && (
        <ProgressWithLabel
          status={uploadingStatus}
          total={selectedFile?.length}
        />
      )}

      <div>
        <div className="flex justify-between items-center bg-gray-200 dark:bg-gray-800 mb-2 pr-2">
          <div className="flex space-x-2 p-2 ">
            <MyBreadcrumb
              folderBread={folderBread}
              setCurrentFolder={setCurrentFolder}
              setFolderBread={setFolderBread}
            />
          </div>
          {!view ? (
            <Table2 className="cursor-pointer" onClick={() => setView(!view)} />
          ) : (
            <List className="cursor-pointer" onClick={() => setView(!view)} />
          )}
        </div>

        {loading ? (
          <div className="flex flex-c items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div
            className={
              view ? "flex flex-col" : "flex flex-row gap-4 flex-wrap"
            }
          >
            {allFolders.map((item, index) => (
              <RenderEachFolder
                key={item.id}
                item={item}
                index={index}
                view={view}
                setCurrentFolder={setCurrentFolder}
                setFolderBread={setFolderBread}
                setNewName={setNewName}
                setSelectedFolder={setSelectedFolder}
                fetchFiles={fetchFiles}
              />
            ))}

            {allDocuments.map((item) => (
               <RenderEachFile
                key={item.id}
                onRefresh={fetchFiles}
                item={item}
                // view={view}
                onPreview={handlePreview}
              />
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
            <Button onClick={handleCreateFolder}>
              {folderLoading && <Spinner />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedFolder}
        onOpenChange={() => setSelectedFolder(null)}
      >
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
            <Button
              disabled={!newName || folderLoading}
              onClick={handleRenameFolder}
            >
              {folderLoading && <Spinner />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PreviewFile
        preview={preview}
        setPreview={setPreview}
        previewLoading={previewLoading}
        selectedPreview={selectedPreview}
      />
    </div>
  );
};
type FileItem = {
  id: string | number;
  path: string;
  created_at?: string;
  added_by?: string;
};

type RenderEachFileProps = {
  item: FileItem;
  onPreview: (path: string) => void;
  onRefresh: () => Promise<void> | void;
};
const RenderEachFile = memo(({ item, onPreview, onRefresh }:RenderEachFileProps) => {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const { isAdmin, userID } = useUserDetail();

  async function handleDelete(file) {
    const id = file.id;
    await axios
      .delete(`/${userID}/document/${id}`)
      .then(async () => {
        await supabase.storage.from("documents").remove([file.path]);
        await onRefresh();
      })
      .finally(() => {
        setDeleteLoading(false);
      });
  }

const RenderFile = memo(
  ({ path }:{path:string}) => {
    const [thumbnail, setThumbnail] = useState(null);
    const [loadingThumb, setLoadingThumb] = useState(false);
    const fileExt = path?.toLowerCase();
    const isImage = fileExt?.match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isVideo = fileExt?.match(/\.(mp4|mov|webm|mkv)$/);

    useEffect(() => {
      if (!isVideo) return;

      if (videoThumbnailCache[path]) {
        setThumbnail(videoThumbnailCache[path]);
        return;
      }

      setLoadingThumb(true);

      const generateThumbnail = async () => {
        try {
          const videoUrl = supabase.storage
            .from("documents")
            .getPublicUrl(path).data.publicUrl;
          if (!videoUrl) return;

          const video = document.createElement("video");
          video.src = videoUrl;
          video.crossOrigin = "anonymous";
          video.currentTime = 1;
          video.muted = true;
          video.play().catch(() => {});

          video.addEventListener("loadeddata", () => {
            const canvas = document.createElement("canvas");
            canvas.width = 100;
            canvas.height = 100; 
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL("image/jpeg");
              videoThumbnailCache[path] = dataUrl;
              setThumbnail(dataUrl);
              setLoadingThumb(false);
            }
          });
        } catch (err) {
          console.error("Error generating video thumbnail", err);
          setLoadingThumb(false);
        }
      };

      generateThumbnail();

    }, [path, isVideo]);

    let url = "/file-icon.png";

    if (fileExt.includes("pdf")) url = "/pdf-icon.png";
    else if (fileExt.includes("doc")) url = "/docx-icon.png";
    else if (fileExt.includes("xls")) url = "/xlsx-icon.png";
    else if (fileExt.includes("ppt")) url = "/ppt-icon.png";
    else if (isImage) {
      const { data } = supabase.storage
        .from("superadmin.documents")
        .getPublicUrl(path);
      if (data.publicUrl) url = data.publicUrl;
    } else if (isVideo) {
      url = thumbnail || "/mp4-icon.png";
    }

    return (
      <div className={`max-w-md break-all flex flex-col`}>
        {loadingThumb ? (
          <div
            className="flex items-center justify-center"
            style={{ width: 100, height: 100 }}
          >
            <Spinner />
          </div>
        ) : (
          <div className="w-[100px] h-[120px] overflow-hidden flex justify-center">
          <Image
            src={url}
            height={100}
            width={100}
            alt={`${path}-file`}
            className="object-cover"
          />
          </div>
        )}
        <Label className={"mt-1"}>{path}</Label>
      </div>
    );
  },
  (prev, next) => prev.path === next.path,
);

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger
        onDoubleClick={() => {
          onPreview(item.path);
        }}
      >
        <div
          className={`flex flex-col justify-center min-h-[120px] p-2 rounded cursor-pointer max-w-[150px]`}
          style={{
            border: "1px solid transparent",
            backgroundColor: "transparent",
          }}
        >
          {downloadLoading || deleteLoading ? (
            <Spinner />
          ) : (
            <RenderFile path={item.path} />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={async () => {
            onPreview(item.path);
          }}
        >
          Preview
        </ContextMenuItem>

        <ContextMenuItem
          onClick={async () => {
            setDownloadLoading(true);
            const { data, error } = await supabase.storage
              .from("documents")
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
        {isAdmin && (
          <ContextMenuItem
            onClick={async () => {
              setDeleteLoading(true);
              await handleDelete(item);
            }}
          >
            Delete
          </ContextMenuItem>
        )}

        <ContextMenuItem className="hover:none">
          <div className="flex flex-1 flex-col">
            <Label>Date : {moment(item.created_at).format("YYYY-MM-DD")}</Label>
            <Label>Uploaded by : {item.added_by}</Label>
          </div>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

const RenderEachFolder = memo(
  ({
    item,
    index,
    view,
    setFolderBread,
    setCurrentFolder,
    setSelectedFolder,
    setNewName,
    fetchFiles,
  }:RenderEachFolderProps  ) => {
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { userID } = useUserDetail();
    async function handleDeleteFolder(id) {
      try {
        setDeleteLoading(true);
        await axios.delete(`/${userID}/folder/${id}`);
        await fetchFiles();
      } finally {
        setDeleteLoading(false);
      }
    }

    const openFolder = () => {
      setFolderBread((prev) => [...prev, { name: item.name, id: item.id }]);
      setCurrentFolder({ name: item.name, id: item.id });
    };

    return (
      <ContextMenu modal={false}>
        <ContextMenuTrigger onDoubleClick={openFolder}>
          <div
            className={`flex ${view ? "flex-row items-center gap-4" : "flex-col items-center justify-center"} ${view ? "p-0" : "p-2"} rounded cursor-pointer ${view ? "w-full" : "max-w-[150px]"} ${view ? "h-auto" : "min-h-[120px]"} `}
            style={{
              border: "1px solid transparent",
              backgroundColor: "transparent",
            }}
          >
            {deleteLoading ? (
              <Spinner />
            ) : (
              <>
                <Image
                  src="/folder-icon.png"
                  height={view ? 40 : 100}
                  width={view ? 40 : 100}
                  alt={`${index}-folder`}
                />
                <Label className={view ? "text-left" : "text-center"}>
                  {item.name}
                </Label>
              </>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={openFolder}>Open</ContextMenuItem>

          <ContextMenuItem
            onClick={() => {
              setSelectedFolder(item);
              setNewName(item.name);
            }}
          >
            Rename
          </ContextMenuItem>

          <ContextMenuItem onClick={() => handleDeleteFolder(item.id)}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
);

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
                      path[path.length - 1]?.id ? path[path.length - 1] : null,
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
  );
};



const PreviewFile = React.memo(
  ({
    preview,
    setPreview,
    selectedPreview,
    previewLoading,
  }: PreviewFileProps) => {
    const officeFile = selectedPreview
      ? selectedPreview
          ?.toLowerCase()
          ?.match(/\.(xlsx|xls|csv|doc|docx|ppt|pptx)$/)
      : false;

    return (
      <Dialog open={preview} onOpenChange={setPreview}>
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh]">
          <div className="flex-1">
            {previewLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Spinner />
              </div>
            ) : selectedPreview && !officeFile ? (
              <iframe
                src={selectedPreview}
                style={{
                  border: "none",
                  flex: 1,
                  width: "100%",
                  height: "100%",
                }}
              />
            ) : (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                  selectedPreview || ""
                )}`}
                style={{
                  border: "none",
                  flex: 1,
                  width: "100%",
                  height: "100%",
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

export default DocumentManagement;
