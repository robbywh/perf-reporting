"use client";

import * as React from "react";
// 1. Import Swiper dan modul2 pendukung
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
// 2. Import stylesheet default Swiper
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// 3. Import komponen UI shadcn (atau sesuaikan path)
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

// Struktur data
interface LeaveData {
  name: string;
  type: string;
  date: string;
}

interface HolidayData {
  name: string;
  date: string;
}

interface SprintData {
  sprintNumber: number;
  leaves: LeaveData[];
  holidays: HolidayData[];
}

export default function LeavePublicHoliday() {
  /**
   * Data sprints (41–46), setiap sprint memiliki daftar leave & holiday sendiri.
   * Anda bisa mengganti data dummy di bawah dengan data dari API atau sumber lain.
   */
  const [sprints, setSprints] = React.useState<SprintData[]>([
    {
      sprintNumber: 41,
      leaves: [
        { name: "Fatur", type: "Cuti Tahunan", date: "2025-01-02" },
        { name: "Brian", type: "Cuti Sakit", date: "2025-01-03" },
      ],
      holidays: [{ name: "Hari Raya Natal", date: "2025-12-25" }],
    },
    {
      sprintNumber: 42,
      leaves: [
        { name: "Gharis", type: "Cuti Tahunan", date: "2025-02-01" },
        { name: "Adi", type: "Cuti Sakit", date: "2025-02-03" },
      ],
      holidays: [{ name: "Tahun Baru Imlek", date: "2025-02-19" }],
    },
    {
      sprintNumber: 43,
      leaves: [
        { name: "Aaron", type: "Cuti Tahunan", date: "2025-03-11" },
        { name: "Aaron", type: "Cuti Sakit", date: "2025-03-15" },
      ],
      holidays: [{ name: "Libur Nasional", date: "2025-03-25" }],
    },
    {
      sprintNumber: 44,
      leaves: [
        { name: "Reinaldi", type: "Cuti Tahunan", date: "2025-04-10" },
        { name: "Brian", type: "Cuti Sakit", date: "2025-04-12" },
      ],
      holidays: [{ name: "Waisak", date: "2025-04-17" }],
    },
    {
      sprintNumber: 45,
      leaves: [
        { name: "Fatur", type: "Cuti Tahunan", date: "2025-05-02" },
        { name: "Adi", type: "Cuti Sakit", date: "2025-05-05" },
      ],
      holidays: [{ name: "Kenaikan Isa Almasih", date: "2025-05-09" }],
    },
    {
      sprintNumber: 46,
      leaves: [
        { name: "Gharis", type: "Cuti Tahunan", date: "2025-06-10" },
        { name: "Aaron", type: "Cuti Sakit", date: "2025-06-12" },
      ],
      holidays: [{ name: "Hari Lahir Pancasila", date: "2025-06-01" }],
    },
  ]);

  // Index sprint aktif (slide yang sedang ditampilkan)
  const [activeSprintIndex, setActiveSprintIndex] = React.useState<number>(0);

  // Kontrol dialog tambah data
  const [openDialog, setOpenDialog] = React.useState<boolean>(false);

  // Apakah form untuk menambah Leave atau Holiday
  const [isLeaveForm, setIsLeaveForm] = React.useState<boolean>(true);

  // State form
  const [formData, setFormData] = React.useState<{
    name: string;
    type: string; // hanya dipakai kalau isLeaveForm = true
    date: string;
  }>({
    name: "",
    type: "",
    date: "",
  });

  const [mounted, setMounted] = React.useState(false);

  /**
   * Handle simpan data (Leave / Holiday) ke sprints[activeSprintIndex]
   */
  const handleSave = React.useCallback(() => {
    setSprints((prevSprints) => {
      const newSprints = [...prevSprints];
      const currentSprint = newSprints[activeSprintIndex];

      if (isLeaveForm) {
        // Tambah ke leaves
        currentSprint.leaves = [
          ...currentSprint.leaves,
          {
            name: formData.name,
            type: formData.type,
            date: formData.date,
          },
        ];
      } else {
        // Tambah ke holidays
        currentSprint.holidays = [
          ...currentSprint.holidays,
          {
            name: formData.name,
            date: formData.date,
          },
        ];
      }

      newSprints[activeSprintIndex] = currentSprint;
      return newSprints;
    });

    // Reset form dan tutup dialog
    setOpenDialog(false);
    setFormData({ name: "", type: "", date: "" });
    setIsLeaveForm(true);
  }, [activeSprintIndex, formData, isLeaveForm]);

  React.useEffect(() => {
    setMounted(true); // Ensures it only runs on client
  }, []);

  if (!mounted) return null;

  return (
    <Card className="p-6">
      {/* Header dan tombol Add */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Public Holiday &amp; Leave</h1>
        {/* <Button onClick={() => setOpenDialog(true)}>
          Add Public Holiday / Leave
        </Button> */}
      </div>

      {/* Swiper berisi 6 Sprint (41–46) */}
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={30}
        slidesPerView={1}
        onSlideChange={(swiper) => setActiveSprintIndex(swiper.activeIndex)}
      >
        {sprints.map((sprint) => (
          <SwiperSlide key={sprint.sprintNumber}>
            <div className="space-y-4 px-20 pb-20">
              <h2 className="text-center text-xl font-semibold">
                Sprint {sprint.sprintNumber}
              </h2>
              <div className="grid grid-cols-2 gap-8">
                {/* Tabel Leaves */}
                <div className="border-r border-gray-300 pr-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sprint.leaves.map((leave, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="font-semibold">{leave.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {leave.type}
                            </div>
                          </TableCell>
                          <TableCell>{leave.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Tabel Holidays */}
                <div className="pl-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Public Holiday</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sprint.holidays.map((holiday, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{holiday.name}</TableCell>
                          <TableCell>{holiday.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Dialog: Tambah Data */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Public Holiday / Leave</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <div className="mb-2">
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
            </div>

            <div className="mb-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder={isLeaveForm ? "Engineer Name" : "Holiday Name"}
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {isLeaveForm && (
              <div className="mb-2">
                <Label htmlFor="leaveType">Leave Type</Label>
                <Input
                  id="leaveType"
                  placeholder="Cuti Tahunan / Cuti Sakit"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                />
              </div>
            )}

            <div className="mb-2">
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
