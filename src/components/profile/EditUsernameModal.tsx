'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useUserStore } from '@/store/useUserStore';
import { userService } from '@/services/userService';
import { AtSign, Check, X, Loader2, AlertCircle } from 'lucide-react';

interface EditUsernameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername?: string | null;
  onSuccess?: (newUsername: string) => void;
}

export function EditUsernameModal({
  open,
  onOpenChange,
  currentUsername,
  onSuccess,
}: EditUsernameModalProps) {
  const { updateUsername } = useUserStore();
  const [usernameInput, setUsernameInput] = useState(currentUsername || '');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<{ available: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUsernameInput(currentUsername || '');
      setDebouncedInput(currentUsername || '');
      setAvailability(null);
      setValidationError(null);
    }
  }, [open, currentUsername]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInput(usernameInput.trim().toLowerCase());
    }, 350);

    return () => clearTimeout(handler);
  }, [usernameInput]);

  useEffect(() => {
    const clean = debouncedInput;
    if (!clean) {
      setAvailability(null);
      setValidationError(null);
      setIsChecking(false);
      return;
    }

    if (clean === (currentUsername || '').toLowerCase()) {
      setAvailability({ available: true, message: 'Seu nome de usuário atual.' });
      setValidationError(null);
      setIsChecking(false);
      return;
    }

    if (clean.length < 3) {
      setValidationError('Mínimo de 3 caracteres.');
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    if (clean.length > 30) {
      setValidationError('Máximo de 30 caracteres.');
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    const regex = /^[a-z0-9._-]+$/;
    if (!regex.test(clean)) {
      setValidationError('Apenas letras minúsculas, números, ".", "-" e "_".');
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    setValidationError(null);
    let isCancelled = false;
    setIsChecking(true);

    userService.checkUsername(clean)
      .then((res) => {
        if (!isCancelled) {
          setAvailability(res);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setAvailability({
            available: false,
            message: err?.response?.data?.detail || 'Erro ao validar.',
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
  }, [debouncedInput, currentUsername]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[@\s]/g, '');
    setUsernameInput(val);
  };

  const isUnchanged = usernameInput.trim().toLowerCase() === (currentUsername || '').toLowerCase();

  const isFormValid =
    usernameInput.length >= 3 &&
    usernameInput.length <= 30 &&
    !validationError &&
    !isChecking &&
    !isUnchanged &&
    availability?.available === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = usernameInput.trim().toLowerCase();

    if (!clean || isUnchanged || !isFormValid) return;

    setIsSubmitting(true);
    try {
      const updated = await updateUsername(clean);
      toast.add({
        title: 'Nome de usuário atualizado!',
        description: `Seu novo @identificador é @${clean}.`,
        type: 'success',
      });
      onSuccess?.(clean);
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Não foi possível atualizar o nome de usuário.';
      toast.add({
        title: 'Erro ao atualizar',
        description: msg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <AtSign className="w-5 h-5 text-primary" />
            <DialogTitle className="text-lg font-bold">Alterar Nome de Usuário</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Atualize o identificador exclusivo do seu perfil.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="edit-username-input" className="text-xs font-medium text-zinc-300">
              Novo @username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <AtSign className="w-4 h-4" />
              </div>
              <Input
                id="edit-username-input"
                type="text"
                value={usernameInput}
                onChange={handleInputChange}
                placeholder="novo_username"
                autoComplete="off"
                disabled={isSubmitting}
                className="pl-9 pr-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11 text-sm font-medium"
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

            <div className="min-h-5 text-xs">
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
            </div>
          </div>

          <DialogFooter className="pt-2 flex gap-2 justify-end">
            <DialogClose render={<Button type="button" variant="ghost" disabled={isSubmitting} />}>
              Cancelar
            </DialogClose>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
