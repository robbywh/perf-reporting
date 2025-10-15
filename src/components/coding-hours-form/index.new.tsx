"use client";

import { Edit2, Loader } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { z } from "zod";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { uploadFile } from "@/actions/coding-hours";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageViewer } from "@/components/ui/image-viewer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE } from "@/types/roles";

// Schema for coding hours validation
const codingHoursSchema = z.object({
  sprintId: z.string(),
  codingHours: z.preprocess(
    (val) => parseFloat(val as string),
    z.number().positive()
  ),
});

// Local interfaces, avoid importing from common to prevent circular dependencies
interface SprintData {
  id: string;
  name: string;
  sprintEngineers: {
    codingHours: number | null;
    codingHoursUrl: string | null;
  }[];
}

interface CodingHoursEditorProps {
  sprint: SprintData;
  engineerId: number;
  onSave: (data: {
    sprintId: string;
    engineerId: number;
    codingHours: number;
    codingHoursUrl?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

interface CodingHoursViewerProps {
  screenshot: string | null;
  codingHours: string;
  isSoftwareEngineer: boolean;
  onEdit: () => void;
}

function CodingHoursEditor({
  sprint,
  engineerId,
  onSave,
  onCancel,
}: CodingHoursEditorProps) {
  const [screenshot, setScreenshot] = useState<string | null>(
    sprint.sprintEngineers[0]?.codingHoursUrl || null
  );
  const [codingHours, setCodingHours] = useState<string>(
    sprint.sprintEngineers[0]?.codingHours?.toString() || ""
  );
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    setIsValid(!!screenshot && codingHours.trim() !== "");
  }, [screenshot, codingHours]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.");
      return;
    }

    // Check file type
    const acceptedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!acceptedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPG, PNG and WebP are supported.");
      return;
    }

