"use client";

import { LeaveType } from "@prisma/client";
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
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { ROLE } from "@/types/roles";

import { Skeleton } from "../ui/skeleton";

// Declare this file as a module
export {};

// Data structure
interface LeaveData {
  id?: number;
  engineerId?: number;
  description: string;
  date: string;
  type: LeaveType;
}

interface HolidayData {
  id?: number;
  description: string;
  date: string;
}

interface SprintData {
  sprintName: string;
  startDate: string;
  endDate: string;
  leaves: LeaveData[];
  holidays: HolidayData[];
}

interface Engineer {
  id: number;
  name: string;
}

type LeaveTypeKey =
  | "cuti_tahunan"
  | "sakit"
  | "izin"
  | "cuti_menikah"
  | "cuti_menikahkan_anak"
  | "cuti_khitanan_anak"
  | "cuti_baptis_anak"
  | "cuti_istri_melahirkan"
  | "cuti_keluarga_meninggal"
  | "cuti_keluarga_serumah_meninggal"
  | "cuti_ibadah_haji";

interface FormInputs {
  type: "leave" | "holiday";
  engineerId: string;
  description: string;
  date: string;
  requestType:
    | "full_day"
    | "half_day_before_break"
    | "half_day_after_break"
    | "";
  leaveType: LeaveTypeKey | "";
}

