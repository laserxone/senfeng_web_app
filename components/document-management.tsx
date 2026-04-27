"use client"

import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import Spinner from "@/components/ui/spinner"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { supabase } from "@/lib/supabaseClient"
import { FileNode, FolderNode } from "@/lib/types"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  ChevronDown,
  ChevronRight,
  Download,
  Folder,
  FolderOpen,
  FolderPlus,
  Grid3X3,
  List,
  Plus,
  Upload
} from "lucide-react"
import moment from "moment"
import { Fragment, memo, useCallback, useEffect, useRef, useState } from "react"

export default function DocumentManagement() {
  const [folderTree, setFolderTree] = useState<FolderNode | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]))
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>("root")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [renameFolderOpen, setRenameFolderOpen] = useState(false)
  const [folderToRename, setFolderToRename] = useState<FolderNode | null>(null)
  const [parentFolderForCreate, setParentFolderForCreate] = useState<FolderNode | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileNode | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState<{ file: string; progress: number } | null>(null)
  const selectedFolder = selectedFolderId ? folderTree ? findFolderById(folderTree, selectedFolderId) : null : null
  const breadcrumbPath = selectedFolderId ? folderTree ? getFolderPath(folderTree, selectedFolderId) || [] : [] : []
  const [workingFile, setWorkingFile] = useState<string[]>([])
  const [workingFolder, setWorkingFolder] = useState<string[]>([])
  const { userID, name, email } = useUserDetail()

  useEffect(() => {
    if (userID) fetchData()
  }, [userID])

  async function fetchData() {
    axios.get(`/${userID}/dms/folder`).then((response) => {
      setFolderTree(response.data)
    })
  }


  const handleToggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])


  const handleSelectFolder = useCallback((folder: FolderNode) => {
    setSelectedFolderId(folder.id)

    setExpandedFolders((prev) => {
      const next = new Set(prev)
      next.add(folder.id)
      return next
    })
  }, [])


  const handleOpenSubfolder = useCallback((folder: FolderNode) => {
    handleSelectFolder(folder)
    const path = folderTree ? getFolderPath(folderTree, folder.id) : null
    if (path) {
      setExpandedFolders((prev) => {
        const next = new Set(prev)
        path.forEach((f) => next.add(f.id))
        return next
      })
    }
  }, [folderTree, handleSelectFolder])

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim() || !parentFolderForCreate) return
    setLoading(true)
    axios
      .post(`/${userID}/dms/folder`, {
        name: newFolderName,
        parent_folder: parentFolderForCreate?.id === 'root' ? undefined : parentFolderForCreate?.id,
      })
      .then(async (response) => {
        setNewFolderName("");
        if (!response.data?.id) {
          await fetchData()
        } else {
          const newFolder: FolderNode = {
            id: response.data?.id,
            name: newFolderName.trim(),
            parentId: parentFolderForCreate.id,
            children: [],
            files: [],
          }

          const updateTree = (node: FolderNode): FolderNode => {
            if (node.id === parentFolderForCreate.id) {
              return { ...node, children: [...node.children, newFolder] }
            }
            return { ...node, children: node.children.map(updateTree) }
          }
          if (folderTree)
            setFolderTree(updateTree(folderTree))
          setExpandedFolders((prev) => new Set([...prev, parentFolderForCreate.id]))
          setNewFolderName("")
          setCreateFolderOpen(false)
          setParentFolderForCreate(null)
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [newFolderName, parentFolderForCreate, folderTree])


  const handleRenameFolder = useCallback(() => {
    if (!newFolderName.trim() || !folderToRename) return

    setLoading(true)

    axios
      .put(`/${userID}/dms/folder/${folderToRename?.id}`, {
        name: newFolderName,
      })
      .then(async () => {
        const updateTree = (node: FolderNode): FolderNode => {
          if (node.id === folderToRename.id) {
            return { ...node, name: newFolderName.trim() }
          }
          return { ...node, children: node.children.map(updateTree) }
        }
        if (folderTree)
          setFolderTree(updateTree(folderTree))
        setNewFolderName("")
        setRenameFolderOpen(false)
        setFolderToRename(null)

      })
      .finally(() => {
        setLoading(false)
      });

  }, [newFolderName, folderToRename, folderTree])

  const handleDeleteFolder = useCallback(async (folder: FolderNode) => {
    setWorkingFolder((prev) => [...prev, folder.id])
    try {
      await axios.delete(`/${userID}/dms/folder/${folder.id}`);
      const removeFromTree = (node: FolderNode): FolderNode => {
        return {
          ...node,
          children: node.children
            .filter((child) => child.id !== folder.id)
            .map(removeFromTree),
        }
      }
      if (folderTree)
        setFolderTree(removeFromTree(folderTree))
      if (selectedFolderId === folder.id) {
        setSelectedFolderId(folder.parentId || "root")
      }
    } finally {
      setWorkingFolder((prev) => prev.filter((item) => item !== folder.id));
    }


  }, [folderTree, selectedFolderId])


  const openRenameDialog = useCallback((folder: FolderNode) => {
    setFolderToRename(folder)
    setNewFolderName(folder.name)
    setRenameFolderOpen(true)
  }, [])

  const openCreateSubfolderDialog = useCallback((parentFolder: FolderNode) => {
    setParentFolderForCreate(parentFolder)
    setNewFolderName("")
    setCreateFolderOpen(true)
  }, [])


  const handlePreview = useCallback(async (file: FileNode) => {
    setPreviewLoading(true)
    setPreviewOpen(true)

    try {
      const { data } = supabase.storage
        .from("documents")
        .getPublicUrl(file.path);
      if (data?.publicUrl) {
        setPreviewFile({ ...file, url: data.publicUrl })
      }

    } catch (error) {
      console.error("Error downloading file", error);
    } finally {
      setPreviewLoading(false);
    }
  }, [])


  const handleDownload = useCallback(async (file: FileNode) => {

    setWorkingFile((prev) => [...prev, file.id]);
    const { data, error } = await supabase.storage
      .from("documents")
      .download(file.path);
    if (error) {
      console.error("Error downloading file", error);
      return;
    }
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.path;
    link.click();
    URL.revokeObjectURL(url);
    setWorkingFile((prev) => prev.filter((item) => item !== file.id));
  }, [])


  const handleDeleteFile = useCallback(async (file: FileNode) => {

    const id = file.id;
    setWorkingFile((prev) => [...prev, id]);

    try {
      await axios.delete(`/${userID}/dms/document/${id}`);
      const paths = [file.path];
      if (file.thumbnail) paths.push(file.thumbnail);
      await supabase.storage.from("documents").remove(paths);

      const updateTree = (node: FolderNode): FolderNode => {
        if (node.id === file.folderId) {
          return { ...node, files: node.files.filter((f) => f.id !== file.id) }
        }
        return { ...node, children: node.children.map(updateTree) }
      }
      if (folderTree)
        setFolderTree(updateTree(folderTree))

    } finally {
      setWorkingFile((prev) => prev.filter((item) => item !== id));
    }

  }, [folderTree])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length || !selectedFolder) return

    const file = files[0]
    setUploadProgress({ file: file.name, progress: 0 })
    const type = getFileType(file.name)

    let thumbnail: string | undefined = undefined

    if (type === 'video') {
      try {
        const blob = await getVideoThumbnailFromFile(file);
        if (blob) {
          const thumbnailPath = `thumbnails/${file.name}`;
          const { error } = await supabase.storage
            .from("documents")
            .upload(thumbnailPath, blob, {
              contentType: "image/jpeg",
            });
          if (!error) {
            thumbnail = thumbnailPath;
          } else {
            console.log("Thumbnail upload failed", error);
          }
        }
      } catch (error) {
        console.log("Thumbnail generation failed", error);
      }

    }

    let res: { path?: string } = {};
    try {
      res = await uploadWithProgress(file, (p) =>
        setUploadProgress({ file: file.name, progress: p })
      );
    } catch (err) {
      if (thumbnail) {
        await supabase.storage.from("documents").remove([thumbnail]);
      }
      setUploadProgress(null);
      return;

    }


    if (res.path) {
      try {
        const response = await axios.post(`/${userID}/dms/document`, {
          added_by: name || email,
          path: res.path,
          folder_id: selectedFolder?.id === 'root' ? undefined : selectedFolder.id,
          type,
          size: file.size,
          thumbnail_path: thumbnail
        })

        const returningId = response.data?.id

        if (!returningId) {
          await fetchData()
        } else {
          const newFile: FileNode = {
            id: returningId,
            name: file.name,
            path: res.path,
            folderId: selectedFolder.id,
            type,
            size: file.size,
            createdAt: new Date().toISOString().split("T")[0],
            addedBy: name,
            thumbnail
          }

          const updateTree = (node: FolderNode): FolderNode => {
            if (node.id === selectedFolder.id) {
              return { ...node, files: [...node.files, newFile] }
            }
            return { ...node, children: node.children.map(updateTree) }
          }
          if (folderTree)
            setFolderTree(updateTree(folderTree))
        }
      } catch (error) {
        console.log(error)
        await supabase.storage.from("documents").remove(
          [res.path, ...(thumbnail ? [thumbnail] : [])]
        );
      } finally {
        setUploadProgress(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
  }, [selectedFolder, folderTree])

  const officeFile = previewFile
    ? previewFile?.path
      ?.toLowerCase()
      ?.match(/\.(xlsx|xls|csv|doc|docx|ppt|pptx)$/)
    : false;

  return (
    <div className="h-screen flex flex-col bg-background w-full">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={!selectedFolder}
        >
          <Download className="h-4 w-4 mr-2" />
          Upload
        </Button>
        <Button
          variant="ghost"
          onClick={() => selectedFolder && openCreateSubfolderDialog(selectedFolder)}
          disabled={!selectedFolder}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden border-t">
        <aside className="w-72 border-r flex flex-col shrink-0 bg-muted/30">
          <div className="px-3 h-11.25 border-b flex items-center">
            <h2 className="text-sm font-medium text-muted-foreground px-2">Folders</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {folderTree &&
                <FolderTreeItem
                  folder={folderTree}
                  expandedFolders={expandedFolders}
                  selectedFolderId={selectedFolderId}
                  onToggle={handleToggleFolder}
                  onSelect={handleSelectFolder}
                  onRename={openRenameDialog}
                  onDelete={handleDeleteFolder}
                  onCreateSubfolder={openCreateSubfolderDialog}
                  workingFolder={workingFolder}
                />
              }
            </div>
          </ScrollArea>
        </aside>


        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b px-4 h-11.25 flex items-center justify-between shrink-0">
            <nav className="flex items-center gap-1 text-sm">
              {breadcrumbPath.map((folder, index) => (
                <Fragment key={folder.id}>
                  {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  {index < breadcrumbPath.length - 1 ? (
                    <button
                      className="text-primary hover:underline"
                      onClick={() => handleSelectFolder(folder)}
                    >
                      {folder.name}
                    </button>
                  ) : (
                    <span className="text-foreground font-medium">{folder.name}</span>
                  )}
                </Fragment>
              ))}
            </nav>

            <div className="flex items-center gap-1 border rounded-md p-0.5">
              <button
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "grid" ? "bg-muted" : "hover:bg-muted/50"
                )}
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "list" ? "bg-muted" : "hover:bg-muted/50"
                )}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {uploadProgress && (
            <div className="px-4 py-2 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <Spinner className="h-4 w-4" />
                <span className="text-sm flex-1 truncate">Uploading: {uploadProgress.file}</span>
                <span className="text-sm text-muted-foreground">{uploadProgress.progress}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            {selectedFolder ? (
              <>
                {viewMode === "list" && (selectedFolder.children.length > 0 || selectedFolder.files.length > 0) && (
                  <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
                    <span className="w-5" />
                    <span className="flex-1">Name</span>
                    <span className="w-20 text-right">Size</span>
                    <span className="w-24">Date</span>
                    <span className="w-28">Added by</span>
                  </div>
                )}

                {viewMode === "grid" ? (
                  <div className="p-4 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
                    {selectedFolder.children.map((subfolder) => (
                      <SubfolderItem
                        key={subfolder.id}
                        folder={subfolder}
                        viewMode={viewMode}
                        onOpen={handleOpenSubfolder}
                        onRename={openRenameDialog}
                        onDelete={handleDeleteFolder}
                        workingFolder={workingFolder}
                      />
                    ))}
                    {selectedFolder.files.map((file) => (
                      <FileGridItem
                        key={file.id}
                        file={file}
                        onPreview={handlePreview}
                        onDownload={handleDownload}
                        onDelete={handleDeleteFile}
                        workingFile={workingFile}

                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    {selectedFolder.children.map((subfolder) => (
                      <SubfolderItem
                        key={subfolder.id}
                        folder={subfolder}
                        viewMode={viewMode}
                        onOpen={handleOpenSubfolder}
                        onRename={openRenameDialog}
                        onDelete={handleDeleteFolder}
                        workingFolder={workingFolder}
                      />
                    ))}
                    {selectedFolder.files.map((file) => (
                      <FileListItem
                        key={file.id}
                        file={file}
                        onPreview={handlePreview}
                        onDownload={handleDownload}
                        onDelete={handleDeleteFile}
                        workingFile={workingFile}
                      />
                    ))}
                  </div>
                )}


                {selectedFolder.children.length === 0 && selectedFolder.files.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Folder className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium">This folder is empty</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload files or create subfolders to get started
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openCreateSubfolderDialog(selectedFolder)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Folder
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a folder to view its contents</p>
              </div>
            )}
          </ScrollArea>
        </main>
      </div>

      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="mt-2"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
            {parentFolderForCreate && (
              <p className="text-xs text-muted-foreground mt-2">
                Will be created in: {parentFolderForCreate.name}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || loading}>
              {loading && <Spinner className="mr-2 h-4 w-4" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameFolderOpen} onOpenChange={setRenameFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rename-folder">Folder Name</Label>
            <Input
              id="rename-folder"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter new name"
              className="mt-2"
              onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRenameFolder} disabled={!newFolderName.trim() || loading}>
              {loading && <Spinner className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-full sm:max-w-[90vw] h-[90vh]">
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>Preview</DialogTitle>
            </DialogHeader>
          </VisuallyHidden>
          <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg">
            {previewLoading ? (
              <Spinner className="h-8 w-8" />
            ) : previewFile ?
              !officeFile ? (
                <iframe
                  src={previewFile.url}
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
                    previewFile.url || ""
                  )}`}
                  style={{
                    border: "none",
                    flex: 1,
                    width: "100%",
                    height: "100%",
                  }}
                />
              ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


const FolderTreeItem = memo(({
  folder,
  level = 0,
  expandedFolders,
  selectedFolderId,
  onToggle,
  onSelect,
  onRename,
  onDelete,
  onCreateSubfolder,
  workingFolder
}: {
  folder: FolderNode
  level?: number
  expandedFolders: Set<string>
  selectedFolderId: string | null
  onToggle: (id: string) => void
  onSelect: (folder: FolderNode) => void
  onRename: (folder: FolderNode) => void
  onDelete: (folder: FolderNode) => void
  onCreateSubfolder: (parentFolder: FolderNode) => void
  workingFolder: string[]
}) => {
  const isExpanded = expandedFolders.has(folder.id)
  const isSelected = selectedFolderId === folder.id
  const hasChildren = folder.children.length > 0
  const { isAdmin } = useUserDetail()
  const isWorking = workingFolder.includes(folder.id) || workingFolder.includes(folder.parentId as string)

  return (
    <div>
      <ContextMenu modal={false}>
        <ContextMenuTrigger asChild>
          <div

            className={cn(
              "flex items-center gap-1 py-1.5 px-2 cursor-pointer rounded-md transition-colors group",
              isSelected
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => !isWorking && onSelect(folder)}
          >
            <button

              className={cn(
                "p-0.5 rounded hover:bg-accent transition-colors",
                !hasChildren && "invisible"
              )}
              disabled={isWorking}
              onClick={(e) => {
                e.stopPropagation()
                onToggle(folder.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <div className="relative">
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-amber-500 shrink-0" />
              )}

              {isWorking && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded">
                  <Spinner className="h-5 w-5 text-destructive" />
                </div>
              )}
            </div>

            <span className="text-sm line-clamp-1 flex-1">{folder.name}</span>
            {(folder.files.length > 0 || folder.children.length > 0) && (
              <span className="text-xs text-muted-foreground">
                {folder.files.length + folder.children.length}
              </span>
            )}
          </div>
        </ContextMenuTrigger>
        {folder.id !== 'root' &&
          <ContextMenuContent>
            <ContextMenuItem disabled={isWorking} onClick={() => onSelect(folder)}>
              Open
            </ContextMenuItem>
            <ContextMenuItem disabled={isWorking} onClick={() => onCreateSubfolder(folder)}>
              New Subfolder
            </ContextMenuItem>
            <ContextMenuItem disabled={isWorking} onClick={() => onRename(folder)}>
              Rename
            </ContextMenuItem>
            {isAdmin &&
              <ContextMenuItem
                disabled={isWorking}
                className="text-destructive"
                onClick={() => onDelete(folder)}
              >
                Delete
              </ContextMenuItem>
            }
          </ContextMenuContent>
        }
      </ContextMenu>

      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              selectedFolderId={selectedFolderId}
              onToggle={onToggle}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onCreateSubfolder={onCreateSubfolder}
              workingFolder={workingFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
})
FolderTreeItem.displayName = "FolderTreeItem"


const FileGridItem = memo(({
  file,
  onPreview,
  onDownload,
  onDelete,
  workingFile
}: {
  file: FileNode
  onPreview: (file: FileNode) => void
  onDownload: (file: FileNode) => void
  onDelete: (file: FileNode) => void
  workingFile: string[]
}) => {
  const { isAdmin } = useUserDetail()
  const isWorking = workingFile.includes(file.id)
  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        <div
          className="flex flex-col items-center p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 cursor-pointer transition-all group"
          onDoubleClick={() => onPreview(file)}
        >
          <div className="relative h-16 w-16 flex items-center justify-center mb-2">
            <RenderFileIcon file={file} size="h-16 w-16" />
            {isWorking && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded">
                <Spinner className="h-5 w-5 text-destructive" />
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-center max-w-30 line-clamp-2">
            {file.name}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {formatFileSize(file.size)}
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={isWorking} onClick={() => onPreview(file)}>
          Preview
        </ContextMenuItem>
        <ContextMenuItem disabled={isWorking} onClick={() => onDownload(file)}>
          Download
        </ContextMenuItem>
        {isAdmin &&
          <ContextMenuItem
            disabled={isWorking}
            className="text-destructive"
            onClick={() => onDelete(file)}
          >
            Delete
          </ContextMenuItem>
        }

      </ContextMenuContent>
    </ContextMenu>
  )
})

FileGridItem.displayName = "FileGridItem"

const RenderFileIcon = ({ file, size = "h-5 w-5" }: { file: FileNode, size?: string }) => {

  const [imageLoading, setImageLoading] = useState(false)
  const path = file.path
  const [url, setUrl] = useState<string>("/file-icon.png")


  function generateImage(p?: string) {
    if (!p) return
    try {

      const { data } = supabase.storage
        .from("documents")
        .getPublicUrl(p);
      if (data.publicUrl) {
        setUrl(data.publicUrl);
        setImageLoading(false)
      }
    } catch (err) {
      console.error("Error generating video thumbnail", err);
      setImageLoading(false);
    }
  }


  useEffect(() => {
    if (file) {
      if (file.type === "image") {
        generateImage(file.path)
      } else if (file?.type === 'video') {
        generateImage(file?.thumbnail)
      } else if (file?.type === 'pdf') {
        setUrl("/pdf-icon.png")
      } else if (file?.type?.includes("doc")) setUrl("/docx-icon.png");
      else if (file?.type?.includes("excel")) setUrl("/xlsx-icon.png")
      else if (file?.type?.includes("ppt")) setUrl("/ppt-icon.png")
      else {
        setUrl("/file-icon.png")
      }
    }
  }, [file])

  return (
    imageLoading ? <Spinner /> : <img
      src={url}
      alt={`${path}-file`}
      className={`${size} object-contain`}
    />
  )

}
const FileListItem = memo(({
  file,
  onPreview,
  onDownload,
  onDelete,
  workingFile
}: {
  file: FileNode
  onPreview: (file: FileNode) => void
  onDownload: (file: FileNode) => void
  onDelete: (file: FileNode) => void
  workingFile: string[]
}) => {
  const { isAdmin } = useUserDetail()
  const isWorking = workingFile.includes(file.id)
  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        <div
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50"
          onDoubleClick={() => onPreview(file)}
        >
          <div className="relative">
            <RenderFileIcon file={file} />
            {isWorking && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded">
                <Spinner className="h-5 w-5 text-destructive" />
              </div>
            )}
          </div>
          <span className="text-sm font-medium flex-1 truncate">{file.name}</span>
          <span className="text-xs text-muted-foreground w-20 text-right">
            {formatFileSize(file.size)}
          </span>
          <span className="text-xs text-muted-foreground w-24">
            {moment(file.createdAt).format("YYYY-MM-DD")}
          </span>
          <span className="text-xs text-muted-foreground w-28 truncate">
            {file.addedBy}
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={isWorking} onClick={() => onPreview(file)}>
          Preview
        </ContextMenuItem>
        <ContextMenuItem disabled={isWorking} onClick={() => onDownload(file)}>
          Download
        </ContextMenuItem>
        {isAdmin &&
          <ContextMenuItem
            disabled={isWorking}
            className="text-destructive"
            onClick={() => onDelete(file)}
          >
            Delete
          </ContextMenuItem>
        }
      </ContextMenuContent>
    </ContextMenu>
  )
})
FileListItem.displayName = "FileListItem"


const SubfolderItem = memo(({
  folder,
  viewMode,
  onOpen,
  onRename,
  onDelete,
  workingFolder
}: {
  folder: FolderNode
  viewMode: "grid" | "list"
  onOpen: (folder: FolderNode) => void
  onRename: (folder: FolderNode) => void
  onDelete: (folder: FolderNode) => void
  workingFolder: string[]
}) => {
  const { isAdmin } = useUserDetail()
   const isWorking = workingFolder.includes(folder.id) || workingFolder.includes(folder.parentId as string)
  if (viewMode === "grid") {
    return (
      <ContextMenu modal={false}>
        <ContextMenuTrigger asChild>
          <div
            className="flex flex-col items-center p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 cursor-pointer transition-all"
            onDoubleClick={() => onOpen(folder)}
          >
            <div className="relative h-16 w-16 flex items-center justify-center mb-2">
              <Folder className="h-14 w-14 text-amber-500" />
              {isWorking && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded">
                  <Spinner className="h-5 w-5 text-destructive" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-center max-w-30">
              {folder.name}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {folder.files.length + folder.children.length} items
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem disabled={isWorking} onClick={() => onOpen(folder)}>
            Open
          </ContextMenuItem>
          <ContextMenuItem disabled={isWorking} onClick={() => onRename(folder)}>
            Rename
          </ContextMenuItem>
          {isAdmin &&
            <ContextMenuItem
              disabled={isWorking}
              className="text-destructive"
              onClick={() => onDelete(folder)}
            >
              Delete
            </ContextMenuItem>
          }
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        <div
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50"
          onDoubleClick={() => onOpen(folder)}
        >
          <div className="relative">
            <Folder className="h-5 w-5 text-amber-500" />
            {isWorking && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded">
                <Spinner className="h-5 w-5 text-destructive" />
              </div>
            )}
          </div>

          <span className="text-sm font-medium flex-1 truncate">{folder.name}</span>
          <span className="text-xs text-muted-foreground w-20 text-right">
            --
          </span>
          <span className="text-xs text-muted-foreground w-24">
            --
          </span>
          <span className="text-xs text-muted-foreground w-28 truncate">
            {folder.files.length + folder.children.length} items
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={isWorking} onClick={() => onOpen(folder)}>
          Open
        </ContextMenuItem>
        <ContextMenuItem disabled={isWorking} onClick={() => onRename(folder)}>
          Rename
        </ContextMenuItem>
        {isAdmin &&
          <ContextMenuItem
            disabled={isWorking}
            className="text-destructive"
            onClick={() => onDelete(folder)}
          >
            Delete
          </ContextMenuItem>
        }
      </ContextMenuContent>
    </ContextMenu>
  )
})
SubfolderItem.displayName = "SubfolderItem"

const getFileType = (path: string) => {
  const fileExt = path?.toLowerCase();
  const isImage = fileExt?.match(/\.(jpg|jpeg|png|gif|webp)$/);
  const isVideo = fileExt?.match(/\.(mp4|mov|webm|mkv)$/);

  let type = "file";

  if (fileExt.includes("pdf")) type = "pdf";
  else if (fileExt.includes("doc")) type = "doc";
  else if (fileExt.includes("xls")) type = "excel";
  else if (fileExt.includes("ppt")) type = "ppt";
  else if (isImage) type = "image";
  else if (isVideo) type = "video";

  return type;
};

async function uploadWithProgress(file: File, onProgress?: (progress: number) => void): Promise<{ path: string }> {
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
          onProgress?.(percent)
        }
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        resolve({ path: filePath })
      } else {
        reject(xhr.response);
      }
    };

    xhr.onerror = () => reject("Upload failed");

    xhr.send(file);
  });
}

async function getVideoThumbnailFromFile(
  file: File
): Promise<Blob | null> {
  const videoUrl = URL.createObjectURL(file);

  const video = document.createElement("video");
  video.src = videoUrl;
  video.muted = true;

  await new Promise<void>((resolve) => {
    video.onloadeddata = () => resolve();
  });

  video.currentTime = Math.min(1, video.duration || 1);

  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
  });

  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.7)
  );

  // ✅ cleanup (important)
  URL.revokeObjectURL(videoUrl);
  video.remove();
  canvas.remove();

  return blob;
}

function findFolderById(node: FolderNode, id: string): FolderNode | null {
  if (node.id === id) return node
  for (const child of node.children) {
    const found = findFolderById(child, id)
    if (found) return found
  }
  return null
}

function getFolderPath(node: FolderNode, targetId: string, path: FolderNode[] = []): FolderNode[] | null {
  if (node.id === targetId) return [...path, node]
  for (const child of node.children) {
    const found = getFolderPath(child, targetId, [...path, node])
    if (found) return found
  }
  return null
}


function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}