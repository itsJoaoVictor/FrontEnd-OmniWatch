'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useUserStore } from '@/store/useUserStore';
import { userService } from '@/services/userService';
import { AtSign, Check, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export function UsernameSetupModal() {
  const { user, isInitialized, fetchUser, updateUsername } = useUserStore();
  const [usernameInput, setUsernameInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<{ available: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Carrega os dados do usuário ao montar se ainda não inicializado
  useEffect(() => {
    if (!isInitialized) {
      fetchUser();
    }
  }, [isInitialized, fetchUser]);

  // Debounce para checagem em tempo real de disponibilidade
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInput(usernameInput.trim().toLowerCase());
    }, 350);

    return () => clearTimeout(handler);
  }, [usernameInput]);

  // Validação e chamada à API para verificar o username
  useEffect(() => {
    if (!debouncedInput) {
      setAvailability(null);
      setValidationError(null);
      setIsChecking(false);
      return;
    }

    if (debouncedInput.length < 3) {
      setValidationError('O nome de usuário deve ter pelo menos 3 caracteres.');
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    if (debouncedInput.length > 30) {
      setValidationError('O nome de usuário pode ter no máximo 30 caracteres.');
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    const regex = /^[a-z0-9._-]+$/;
    if (!regex.test(debouncedInput)) {
      setValidationError('Use apenas letras minúsculas, números, ".", "-" e "_".');
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    setValidationError(null);
    let isCancelled = false;
    setIsChecking(true);

    userService.checkUsername(debouncedInput)
      .then((res) => {
        if (!isCancelled) {
          setAvailability(res);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setAvailability({
            available: false,
            message: err?.response?.data?.detail || 'Erro ao validar nome de usuário.',
          });
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsChecking(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedInput]);

  const isOpen = Boolean(isInitialized && user && !user.username);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Normaliza para minúsculas e remove espaços e @
    const val = e.target.value.toLowerCase().replace(/[@\s]/g, '');
    setUsernameInput(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = usernameInput.trim().toLowerCase();

    if (!clean || clean.length < 3 || validationError || !availability?.available) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUsername(clean);
      toast.add({
        title: 'Nome de usuário definido!',
        description: `Bem-vindo ao OmniWatch, @${clean}!`,
        type: 'success',
      });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Não foi possível salvar o nome de usuário.';
      toast.add({
        title: 'Erro ao salvar',
        description: msg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isFormValid =
    usernameInput.length >= 3 &&
    usernameInput.length <= 30 &&
    !validationError &&
    !isChecking &&
    availability?.available === true;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white p-6 shadow-2xl rounded-2xl"
      >
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto sm:mx-0 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight text-zinc-100">
              Escolha seu Nome de Usuário
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
              Bem-vindo ao <strong>OmniWatch</strong>! Defina seu @identificador único para
              personalizar seu perfil e acessar sua conta.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="username-input" className="text-xs font-medium text-zinc-300">
              Nome de Usuário (@username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <AtSign className="w-4 h-4" />
              </div>
              <Input
                id="username-input"
                type="text"
                value={usernameInput}
                onChange={handleInputChange}
                placeholder="seunome"
                autoFocus
                autoComplete="off"
                disabled={isSubmitting}
                className="pl-9 pr-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-primary focus-visible:border-primary h-11 text-sm font-medium"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isChecking && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />}
                {!isChecking && availability?.available && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
                {!isChecking && ((availability && !availability.available) || validationError) && (
                  <X className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>

            {/* Mensagens de feedback */}
            <div className="min-h-5 text-xs transition-all">
              {validationError && (
                <p className="text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationError}</span>
                </p>
              )}
              {!validationError && isChecking && (
                <p className="text-zinc-400 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                  <span>Verificando disponibilidade...</span>
                </p>
              )}
              {!validationError && !isChecking && availability && (
                <p
                  className={`flex items-center gap-1.5 font-medium ${
                    availability.available ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {availability.available ? (
                    <>
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{availability.message}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{availability.message}</span>
                    </>
                  )}
                </p>
              )}
              {!validationError && !isChecking && !availability && usernameInput.length === 0 && (
                <p className="text-zinc-500">
                  De 3 a 30 caracteres (letras, números, '.', '-' e '_').
                </p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando identificador...
                </>
              ) : (
                'Salvar e Continuar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