    setIsUploading(true);
    const uploadedUrl = await uploadFile({
      file,
      fileName: `${sprint.name}-${engineerId}`,
      filePath: "/coding-hours/",
    });
    setScreenshot(uploadedUrl);
    setIsUploading(false);
  };

  const handleSave = async () => {
    const parsedData = codingHoursSchema.safeParse({
      sprintId: sprint.id,
      codingHours,
    });
    if (!parsedData.success) return;

    if (isValid) {
      startTransition(async () => {
        await onSave({
          sprintId: sprint.id,
          engineerId,
          codingHours: parsedData.data.codingHours,
          codingHoursUrl: screenshot,
        });
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative mt-4 flex w-full flex-col gap-2">
        <Label htmlFor="screenshot" className="w-full cursor-pointer text-left">
          Upload Coding Hours Screenshot
        </Label>
        <Input
          type="file"
          accept="image/*"
          id="screenshot"
          onChange={handleFileUpload}
          disabled={isPending || isUploading}
          className="block w-full cursor-pointer rounded-md border border-gray-300 bg-white p-2"
        />
        {isUploading && (
          <div className="mt-2 flex justify-center">
            <Loader className="animate-spin" />
          </div>
        )}
      </div>
      <div className="relative w-full">
        <ImageViewer
          src={screenshot}
          alt="Coding Hours Screenshot"
          className="group"
          height="h-60"
          placeholderText="No screenshot uploaded"
        />
      </div>
      <div className="w-full">
        <Label htmlFor="hours" className="mb-2 block">
          Coding Hours
        </Label>
        <Input
          id="hours"
          type="number"
          min="0"
          step="0.01"
          value={codingHours}
          onChange={(e) => setCodingHours(e.target.value)}
          disabled={isPending}
          placeholder="Enter coding hours"
          className="w-full"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Enter the number of coding hours from Wakatime
        </p>
      </div>
      <div className="flex w-full gap-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={onCancel}
          disabled={isPending || isUploading}
        >
          Cancel
        </Button>
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!isValid || isPending || isUploading}
        >
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

function CodingHoursViewer({
  screenshot,
  codingHours,
  isSoftwareEngineer,
  onEdit,
}: CodingHoursViewerProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full">
        <div className="relative">
          <ImageViewer
            src={screenshot}
            alt="Coding Hours Screenshot"
            className="group"
            height="h-60"
            placeholderText="No screenshot uploaded"
          />

          {isSoftwareEngineer && (
            <Button
              className="absolute right-2 top-2 z-10 flex items-center gap-1"
              onClick={onEdit}
            >
              <Edit2 className="size-5" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      </div>

      <div className="w-full">
        <Label>Coding Hours</Label>
        <div className="rounded-md border p-2">
          {codingHours || "No coding hours recorded"}
        </div>
      </div>
    </div>
  );
}

export function CodingHoursForm({
  sprints: initialSprints,
  engineerId,
  roleId,
  onSave,
}: {
  sprints: SprintData[];
  engineerId: number;
  roleId: string;
  onSave: (data: {
    sprintId: string;
    engineerId: number;
    codingHours: number;
    codingHoursUrl?: string | null;
  }) => Promise<void>;
}) {
  const [sprints, setSprints] = useState<SprintData[]>(initialSprints);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isSoftwareEngineer =
    roleId === ROLE.ENGINEERING_MANAGER || roleId === ROLE.SOFTWARE_ENGINEER;

  // Set mounted state after component mounts (for SSR compatibility)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle saving coding hours data
  const handleSave = async (data: {
    sprintId: string;
    engineerId: number;
    codingHours: number;
    codingHoursUrl?: string | null;
  }) => {
    await onSave(data);
    setSprints((currentSprints) =>
      currentSprints.map((sprint) =>
        sprint.id === data.sprintId
          ? {
              ...sprint,
              sprintEngineers: [
                {
                  codingHours: data.codingHours,
                  codingHoursUrl: data.codingHoursUrl || null,
                },
              ],
            }
          : sprint
      )
    );
    setIsEditing(false);
  };

  if (!mounted) return null;

  // Handle case when there are no sprints
  if (!sprints || sprints.length === 0) {
    return (
      <Card className="mx-auto mt-6 w-full p-4">
        <CardHeader>
          <CardTitle>Coding Hours</CardTitle>
        </CardHeader>
        <CardContent className="px-10 pb-10 text-center">
          <p>No sprints available.</p>
        </CardContent>
      </Card>
    );
  }

  // Single sprint case
  if (sprints.length === 1) {
    const sprint = sprints[0];

    // Check if sprint data is valid
    const hasSprintEngineers =
      sprint.sprintEngineers && sprint.sprintEngineers.length > 0;
    const screenshot = hasSprintEngineers
      ? sprint.sprintEngineers[0].codingHoursUrl
      : null;
    const codingHours =
      hasSprintEngineers && sprint.sprintEngineers[0].codingHours
        ? sprint.sprintEngineers[0].codingHours.toString()
        : "";

    return (
      <Card className="mx-auto mt-6 w-full p-4">
        <CardHeader>
          <CardTitle>Coding Hours</CardTitle>
        </CardHeader>
        <h2 className="mb-4 text-center font-semibold">{sprint.name}</h2>
        <CardContent className="px-10 pb-10">
          {isEditing && isSoftwareEngineer ? (
            <CodingHoursEditor
              sprint={sprint}
              engineerId={engineerId}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <CodingHoursViewer
              screenshot={screenshot}
              codingHours={codingHours}
              isSoftwareEngineer={isSoftwareEngineer}
              onEdit={() => setIsEditing(true)}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Multiple sprints case
  return (
    <Card className="mx-auto mt-6 w-full p-4">
      <CardHeader>
        <CardTitle>Coding Hours</CardTitle>
      </CardHeader>
      <div className="relative w-full">
        <Swiper
          key={`coding-hours-swiper-${sprints.length}`}
          modules={[Navigation, Pagination]}
          navigation={{
            enabled: true,
          }}
          pagination={{
            clickable: true,
            enabled: true,
          }}
          spaceBetween={30}
          slidesPerView={1}
          className="!px-12"
        >
          {sprints.map((sprint) => {
            // Check if sprint data is valid
            const hasSprintEngineers =
              sprint.sprintEngineers && sprint.sprintEngineers.length > 0;
            const screenshot = hasSprintEngineers
              ? sprint.sprintEngineers[0].codingHoursUrl
              : null;
            const codingHours =
              hasSprintEngineers && sprint.sprintEngineers[0].codingHours
                ? sprint.sprintEngineers[0].codingHours.toString()
                : "";

            return (
              <SwiperSlide key={sprint.id} className="w-full pb-12">
                <h2 className="mb-4 text-center font-semibold">
                  {sprint.name}
                </h2>
                <CardContent className="px-10 pb-10">
                  {isEditing && isSoftwareEngineer ? (
                    <CodingHoursEditor
                      sprint={sprint}
                      engineerId={engineerId}
                      onSave={handleSave}
                      onCancel={() => setIsEditing(false)}
                    />
                  ) : (
                    <CodingHoursViewer
                      screenshot={screenshot}
                      codingHours={codingHours}
                      isSoftwareEngineer={isSoftwareEngineer}
                      onEdit={() => setIsEditing(true)}
                    />
                  )}
                </CardContent>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </Card>
  );
}

export function CodingHoursFormSkeleton() {
  return (
    <Card className="mx-auto mt-6 w-full p-4">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="mt-4 flex w-full flex-col gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="w-full">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="mt-2 h-10 w-full" />
      </CardContent>
    </Card>
  );
}
