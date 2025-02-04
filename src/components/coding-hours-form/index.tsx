import Image from "next/image";
import { useState } from "react";
import { FiEdit2 } from "react-icons/fi"; // Pencil icon

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CodingHoursForm() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [codingHours, setCodingHours] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [isValid, setIsValid] = useState<boolean>(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = e.target?.result as string;
        setScreenshot(image);
        validateForm(image, codingHours);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setScreenshot(null);
    validateForm(null, codingHours);
  };

  // Validate that a screenshot is present and coding hours is not empty.
  const validateForm = (screenshotData: string | null, hours: string) => {
    setIsValid(!!screenshotData && hours.trim() !== "");
  };

  const handleSave = () => {
    if (isValid) {
      setIsEditing(false);
    }
  };

  return (
    <Card className="mx-auto mt-6 w-full p-4">
      <CardContent className="flex flex-col items-center gap-4">
        {isEditing ? (
          <>
            <div className="flex w-full flex-col items-center gap-2">
              <Label htmlFor="screenshot">Upload Coding Hours Screenshot</Label>
              <Input
                type="file"
                accept="image/*"
                id="screenshot"
                onChange={handleFileUpload}
              />
            </div>
            {screenshot && (
              <div className="relative w-full">
                <Image
                  src={screenshot}
                  alt="Uploaded Screenshot"
                  width={500}
                  height={300}
                  className="h-auto w-full rounded-lg border shadow"
                />
                <Button
                  className="absolute right-2 top-2"
                  size="sm"
                  onClick={handleRemoveImage}
                >
                  X
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="relative w-full">
            {screenshot && (
              <Image
                src={screenshot}
                alt="Uploaded Screenshot"
                width={500}
                height={300}
                className="h-auto w-full rounded-lg border shadow"
              />
            )}
            <Button
              className="absolute right-2 top-2 flex items-center gap-1"
              onClick={() => setIsEditing(true)}
            >
              <FiEdit2 className="size-5" />
              <span>Edit</span>
            </Button>
          </div>
        )}

        <div className="w-full">
          <Label htmlFor="codingHours">Coding Hours</Label>
          <Input
            type="number"
            id="codingHours"
            value={codingHours}
            onChange={(e) => {
              setCodingHours(e.target.value);
              validateForm(screenshot, e.target.value);
            }}
            placeholder="Enter coding hours"
            disabled={!isEditing}
          />
          <p className="mt-1 text-sm text-gray-500">
            Please enter coding hours in decimal format. For example, 17 hours
            30 minutes should be entered as 17.5
          </p>
        </div>

        {isEditing && (
          <Button
            className="mt-2 w-full"
            onClick={handleSave}
            disabled={!isValid}
          >
            Save
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
