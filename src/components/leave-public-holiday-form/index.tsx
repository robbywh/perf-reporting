"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Skeleton } from "../ui/skeleton";

// Data structure
interface LeaveData {
  name: string;
  description: string;
  date: string;
}

interface HolidayData {
  description: string;
  date: string;
}

interface SprintData {
  sprintName: string;
  leaves: LeaveData[];
  holidays: HolidayData[];
}

interface LeavePublicHolidayProps {
  sprints: SprintData[];
}

export function LeavePublicHoliday({ sprints }: LeavePublicHolidayProps) {
  const [mounted, setMounted] = React.useState(false);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [isLeaveForm, setIsLeaveForm] = React.useState(true);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    date: "",
  });
  const [deleteTarget, setDeleteTarget] = React.useState<{
    type: "leave" | "holiday";
    sprintIndex: number;
    index: number;
  } | null>(null);

  const [sprintData, setSprintData] = React.useState<SprintData[]>(sprints);

  React.useEffect(() => {
    setMounted(true); // Prevent hydration mismatch
  }, []);

  if (!mounted) return null;

  // ✅ Open delete confirmation dialog
  const confirmDelete = (
    type: "leave" | "holiday",
    sprintIndex: number,
    index: number
  ) => {
    setDeleteTarget({ type, sprintIndex, index });
    setDeleteDialog(true);
  };

  // ✅ Handle actual delete after confirmation
  const handleDelete = () => {
    if (!deleteTarget) return;

    setSprintData((prevSprints) => {
      const newSprints = [...prevSprints];
      const { type, sprintIndex, index } = deleteTarget;

      if (type === "leave") {
        newSprints[sprintIndex].leaves.splice(index, 1);
      } else {
        newSprints[sprintIndex].holidays.splice(index, 1);
      }

      return newSprints;
    });

    // Close dialog after deletion
    setDeleteDialog(false);
    setDeleteTarget(null);
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Public Holiday &amp; Leave</h1>
        <Button onClick={() => setOpenDialog(true)}>
          Add Public Holiday / Leave
        </Button>
      </div>

      {/* Swiper for Sprint Data */}
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={30}
        slidesPerView={1}
      >
        {sprintData.map((sprint, sprintIndex) => (
          <SwiperSlide key={sprint.sprintName}>
            <div className="space-y-4 px-20 pb-20">
              <h2 className="text-center text-xl font-semibold">
                {sprint.sprintName}
              </h2>
              <div className="grid grid-cols-2 gap-8">
                {/* Leaves Table */}
                <div className="border-r border-gray-300 pr-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sprint.leaves.length > 0 ? (
                        sprint.leaves.map((leave, leaveIndex) => (
                          <TableRow key={leaveIndex}>
                            <TableCell>
                              <div className="font-semibold">{leave.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {leave.description}
                              </div>
                            </TableCell>
                            <TableCell>{leave.date}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  confirmDelete(
                                    "leave",
                                    sprintIndex,
                                    leaveIndex
                                  )
                                }
                              >
                                <Trash2 className="size-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            <p className="mt-10 text-lg">No leaves recorded</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Holidays Table */}
                <div className="pl-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Public Holiday</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sprint.holidays.length > 0 ? (
                        sprint.holidays.map((holiday, holidayIndex) => (
                          <TableRow key={holidayIndex}>
                            <TableCell>{holiday.description}</TableCell>
                            <TableCell>{holiday.date}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  confirmDelete(
                                    "holiday",
                                    sprintIndex,
                                    holidayIndex
                                  )
                                }
                              >
                                <Trash2 className="size-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            <p className="mt-10 text-lg">
                              No holidays recorded
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Dialog: Add Leave/Public Holiday */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Public Holiday / Leave</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <Label htmlFor="typeSelect">Type</Label>
            <select
              id="typeSelect"
              className="h-9 w-full rounded-md border px-2"
              value={isLeaveForm ? "leave" : "holiday"}
              onChange={(e) => setIsLeaveForm(e.target.value === "leave")}
            >
              <option value="leave">Leave</option>
              <option value="holiday">Public Holiday</option>
            </select>

            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder={isLeaveForm ? "Engineer Name" : "Holiday Name"}
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />

            {isLeaveForm && (
              <>
                <Label htmlFor="description">Leave Type</Label>
                <Input
                  id="description"
                  placeholder="Cuti Tahunan / Cuti Sakit"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </>
            )}

            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpenDialog(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ✅ Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete?</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-center">
            <p className="text-lg">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function LeavePublicHolidaySkeleton() {
  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Public Holiday &amp; Leave</h1>
      </div>

      <div className="space-y-4 px-20 pb-20">
        <div className="text-center">
          <Skeleton className="mx-auto h-6 w-56" />
        </div>
        <div className="grid grid-cols-2 gap-8">
          {/* Leaves Table Skeleton */}
          <div className="border-r border-gray-300 pr-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="mt-1 h-3 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Holidays Table Skeleton */}
          <div className="pl-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className="h-4 w-32" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Card>
  );
}
