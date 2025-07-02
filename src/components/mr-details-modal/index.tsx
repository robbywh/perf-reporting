"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface MRDetail {
  gitlabId: number;
  title: string;
}

interface MRDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mrDetails: MRDetail[];
  totalMRSubmitted: number;
  averageMRSubmitted: number;
}

export function MRDetailsModal({
  open,
  onOpenChange,
  mrDetails,
  totalMRSubmitted,
  averageMRSubmitted,
}: MRDetailsModalProps) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedMRs, setPaginatedMRs] = useState<MRDetail[]>([]);
  const itemsPerPage = 10;

  // Update pagination when MRs or page changes
  useEffect(() => {
    if (mrDetails.length > 0) {
      setTotalPages(Math.ceil(mrDetails.length / itemsPerPage));
      setPaginatedMRs(
        mrDetails.slice((page - 1) * itemsPerPage, page * itemsPerPage)
      );
    } else {
      setTotalPages(1);
      setPaginatedMRs([]);
    }
  }, [mrDetails, page, itemsPerPage]);

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  // Reset page when modal is opened
  useEffect(() => {
    if (open) {
      setPage(1);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>MR Submitted Details</DialogTitle>
        </DialogHeader>

        {/* Summary section */}
        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 font-semibold text-gray-700">Summary</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-white p-2 shadow-sm">
              <p className="text-xs text-gray-500">Total MR Submitted</p>
              <p className="font-semibold">{totalMRSubmitted}</p>
            </div>
            <div className="rounded-md bg-white p-2 shadow-sm">
              <p className="text-xs text-gray-500">Average MR/Sprint</p>
              <p className="font-semibold">{averageMRSubmitted}</p>
            </div>
          </div>
        </div>

        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px] text-center">
                  GitLab ID
                </TableHead>
                <TableHead className="text-left">Title</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMRs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    No MR found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMRs.map((mr) => (
                  <TableRow key={mr.gitlabId}>
                    <TableCell className="text-center font-medium">
                      {mr.gitlabId}
                    </TableCell>
                    <TableCell className="font-medium">{mr.title}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {mrDetails.length > 0 && (
              <>
                Showing {(page - 1) * itemsPerPage + 1} to{" "}
                {Math.min(page * itemsPerPage, mrDetails.length)} of{" "}
                {mrDetails.length} MRs
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={page === 1}
            >
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
