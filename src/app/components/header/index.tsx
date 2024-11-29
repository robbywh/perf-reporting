import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";

export default function Header() {
  return (
    <div className="flex flex-row p-4 border-2 bg-white shadow-md">
      {/* Branding Section */}
      <div className="flex flex-1 items-center">
        <h1 className="font-bold text-4xl text-blue-500 mr-10">
          PerfReporting
        </h1>
      </div>

      {/* Tagline Section */}
      <div className="flex flex-2 items-center justify-center">
        <p className="font-bold text-xl text-blue-300 text-center">
          Simplifying Performance, Empowering Productivity!
        </p>
      </div>

      <div className="flex flex-1 mr-4 items-center justify-end">
        <div className="relative">
          <Bell className="w-6 h-6 text-gray-700 cursor-pointer" />
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
            2
          </span>
        </div>
      </div>
      <div className="flex justify-end">
        <UserButton />
      </div>
    </div>
  );
}