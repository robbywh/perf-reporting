import { UserButton } from "@clerk/nextjs";

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

      {/* User Section */}
      <div className="flex flex-1 justify-end">
        <UserButton />
      </div>
    </div>
  );
}