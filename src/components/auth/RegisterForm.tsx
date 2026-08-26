"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AxiosError } from "axios";

import { RegisterInput, registerSchema } from "@/lib/validations/auth";
import { api } from "@/lib/axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password") || "";
  
  // Calcula a força da senha de 0 a 4
  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordValue);

  async function onSubmit(data: RegisterInput) {
    try {
      // Backend expects only name, email, password
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password
      };

      await api.post("/api/users/register", payload);
      
      toast.add({
        title: "Sucesso!",
        description: "Conta criada com sucesso!",
        type: "success"
      });

      router.push("/login");
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          toast.add({
            title: "Erro",
            description: "Este e-mail já está em uso.",
            type: "error"
          });
          setError("email", { message: "Este e-mail já está em uso." });
          return;
        }
      }
      
      toast.add({
        title: "Erro",
        description: "Ocorreu um erro ao criar a conta. Verifique os dados e tente novamente.",
        type: "error"
      });
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Preencha os dados abaixo para se cadastrar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <fieldset disabled={isSubmitting} className="space-y-4 group">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="João Silva"
                className="focus-visible:ring-primary"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm font-medium text-destructive">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@exemplo.com"
                className="focus-visible:ring-primary"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm font-medium text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  className="focus-visible:ring-primary"
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">Mostrar/Ocultar senha</span>
                </Button>
              </div>
              
              {/* Password Strength Meter */}
              {passwordValue.length > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="flex gap-1 h-1.5 w-full">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-colors ${
                          step <= strengthScore
                            ? strengthScore <= 2
                              ? "bg-red-500"
                              : strengthScore === 3
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {strengthScore <= 2 ? "Fraca" : strengthScore === 3 ? "Média" : "Forte"}
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-sm font-medium text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="********"
                  className="focus-visible:ring-primary"
                  {...register("confirmPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">Mostrar/Ocultar confirmação de senha</span>
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm font-medium text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button className="w-full mt-6 group-disabled:opacity-50" type="submit">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </fieldset>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium transition-colors">
            Faça Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
