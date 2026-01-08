'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, UserCircle, Hash, Power } from 'lucide-react';

interface EditAccountModalProps {
  open: boolean;
  onClose: () => void;
  account: {
    id: string;
    name: string;
    email: string;
    dailyLimit: number;
    monthlyLimit: number;
    isActive: boolean;
  };
  onSubmit: (data: any) => Promise<void>;
}

export function EditAccountModal({ open, onClose, account, onSubmit }: EditAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: account.name,
    dailyLimit: account.dailyLimit,
    monthlyLimit: account.monthlyLimit,
    isActive: account.isActive
  });

  useEffect(() => {
    setFormData({
      name: account.name,
      dailyLimit: account.dailyLimit,
      monthlyLimit: account.monthlyLimit,
      isActive: account.isActive
    });
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error updating account:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Settings className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            Editar Conta
          </DialogTitle>
          <DialogDescription className="text-sm break-all">
            Atualizar configurações da conta {account.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <Label htmlFor="name" className="flex items-center gap-2 text-sm">
              <UserCircle className="w-4 h-4" />
              Nome Completo
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do usuário"
              className="mt-1"
            />
          </div>

          {/* Limites */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm md:text-base">
              <Hash className="w-4 h-4" />
              Limites de Envio
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dailyLimit" className="text-sm">Limite Diário</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  value={formData.dailyLimit}
                  onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
                  min={1}
                  max={10000}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Emails por dia</p>
              </div>

              <div>
                <Label htmlFor="monthlyLimit" className="text-sm">Limite Mensal</Label>
                <Input
                  id="monthlyLimit"
                  type="number"
                  value={formData.monthlyLimit}
                  onChange={(e) => setFormData({ ...formData, monthlyLimit: parseInt(e.target.value) })}
                  min={1}
                  max={100000}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Emails por mês</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-2 flex-1">
                <Power className="w-4 h-4 text-gray-600 mt-1" />
                <div className="flex-1">
                  <Label htmlFor="isActive" className="cursor-pointer text-sm">
                    Conta Ativa
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Permitir que esta conta envie emails
                  </p>
                </div>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
