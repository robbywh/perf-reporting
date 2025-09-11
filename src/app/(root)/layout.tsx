import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { Toaster } from "sonner";

import { SprintDataServerWrapper } from "@/components/sprint-data-server-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { getWelcomeMessage } from "@/lib/utils/global";
import { findRoleIdAndEngineerIdByUserId } from "@/services/users";

import Header from "../../components/header";


const WelcomeMessage = async () => {
  const user = await currentUser(); // Fetch the logged-in user
  const firstName = user?.firstName || "Guest";
  const { roleId } = await findRoleIdAndEngineerIdByUserId(user?.id || "");
  const welcomeMessage = getWelcomeMessage(roleId || "", firstName);

  return <div className="flex-1 text-lg font-bold">{welcomeMessage}</div>;
};



export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sprint components will handle their own data fetching

  return (
    <div>
      <Toaster position="top-right" closeButton richColors />
      <Header />
      <div className="flex min-h-screen flex-col gap-2 px-10 pt-10">
        <div className="flex items-center justify-between">
          <Suspense fallback={<Skeleton className="h-6 w-60 rounded-md" />}>
            <WelcomeMessage />
          </Suspense>
        </div>
        <SprintDataServerWrapper>
          <div className="p-10">{children}</div>
        </SprintDataServerWrapper>
      </div>
    </div>
  );
}
