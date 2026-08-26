# Especificação: Login de Usuário (Front-End)

## 1. Visão Geral
A tela de Login permite que o usuário acesse sua conta no OmniWatch. Ela utiliza validação de dados no lado do cliente e se comunica com a API de forma segura, gerenciando o estado de carregamento e provendo feedback visual claro, preparando a aplicação para lidar com cookies `HttpOnly` injetados pelo back-end.

## 2. Stack Tecnológica Base
- **Framework:** Next.js (App Router)
- **Componentes:** Tailwind CSS + Shadcn/UI (Card, Input, Button, Checkbox, Toast)
- **Formulários e Validação:** React Hook Form + Zod
- **Comunicação API:** Axios (com configuração `withCredentials: true`)

## 3. Estrutura de Arquivos

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx         # Página de login (/login)
├── components/
│   └── auth/
│       └── LoginForm.tsx        # Componente contendo o formulário de login
└── lib/
    ├── axios.ts                 # Axios instanciado obrigatoriamente com withCredentials = true
    └── validations/
        └── auth.ts              # Adição do loginSchema
```

## 4. Layout e Experiência do Usuário (UX/UI & Acessibilidade)

- **Design Visual (Card Centralizado):**
  - A interface deve ser minimalista e focada. Utilizar um fundo de tela (background) sólido, gradiente suave ou com um leve efeito de *blur*.
  - Sobre esse fundo, posicionar o componente `Card` do Shadcn perfeitamente centralizado e responsivo (`max-w-md` ou similar).
  - O Card deve conter:
    - **Header:** Título "Entrar na sua conta" e subtítulo "Insira suas credenciais abaixo".
    - **Content (Formulário Estrito):**
      - Campo `E-mail` (Input tipo e-mail). **Obrigatório:** Atributo `autocomplete="username"`.
      - Campo `Senha` (Input tipo password, com toggle para visualizar a senha). **Obrigatório:** Atributo `autocomplete="current-password"`.
      - *Acessibilidade (a11y):* O formulário deve possuir excelente navegação via teclado (`Tab`). Não haverá espaços para botões de Social Login (ex: Google) por enquanto.
      - Linha inferior do formulário dividida entre:
        - Esquerda: Componente `Checkbox` rotulado **"Lembrar de mim"**.
        - Direita: Link sutil **"Esqueci minha senha"** (Apontando para `/forgot-password`).
    - **Footer:** Botão "Entrar" e abaixo um link "Não tem uma conta? Cadastre-se" (Apontando para `/register`).

## 5. Regras de Validação (Zod Schema)

Diferente do cadastro, o login não precisa validar a "força" da senha, apenas garantir que algo foi digitado, para não desperdiçar requisições ao back-end à toa.

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string()
    .email("E-mail inválido.")
    .trim()
    .toLowerCase(), // Normalização também no envio do login
  password: z.string().min(1, "A senha é obrigatória."),
  remember_me: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

## 6. Integração e Fluxo de Dados (Axios)

1. **Configuração Crucial do Axios:** O interceptor ou instância do Axios no Front-End **deve** possuir `withCredentials: true`. Isso é obrigatório para que o navegador envie os cookies `HttpOnly` nas requisições futuras e aceite os cookies que vêm na resposta do Login.
2. **Prevenção de Duplo Submit:** Ao clicar em Entrar, setar `isSubmitting=true`. Todos os campos (inputs, checkbox) e o botão devem ficar `disabled`. O botão de Entrar exibe um Spinner (ícone de carregamento).
3. **Requisição:** Disparar `axios.post('/api/auth/login', data)`.
4. **Tratamento de Resposta:**
   - **Sucesso (200 OK):**
     - A API vai setar os cookies via Header automaticamente (o Front-end não precisa ler o token e salvar manualmente no localStorage).
     - Atualizar o estado global da aplicação de que o usuário está logado (se usar Context/Zustand).
     - Redirecionar via `useRouter().push('/dashboard')` ou rota principal.
   - **Erro de Autenticação (401):**
     - O backend negou as credenciais.
     - Disparar um Toast de erro (variante `destructive`): "E-mail ou senha incorretos."
   - **Erro de Servidor (500) ou Rate Limit (429):**
     - Toast de erro correspondente ("Muitas tentativas. Tente novamente mais tarde.").
