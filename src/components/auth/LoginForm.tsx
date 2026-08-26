"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AxiosError } from "axios";

import { loginSchema, LoginInput } from "@/lib/validations/auth";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember_me: false,
    },
  });

  const rememberMe = watch("remember_me");

  async function onSubmit(data: LoginInput) {
    try {
      await api.post("/api/auth/login", data);
      
      toast.add({
        title: "Sucesso!",
        description: "Login realizado com sucesso.",
        type: "success"
      });
      
      router.push("/dashboard"); // Or wherever the main route is
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast.add({
            title: "Erro de autenticação",
            description: "E-mail ou senha incorretos.",
            type: "error"
          });
          return;
        } else if (error.response?.status === 429) {
          toast.add({
            title: "Muitas tentativas",
            description: "Tente novamente mais tarde.",
            type: "error"
          });
          return;
        }
      }
      toast.add({
        title: "Erro",
        description: "Ocorreu um erro no servidor. Tente novamente.",
        type: "error"
      });
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Entrar na sua conta</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Insira suas credenciais abaixo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <fieldset disabled={isSubmitting} className="space-y-4 group">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@exemplo.com"
                autoComplete="username"
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
                  autoComplete="current-password"
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
              {errors.password && (
                <p className="text-sm font-medium text-destructive">{errors.password.message}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember_me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setValue("remember_me", checked as boolean)}
                />
                <Label htmlFor="remember_me" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Lembrar de mim
                </Label>
              </div>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium transition-colors">
                Esqueci minha senha
              </Link>
            </div>

            <Button className="w-full mt-6 group-disabled:opacity-50" type="submit">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </fieldset>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium transition-colors">
            Cadastre-se
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