interface LeavePublicHolidayProps {
  isHideAddButton?: boolean;
  sprints: SprintData[];
  engineers: Engineer[];
  roleId: string;
  addLeaveOrHolidayAction: (
    formData: FormData
  ) => Promise<{ success: boolean; error?: string | z.ZodIssue[] }>;
  deleteLeaveOrHolidayAction: (
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
}

const RequestTypeMapping: Record<string, string> = {
  full_day: "Full Day",
  half_day_before_break: "Half Day Before Break",
  half_day_after_break: "Half Day After Break",
};

const LeaveTypeMapping: Record<LeaveTypeKey, string> = {
  cuti_tahunan: "Cuti Tahunan",
  sakit: "Sakit",
  izin: "Izin",
  cuti_menikah: "Cuti Menikah",
  cuti_menikahkan_anak: "Cuti Menikahkan Anak",
  cuti_khitanan_anak: "Cuti Khitanan Anak",
  cuti_baptis_anak: "Cuti Baptis Anak",
  cuti_istri_melahirkan: "Cuti Istri Melahirkan atau Keguguran",
  cuti_keluarga_meninggal: "Cuti Keluarga Meninggal",
  cuti_keluarga_serumah_meninggal:
    "Cuti Anggota Keluarga Dalam Satu Rumah Meninggal",
  cuti_ibadah_haji: "Cuti Ibadah Haji",
};

const leaveFormSchema = z.object({
  type: z.literal("leave"),
  engineerId: z.string().min(1, "Engineer is required"),
  description: z.string(),
  date: z.string().min(1, "Date is required"),
  requestType: z.enum(
    ["full_day", "half_day_before_break", "half_day_after_break"],
    {
      required_error: "Request type is required",
    }
  ),
  leaveType: z.string().min(1, "Leave type is required"),
});

const holidayFormSchema = z.object({
  type: z.literal("holiday"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  // Make these fields optional but with empty string as valid value
  engineerId: z.string().optional().or(z.literal("")),
  requestType: z.string().optional().or(z.literal("")),
  leaveType: z.string().optional().or(z.literal("")),
});

export function LeavePublicHoliday({
  sprints,
  engineers,
  addLeaveOrHolidayAction,
  deleteLeaveOrHolidayAction,
  isHideAddButton = true,
  roleId = ROLE.SOFTWARE_ENGINEER,
}: LeavePublicHolidayProps) {
  const [mounted, setMounted] = React.useState(false);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [errorDialog, setErrorDialog] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [isLeaveForm, setIsLeaveForm] = React.useState(true);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{
    type: "leave" | "holiday";
    sprintIndex: number;
    index: number;
  } | null>(null);
  const [sprintData, setSprintData] = React.useState<SprintData[]>(sprints);
  const [loading, setLoading] = React.useState(false);
  const isSoftwareEngineer = roleId === ROLE.SOFTWARE_ENGINEER;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInputs>({
    defaultValues: {
      type: "leave",
      engineerId: "",
      description: "",
      date: "",
      requestType: "",
      leaveType: "",
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
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      const { type, sprintIndex, index } = deleteTarget;
      const item =
        type === "leave"
          ? sprintData[sprintIndex].leaves[index]
          : sprintData[sprintIndex].holidays[index];

      if (!item.id) {
        console.error("Cannot delete item without id");
        return;
      }

      const formData = new FormData();
      formData.append("type", type);
      formData.append("id", item.id.toString());
      formData.append("date", item.date);

      // Only append leaveType for leave records
      if (type === "leave" && "type" in item && item.type) {
        formData.append("leaveType", item.type.toString());
      }

      // Call the delete action
      const result = await deleteLeaveOrHolidayAction(formData);
      if (result.success) {
        setSprintData((prevSprints) => {
          const newSprints = [...prevSprints];
          if (type === "leave") {
            newSprints[sprintIndex].leaves.splice(index, 1);
          } else {
            newSprints[sprintIndex].holidays.splice(index, 1);
          }
          return newSprints;
        });
        setDeleteDialog(false);
        setDeleteTarget(null);
      } else {
        console.error("Delete error:", result.error);
        setErrorMessage("An unexpected error occurred while deleting");
        setErrorDialog(true);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setErrorMessage("An unexpected error occurred while deleting");
      setErrorDialog(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ✅ Handle form submission
  const onSubmit = async (data: FormInputs) => {
    setLoading(true);

    try {
      // Validate based on form type
      const validationResult =
        data.type === "leave"
          ? leaveFormSchema.safeParse(data)
          : holidayFormSchema.safeParse(data);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors
          .filter((err) => {
            // For holidays, ignore any leaveType/requestType/engineerId validation errors
            if (data.type === "holiday") {
              return !["leaveType", "requestType", "engineerId"].includes(
                err.path[0] as string
              );
            }
            return true;
          })
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join("\n");

        if (errorMessages) {
          setErrorMessage(errorMessages);
          setErrorDialog(true);
          return;
        }
      }

      const formDataObj = new globalThis.FormData();

      if (data.type === "leave") {
        formDataObj.append("type", "leave");
        formDataObj.append("leaveType", data.leaveType);
        formDataObj.append("requestType", data.requestType);
        formDataObj.append("engineerId", data.engineerId);
        formDataObj.append("date", data.date);
        if (data.leaveType) {
          formDataObj.append(
            "description",
            LeaveTypeMapping[data.leaveType as LeaveTypeKey]
          );
        }
      } else {
        formDataObj.append("type", "holiday");
        formDataObj.append("description", data.description);
        formDataObj.append("date", data.date);
      }

      const result = await addLeaveOrHolidayAction(formDataObj);
      if (result.success) {
        reset();
        setOpenDialog(false);
      } else {
        const errorMessages = Array.isArray(result.error)
          ? result.error
              .filter((err) => {
                // Filter out leaveType errors for holidays
                if (data.type === "holiday") {
                  return !err.path.includes("leaveType");
                }
                return true;
              })
              .map((err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`)
              .join("\n")
          : result.error?.toString() ||
            "Something went wrong. Please try again.";

        if (errorMessages) {
          setErrorMessage(errorMessages);
          setErrorDialog(true);
        } else {
          // If all errors were filtered out (i.e., only leaveType errors for holiday), proceed
          reset();
          setOpenDialog(false);
        }
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
      setErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Update sprintData when sprints prop changes
  React.useEffect(() => {
    if (sprints && sprints.length > 0) {
      setSprintData(sprints);
    }
  }, [sprints]);

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CardHeader>
          <CardTitle>Public Holiday &amp; Leave</CardTitle>
        </CardHeader>
        {!isHideAddButton && (
          <Button onClick={() => setOpenDialog(true)}>
            Add Public Holiday / Leave
          </Button>
        )}
      </div>

      {/* Swiper for Sprint Data */}
      <Swiper
        key={`leave-holiday-swiper-${sprintData.length}`}
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={30}
        slidesPerView={1}
      >
        {sprintData.map((sprint, sprintIndex) => {
          // Convert dates to UTC midnight for comparison
          const sprintStartDate = new Date(sprint.startDate);
          const sprintEndDate = new Date(sprint.endDate);

          const filteredLeaves = sprint.leaves.filter((leave) => {
            const leaveDate = new Date(leave.date);
            const isIncluded =
              leaveDate >= sprintStartDate && leaveDate <= sprintEndDate;
            return isIncluded;
          });

          const filteredHolidays = sprint.holidays.filter((holiday) => {
            const holidayDate = new Date(holiday.date);
            const isIncluded =
              holidayDate >= sprintStartDate && holidayDate <= sprintEndDate;
            return isIncluded;
          });

          return (
            <SwiperSlide key={sprint.sprintName}>
              <h2 className="mb-4 text-center font-semibold">
                {sprint.sprintName}
              </h2>
              <div className="space-y-4 px-20 pb-20">
                <div className="grid grid-cols-2 gap-8">
                  {/* Leaves Table */}
                  <TableSection
                    title="Leave"
                    data={filteredLeaves}
                    sprintIndex={sprintIndex}
                    confirmDelete={confirmDelete}
                    getEngineerName={getEngineerName}
                    type="leave"
                    isSoftwareEngineer={isSoftwareEngineer}
                    isHideDeleteButton={isHideAddButton}
                  />
                  {/* Holidays Table */}
                  <TableSection
                    title="Public Holiday"
                    data={filteredHolidays}
                    sprintIndex={sprintIndex}
                    confirmDelete={confirmDelete}
                    type="holiday"
                    isSoftwareEngineer={isSoftwareEngineer}
                    isHideDeleteButton={isHideAddButton}
                  />
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Dialog: Add Leave/Public Holiday */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Public Holiday / Leave</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new leave request or public holiday.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
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
              {errors.type && (
                <p className="text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>

            {isLeaveForm && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <select
                    id="leaveType"
                    {...register("leaveType")}
                    className="h-9 w-full rounded-md border px-2"
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {Object.entries(LeaveTypeMapping).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.leaveType && (
                    <p className="text-sm text-destructive">
                      {errors.leaveType.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestType">Request Type</Label>
                  <select
                    id="requestType"
                    {...register("requestType")}
                    className="h-9 w-full rounded-md border px-2"
                    required
                  >
                    <option value="">Select Request Type</option>
                    <option value="full_day">Full Day</option>
                    <option value="half_day_before_break">
                      Half Day Before Break
                    </option>
                    <option value="half_day_after_break">
                      Half Day After Break
                    </option>
                  </select>
                  {errors.requestType && (
                    <p className="text-sm text-destructive">
                      {errors.requestType.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
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
                  {errors.engineerId && (
                    <p className="text-sm text-destructive">
                      {errors.engineerId.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {!isLeaveForm && (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Tahun Baru 2025"
                  required
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" {...register("date")} type="date" required />
              {errors.date && (
                <p className="text-sm text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
                disabled={loading}
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
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialog} onOpenChange={setErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Error</DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-2 text-destructive">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setErrorDialog(false)}>
              Close
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
  isSoftwareEngineer,
  isHideDeleteButton = false,
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
  isSoftwareEngineer: boolean;
  isHideDeleteButton: boolean;
}) {
  return (
    <div className="border-r border-gray-300 pr-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{title}</TableHead>
            <TableHead>Date</TableHead>
            {!isSoftwareEngineer && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  {type === "leave" &&
                  getEngineerName &&
                  "engineerId" in item ? (
                    <div>
                      <div className="font-semibold">
                        {getEngineerName(item.engineerId)}
                      </div>
                      <div>
                        {item.description} - {RequestTypeMapping[item.type]}
                      </div>
                    </div>
                  ) : (
                    item.description
                  )}
                </TableCell>
                <TableCell>
                  {new Date(item.date).toLocaleDateString("en-EN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </TableCell>
                {!isHideDeleteButton && (
                  <TableCell className="text-right">
                    <Button
                      aria-label="Delete"
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDelete(type, sprintIndex, index)}
                    >
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </TableCell>
                )}
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
      <CardHeader>
        <CardTitle>Public Holiday &amp; Leave</CardTitle>
      </CardHeader>

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
