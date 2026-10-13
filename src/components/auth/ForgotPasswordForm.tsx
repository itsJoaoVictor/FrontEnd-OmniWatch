"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { AxiosError } from "axios";

import { forgotPasswordSchema, ForgotPasswordInput } from "@/lib/validations/auth";
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

export function ForgotPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      username: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("newPassword") || "";

  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordValue);

  async function onSubmit(data: ForgotPasswordInput) {
    try {
      await api.post("/api/auth/forgot-password", {
        email: data.email,
        username: data.username,
        new_password: data.newPassword,
      });

      toast.add({
        title: "Sucesso!",
        description: "Sua senha foi redefinida. Faça login com a nova senha.",
        type: "success",
      });

      router.push("/login");
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          toast.add({
            title: "Conta não encontrada",
            description:
              error.response.data?.detail ||
              "Não encontramos uma conta com o e-mail e nome de usuário informados.",
            type: "error",
          });
          return;
        } else if (error.response?.status === 429) {
          toast.add({
            title: "Muitas tentativas",
            description: "Tente novamente mais tarde.",
            type: "error",
          });
          return;
        }
      }
      toast.add({
        title: "Erro",
        description: "Ocorreu um erro ao redefinir a senha. Tente novamente.",
        type: "error",
      });
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Recuperar Senha</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Confirme seu e-mail e nome de usuário para definir uma nova senha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <fieldset disabled={isSubmitting} className="space-y-4 group">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail cadastrado</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@exemplo.com"
                autoComplete="email"
                className="focus-visible:ring-primary"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm font-medium text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="joaosilva"
                autoComplete="username"
                className="focus-visible:ring-primary"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-sm font-medium text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  autoComplete="new-password"
                  className="focus-visible:ring-primary"
                  {...register("newPassword")}
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

              {errors.newPassword && (
                <p className="text-sm font-medium text-destructive">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="********"
                  autoComplete="new-password"
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
                <p className="text-sm font-medium text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button className="w-full mt-6 group-disabled:opacity-50" type="submit">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Redefinir Senha
            </Button>
          </fieldset>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o Login
        </Link>
      </CardFooter>
    </Card>
  );
}
