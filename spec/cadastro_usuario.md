# Especificação: Cadastro de Usuário (Front-End)

## 1. Visão Geral
O usuário deve ser capaz de acessar uma tela dedicada de cadastro para criar uma nova conta no sistema OmniWatch. Após o preenchimento do formulário com sucesso, a interface notificará o usuário e o redirecionará para a tela de login.

## 2. Stack Tecnológica Base
- **Framework:** Next.js (App Router, focando em Server/Client Components onde necessário)
- **Estilização e Componentes:** Tailwind CSS + Shadcn/UI
- **Gerenciamento de Formulários:** React Hook Form
- **Validação:** Zod (Validação por Schema)
- **Cliente HTTP:** Axios
- **Feedback Visual:** Toasts (notificações) do Shadcn/UI

## 3. Arquitetura e Estrutura de Arquivos

Utilizaremos o App Router do Next.js.

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── register/
│   │   │   └── page.tsx         # Página de cadastro (/register)
│   │   └── login/
│   │       └── page.tsx         # Página de login (Alvo do redirecionamento)
├── components/
│   ├── ui/                      # Componentes do Shadcn/UI (Button, Input, Card, Toast, etc.)
│   └── auth/
│       └── RegisterForm.tsx     # Componente Client-Side contendo o formulário de cadastro
├── lib/
│   ├── axios.ts                 # Instância configurada do Axios
│   └── validations/
│       └── auth.ts              # Schemas do Zod para formulários de autenticação
```

## 4. Layout e Experiência do Usuário (UX/UI)

- **Tela de Cadastro (`/register`):**
  - Fundo neutro (ex: cinza bem claro ou dark mode, dependendo do tema).
  - Componente `Card` do Shadcn centralizado na tela.
  - O Card deve conter:
    - **Header:** Título "Criar Conta" e subtítulo instrucional.
    - **Content (Formulário):**
      - Campo `Nome Completo` (Input texto).
      - Campo `E-mail` (Input tipo e-mail).
      - Campo `Senha` (Input tipo password, com toggle para mostrar/esconder senha).
      - **Medidor de Força da Senha:** Um indicador visual dinâmico que reflete a força da senha digitada.
      - Campo `Confirmar Senha` (Input tipo password, garante que as senhas coincidem).
    - **Footer:** Botão "Cadastrar" (com estado de `loading`/spinner durante a requisição) e um link "Já tem uma conta? Faça Login".
- **Feedback:** Utilização do `useToast` para mensagens de sucesso ou de erro da API.

## 5. Regras de Validação (Zod Schema)

O schema do Zod no front-end (`src/lib/validations/auth.ts`) deve espelhar rigidamente as regras do backend:

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.string()
    .email("Insira um endereço de e-mail válido.")
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(8, "A senha deve ter no mínimo 8 caracteres.")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caractere especial."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

## 6. Integração e Fluxo de Dados (Axios)

1. **Submissão:** Ao submeter o `RegisterForm`, o React Hook Form valida os dados via Zod.
2. **Prevenção de Duplo Submit:** Durante a requisição (estado `isSubmitting`), o formulário inteiro (todos os inputs e o botão) deve ser **desabilitado** (`disabled=true`). O botão deve exibir um indicador visual de carregamento (Spinner).
3. **Requisição:** Se válido e não estiver carregando, aciona o `axios.post('/api/users/register', data)`.
4. **Tratamento de Resposta:**
   - **Sucesso (201):**
     - Disparar um Toast de sucesso: "Conta criada com sucesso!".
     - Redirecionar via `next/navigation` (`useRouter`) para `/login`.
   - **Erro de Conflito (409):**
     - O backend retornará que o e-mail já existe.
     - Disparar um Toast de erro: "Este e-mail já está em uso.".
     - (Opcional) Usar `setError` do React Hook Form para marcar o campo de e-mail como inválido.
   - **Erro de Validação (422) ou outros (400, 500):**
     - Disparar um Toast de erro genérico: "Ocorreu um erro ao criar a conta. Verifique os dados e tente novamente."
