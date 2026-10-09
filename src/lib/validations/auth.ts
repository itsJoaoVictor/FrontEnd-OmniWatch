import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.string().email("Insira um endereço de e-mail válido.").trim().toLowerCase(),
  password: z.string()
    .min(8, "A senha deve ter no mínimo 8 caracteres.")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caractere especial."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"], // Aponta o erro para o input de confirmar senha
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, "E-mail ou nome de usuário é obrigatório.").trim().toLowerCase(),
  password: z.string().min(1, "A senha é obrigatória."),
  remember_me: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
