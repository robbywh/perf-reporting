import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="flex flex-row border-2 bg-white p-4 shadow-md">
      {/* Branding Section */}
      <div className="flex flex-1 items-center">
        <h1 className="mr-10 text-4xl font-bold text-blue-500">
          PerfReporting
        </h1>
      </div>

      {/* Tagline Section */}
      <div className="flex items-center justify-center">
        <p className="text-center text-xl font-bold text-blue-300">
          Simplifying Performance, Empowering Productivity!
        </p>
      </div>

      {/* <div className="mr-4 flex flex-1 items-center justify-end">
        <div className="relative">
          <Bell className="size-6 cursor-pointer text-gray-700" />
          <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            2
          </span>
        </div>
      </div> */}
      <div className="flex flex-1 justify-end">
        <UserButton />
      </div>
    </header>
  );
}
