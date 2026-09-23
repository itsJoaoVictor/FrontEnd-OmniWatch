import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Link href="/" className="flex flex-col items-center gap-4 mb-8 text-foreground transition-opacity hover:opacity-80">
        <Image 
          src="/logo_fundo_transparente.png" 
          alt="Logo OmniWatch" 
          width={120} 
          height={120} 
          className="object-contain"
          priority
        />
        <span className="text-3xl font-bold tracking-tight">OmniWatch</span>
      </Link>
      
      <RegisterForm />
    </div>
  );
}
