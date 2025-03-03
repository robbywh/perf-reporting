import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="flex flex-row border-2 bg-white p-4 shadow-md">
      <div className="flex flex-1 items-center">
        <h1 className="mr-10 text-4xl font-bold text-blue-500">
          PerfReporting
        </h1>
      </div>

      <div className="flex items-center justify-center">
        <h2 className="text-center text-xl font-bold text-blue-800">
          Simplifying Performance, Empowering Productivity!
        </h2>
      </div>

      <div className="flex flex-1 justify-end">
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
