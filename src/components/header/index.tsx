import { UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="flex flex-row border-2 bg-white p-4 shadow-md">
      <div className="flex flex-1 items-center">
        <h1 className="mr-10 text-4xl font-bold text-blue-500">
          PerfReporting
        </h1>
      </div>

      <div className="flex items-center justify-center">
        <p className="text-center text-xl font-bold text-blue-300">
          Simplifying Performance, Empowering Productivity!
        </p>
      </div>

      <div className="flex flex-1 justify-end">
        <UserButton />
      </div>
    </header>
  );
}
