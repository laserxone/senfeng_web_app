"use client";

import { useTransition } from "react";
import { deleteResume } from "@/actions/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Resume = {
  id: string;
  fullName: string;
  emailAddress: string;
  phoneNumber?: string;
  currentLocation?: string;
  positionAppliedFor?: string;
  experienceYears?: number;
  coverLetter?: string;
  status?: string;
  cvUrl?: string;
  cvDownloadUrl?: string | null;
};

export default function ResumesTable({ resumes }: { resumes: Resume[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Resume Applications
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              View submitted applications and open uploaded CVs.
            </p>
          </div>

          <Card className="w-[190px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{resumes.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
          </CardHeader>

          <CardContent>
            {resumes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <h2 className="text-lg font-medium">No applications yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  New submissions will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {resumes.map((resume) => (
                      <TableRow key={resume.id}>
                        <TableCell>
                          <div className="font-medium">{resume.fullName}</div>
                          <div className="text-sm text-muted-foreground">
                            {resume.emailAddress}
                          </div>
                        </TableCell>

                        <TableCell>{resume.phoneNumber || "-"}</TableCell>
                        <TableCell>{resume.currentLocation || "-"}</TableCell>
                        <TableCell>{resume.positionAppliedFor || "-"}</TableCell>

                        <TableCell>
                          {resume.experienceYears ?? 0} years
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary">
                            {resume.status || "new"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {resume.cvDownloadUrl ? (
                              <Button asChild size="sm">
                                <a
                                  href={resume.cvDownloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open CV
                                </a>
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                No CV
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isPending}
                                >
                                  Delete
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete this application?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will delete the resume entry and remove
                                    the uploaded CV from Firebase Storage.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>

                                  <AlertDialogAction
                                    onClick={() => {
                                      startTransition(async () => {
                                        await deleteResume(resume.id);
                                      });
                                    }}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}