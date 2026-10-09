import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { UsernameSetupModal } from "@/components/auth/UsernameSetupModal";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative pb-16 lg:pb-0">
      <Topbar />
      <main className="flex-1 w-full pt-16">
        {children}
      </main>
      <BottomNav />
      <UsernameSetupModal />
    </div>
  );
}
