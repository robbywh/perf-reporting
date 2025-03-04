"use client";

import { Edit2, Loader, ZoomIn } from "lucide-react";
import Image from "next/image";
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE } from "@/types/roles";

import { Skeleton } from "../ui/skeleton";

const codingHoursSchema = z.object({
  sprintId: z.string(),
  codingHours: z.preprocess(
    (val) => parseFloat(val as string),
    z.number().positive()
  ),
});

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
  sprint: SprintData;
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
    sprint.sprintEngineers[0].codingHoursUrl
  );
  const [codingHours, setCodingHours] = useState<string>(
    sprint.sprintEngineers[0].codingHours?.toString() || ""
  );
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    setIsValid(!!screenshot && codingHours.trim() !== "");
  }, [screenshot, codingHours]);

  // Handle keyboard events for the zoom dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZoomOpen) {
        setIsZoomOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen]);

  // Reset loading state when dialog closes
  useEffect(() => {
    if (!isZoomOpen) {
      setIsImageLoading(true);
    }
  }, [isZoomOpen]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const uploadedUrl = await uploadFile({
        file,
        fileName: `${sprint.name}-${engineerId}`,
        filePath: "/coding-hours/",
      });
      setScreenshot(uploadedUrl);
      setIsUploading(false);
    }
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
      <div className="mt-4 flex w-full flex-col gap-2">
        <Label htmlFor="screenshot">Upload Coding Hours Screenshot</Label>
        <Input
          type="file"
          accept="image/*"
          id="screenshot"
          onChange={handleFileUpload}
          disabled={isPending || isUploading}
        />
        {isUploading && (
          <div className="mt-2 flex justify-center">
            <Loader className="animate-spin" />
          </div>
        )}
      </div>
      <div className="relative w-full">
        {screenshot ? (
          <div className="group relative aspect-auto h-60 w-full overflow-hidden rounded-lg border">
            <div
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center opacity-0 transition-opacity hover:bg-black/20 group-hover:opacity-100"
              onClick={() => setIsZoomOpen(true)}
            >
              <div className="rounded-full bg-black/50 p-3 transition-transform group-hover:scale-110">
                <ZoomIn className="size-6 text-white" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-xs text-white opacity-70">
              Click to zoom
            </div>
            <Image
              src={screenshot}
              alt="Uploaded Screenshot"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="flex aspect-auto h-60 w-full flex-col items-center justify-center gap-2 rounded-lg border bg-muted/10">
            <p className="text-muted-foreground">No screenshot uploaded</p>
            <p className="text-sm text-muted-foreground">
              Upload an image to continue
            </p>
          </div>
        )}
      </div>
      <div className="w-full">
        <Label htmlFor="codingHours">Coding Hours</Label>
        <Input
          type="number"
          id="codingHours"
          value={codingHours}
          onChange={(e) => setCodingHours(e.target.value)}
          placeholder="Enter coding hours"
          disabled={isPending || isUploading}
        />
        <p className="mt-1 text-sm text-gray-500">
          Enter coding hours in decimal format. E.g., 17 hours 30 minutes as
          17.5
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

      {/* Image Zoom Dialog */}
      {screenshot && (
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className="max-h-[95vh] w-[95vw] max-w-5xl overflow-hidden p-0">
            <DialogTitle className="sr-only">
              Coding Hours Screenshot Preview
            </DialogTitle>
            <DialogDescription className="sr-only">
              Full-size view of the coding hours screenshot
            </DialogDescription>
            <div className="relative h-[85vh] w-full">
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Loader className="size-8 animate-spin" />
                </div>
              )}
              <Image
                src={screenshot}
                alt="Coding Hours Screenshot"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                priority
                onLoad={() => setIsImageLoading(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CodingHoursViewer({
  screenshot,
  codingHours,
  isSoftwareEngineer,
  onEdit,
}: CodingHoursViewerProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Handle keyboard events for the zoom dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZoomOpen) {
        setIsZoomOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen]);

  // Reset loading state when dialog closes
  useEffect(() => {
    if (!isZoomOpen) {
      setIsImageLoading(true);
    }
  }, [isZoomOpen]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full">
        {screenshot ? (
          <div className="group relative aspect-auto h-60 w-full overflow-hidden rounded-lg border">
            <div
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center opacity-0 transition-opacity hover:bg-black/20 group-hover:opacity-100"
              onClick={() => setIsZoomOpen(true)}
            >
              <div className="rounded-full bg-black/50 p-3 transition-transform group-hover:scale-110">
                <ZoomIn className="size-6 text-white" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-xs text-white opacity-70">
              Click to zoom
            </div>
            <Image
              src={screenshot}
              alt="Coding Hours Screenshot"
              fill
              className="object-contain"
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
        ) : (
          <div className="flex aspect-auto h-60 w-full items-center justify-center rounded-lg border bg-muted/10">
            <p className="text-muted-foreground">No screenshot uploaded</p>
            {isSoftwareEngineer && (
              <Button
                className="absolute right-2 top-2 flex items-center gap-1"
                onClick={onEdit}
              >
                <Edit2 className="size-5" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="w-full">
        <Label>Coding Hours</Label>
        <div className="rounded-md border p-2">
          {codingHours || "No coding hours recorded"}
        </div>
      </div>

      {/* Image Zoom Dialog */}
      {screenshot && (
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className="max-h-[95vh] w-[95vw] max-w-5xl overflow-hidden p-0">
            <DialogTitle className="sr-only">
              Coding Hours Screenshot Preview
            </DialogTitle>
            <DialogDescription className="sr-only">
              Full-size view of the coding hours screenshot
            </DialogDescription>
            <div className="relative h-[85vh] w-full">
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Loader className="size-8 animate-spin" />
                </div>
              )}
              <Image
                src={screenshot}
                alt="Coding Hours Screenshot"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                priority
                onLoad={() => setIsImageLoading(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
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
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [sprints, setSprints] = useState<SprintData[]>(initialSprints);
  const isSoftwareEngineer = roleId === ROLE.SOFTWARE_ENGINEER;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update sprints when initialSprints changes
  useEffect(() => {
    setSprints(initialSprints);
  }, [initialSprints]);

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
              sprint={sprint}
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
                      sprint={sprint}
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
