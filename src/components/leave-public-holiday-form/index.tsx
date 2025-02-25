"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { z } from "zod";
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
  engineerId?: number;
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

interface Engineer {
  id: number;
  name: string;
}

interface LeavePublicHolidayProps {
  sprints: SprintData[];
  engineers: Engineer[];
  addLeaveOrHolidayAction: (
    formData: FormData
  ) => Promise<{ success: boolean; error?: string | z.ZodIssue[] }>;
}

export function LeavePublicHoliday({
  sprints,
  engineers,
  addLeaveOrHolidayAction,
}: LeavePublicHolidayProps) {
  const [mounted, setMounted] = React.useState(false);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [isLeaveForm, setIsLeaveForm] = React.useState(true);
  const [deleteTarget, setDeleteTarget] = React.useState<{
    type: "leave" | "holiday";
    sprintIndex: number;
    index: number;
  } | null>(null);
  const [sprintData, setSprintData] = React.useState<SprintData[]>(sprints);
  const [loading, setLoading] = React.useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      type: "leave",
      engineerId: "",
      description: "",
      date: "",
    },
  });

  const getEngineerName = (engineerId?: number) => {
    return engineers.find((eng) => eng.id === engineerId)?.name || "Unknown";
  };

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

    setDeleteDialog(false);
    setDeleteTarget(null);
  };

  // ✅ Handle form submission
  async function onSubmit(data: any) {
    setLoading(true); // Start loading
    const formDataObj = new FormData();
    Object.keys(data).forEach((key) => {
      formDataObj.append(key, data[key]);
    });
    const result = await addLeaveOrHolidayAction(formDataObj);
    setLoading(false); // Stop loading
    if (result.success) {
      reset(); // Reset form after success
      setOpenDialog(false);
    } else {
      alert(result.error || "Something went wrong");
    }
  }

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Prevent hydration mismatch

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
                <TableSection
                  title="Leave"
                  data={sprint.leaves}
                  sprintIndex={sprintIndex}
                  confirmDelete={confirmDelete}
                  getEngineerName={getEngineerName}
                  type="leave"
                />
                {/* Holidays Table */}
                <TableSection
                  title="Public Holiday"
                  data={sprint.holidays}
                  sprintIndex={sprintIndex}
                  confirmDelete={confirmDelete}
                  type="holiday"
                />
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

          <form onSubmit={handleSubmit(onSubmit)}>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              {...register("type")}
              className="h-9 w-full rounded-md border px-2"
              onChange={(e) => setIsLeaveForm(e.target.value === "leave")}
            >
              <option value="leave">Leave</option>
              <option value="holiday">Public Holiday</option>
            </select>

            {isLeaveForm && (
              <>
                <Label htmlFor="engineerId">Engineer</Label>
                <select
                  id="engineerId"
                  {...register("engineerId")}
                  className="h-9 w-full rounded-md border px-2"
                  required
                >
                  <option value="">Select Engineer</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register("description")}
              placeholder={
                isLeaveForm ? "Cuti Tahunan / Cuti Sakit" : "Tahun Baru 2025"
              }
              required
            />

            <Label htmlFor="date">Date</Label>
            <Input id="date" {...register("date")} type="date" required />

            <DialogFooter className="mt-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
                disabled={loading} // Disable button while loading
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete?</DialogTitle>
          </DialogHeader>
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

function TableSection({
  title,
  data,
  sprintIndex,
  confirmDelete,
  getEngineerName,
  type,
}: {
  title: string;
  data: (LeaveData | HolidayData)[];
  sprintIndex: number;
  confirmDelete: (
    type: "leave" | "holiday",
    sprintIndex: number,
    index: number
  ) => void;
  getEngineerName?: (engineerId?: number) => string;
  type: "leave" | "holiday";
}) {
  return (
    <div className="border-r border-gray-300 pr-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{title}</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  {getEngineerName
                    ? getEngineerName(item?.engineerId)
                    : item.description}
                </TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => confirmDelete(type, sprintIndex, index)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                No records
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
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
