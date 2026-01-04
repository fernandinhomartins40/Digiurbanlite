'use client';

import { useState } from 'react';
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
import { UserCircle, Mail, Briefcase, Building2, Hash } from 'lucide-react';

interface CreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  serverHostname: string;
}

export function CreateAccountModal({ open, onClose, onSubmit, serverHostname }: CreateAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emailUsername: '',
    department: '',
    position: '',
    dailyLimit: 100,
    monthlyLimit: 1000
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Extrair domínio do hostname do servidor
      const domain = serverHostname.replace('mail.', '');
      const email = `${formData.emailUsername}@${domain}`;

      await onSubmit({
        name: formData.name,
        email,
        department: formData.department,
        position: formData.position,
        dailyLimit: formData.dailyLimit,
        monthlyLimit: formData.monthlyLimit
      });

      // Reset form
      setFormData({
        name: '',
        emailUsername: '',
        department: '',
        position: '',
        dailyLimit: 100,
        monthlyLimit: 1000
      });
    } catch (error) {
      console.error('Error creating account:', error);
    } finally {
      setLoading(false);
    }
  };

  const domain = serverHostname.replace('mail.', '');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UserCircle className="w-6 h-6 text-blue-600" />
            Nova Conta de Email
          </DialogTitle>
          <DialogDescription>
            Criar uma nova conta de email corporativo para um servidor municipal
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Completo */}
          <div>
            <Label htmlFor="name" className="flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              Nome Completo *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="João Silva"
              required
              className="mt-1"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email *
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="email"
                value={formData.emailUsername}
                onChange={(e) => setFormData({ ...formData, emailUsername: e.target.value.toLowerCase() })}
                placeholder="joao.silva"
                required
                className="flex-1"
              />
              <span className="text-gray-600 font-medium">@{domain}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Use apenas letras minúsculas, números, pontos e hífens
            </p>
          </div>

          {/* Cargo e Departamento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Cargo
              </Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Secretário de Educação"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="department" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Departamento
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Secretaria de Educação"
                className="mt-1"
              />
            </div>
          </div>

          {/* Limites */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Limites de Envio
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dailyLimit">Limite Diário</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  value={formData.dailyLimit}
                  onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
                  min={1}
                  max={10000}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Máximo de emails por dia</p>
              </div>

              <div>
                <Label htmlFor="monthlyLimit">Limite Mensal</Label>
                <Input
                  id="monthlyLimit"
                  type="number"
                  value={formData.monthlyLimit}
                  onChange={(e) => setFormData({ ...formData, monthlyLimit: parseInt(e.target.value) })}
                  min={1}
                  max={100000}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Máximo de emails por mês</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
