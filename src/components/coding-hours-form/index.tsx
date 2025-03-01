"use client";

import { Edit2, Loader } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useTransition } from "react";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { z } from "zod";
import "swiper/css";

import { uploadFile } from "@/actions/coding-hours";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function CodingHoursForm({
  sprints,
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
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [codingHours, setCodingHours] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const isSoftwareEngineer = roleId === ROLE.SOFTWARE_ENGINEER;

  useEffect(() => {
    setIsValid(!!screenshot && codingHours.trim() !== "");
  }, [screenshot, codingHours]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    sprintName: string
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true); // Set uploading state
      const uploadedUrl = await uploadFile({
        file,
        fileName: `${sprintName}-${engineerId}`,
        filePath: "/coding-hours/",
      });
      setScreenshot(uploadedUrl);
      setIsUploading(false); // Reset uploading state
    }
  };

  const handleSave = async (sprintId: string) => {
    const parsedData = codingHoursSchema.safeParse({
      sprintId,
      codingHours,
    });
    if (!parsedData.success) return;

    if (isValid) {
      startTransition(async () => {
        await onSave({
          sprintId,
          engineerId,
          codingHours: parsedData.data.codingHours,
          codingHoursUrl: screenshot,
        });
        setIsEditing(false);
      });
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Card className="mx-auto mt-6 w-full p-4">
      <CardHeader>
        <CardTitle>Coding Hours</CardTitle>
      </CardHeader>
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={30}
        slidesPerView={1}
      >
        {sprints.map((sprint) => (
          <SwiperSlide key={sprint.id} className="px-20 pb-5">
            <h2 className="text-center font-semibold">{sprint.name}</h2>
            <CardContent className="flex flex-col items-center gap-4">
              {isEditing && isSoftwareEngineer ? (
                <>
                  <div className="mt-4 flex w-full flex-col gap-2">
                    <Label htmlFor="screenshot">
                      Upload Coding Hours Screenshot
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      id="screenshot"
                      onChange={(event) => handleFileUpload(event, sprint.name)}
                      disabled={!isSoftwareEngineer || isPending || isUploading}
                    />
                    {isUploading && (
                      <div className="mt-2 flex justify-center">
                        <Loader className="animate-spin" />
                      </div>
                    )}
                  </div>
                  {(screenshot || sprint.sprintEngineers[0].codingHoursUrl) && (
                    <div className="relative w-full">
                      <Image
                        src={
                          screenshot ||
                          sprint.sprintEngineers[0].codingHoursUrl ||
                          ""
                        }
                        alt="Uploaded Screenshot"
                        width={500}
                        height={300}
                        className="h-auto w-full rounded-lg border shadow"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="relative w-full">
                  {screenshot && (
                    <Image
                      src={
                        screenshot ||
                        sprint.sprintEngineers[0].codingHoursUrl ||
                        ""
                      }
                      alt="Uploaded Screenshot"
                      width={500}
                      height={300}
                      className="h-auto w-full rounded-lg border shadow"
                    />
                  )}
                  {isSoftwareEngineer && (
                    <Button
                      className="absolute right-2 top-2 flex items-center gap-1"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="size-5" />
                      <span>Edit</span>
                    </Button>
                  )}
                </div>
              )}

              <div className="w-full">
                <Label htmlFor="codingHours">Coding Hours</Label>
                <Input
                  type="number"
                  id="codingHours"
                  value={codingHours}
                  onChange={(e) => setCodingHours(e.target.value)}
                  placeholder="Enter coding hours"
                  disabled={!isEditing || isPending || isUploading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter coding hours in decimal format. E.g., 17 hours 30
                  minutes as 17.5
                </p>
              </div>

              {isEditing && isSoftwareEngineer && (
                <Button
                  className="mt-2 w-full"
                  onClick={() => handleSave(sprint.id)}
                  disabled={!isValid || isPending || isUploading}
                >
                  {isPending ? "Saving..." : "Save"}
                </Button>
              )}
            </CardContent>
          </SwiperSlide>
        ))}
      </Swiper>
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
