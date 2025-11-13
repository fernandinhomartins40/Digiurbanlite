'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  MapPin,
  Image as ImageIcon,
  Calendar,
  Eye,
  Download,
  X,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdvancedFeaturesTabProps {
  protocol: any;
  service: any;
}

export function AdvancedFeaturesTab({ protocol, service }: AdvancedFeaturesTabProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Verificar recursos disponíveis
  const hasLocation = Boolean(protocol.latitude && protocol.longitude);
  const hasImages = Boolean(protocol.customData?.images && protocol.customData.images.length > 0);
  const hasScheduling = Boolean(protocol.customData?.appointmentDate || protocol.customData?.scheduleDate || protocol.customData?.eventDate);
  const hasAddress = Boolean(protocol.address);

  // Se não tem nenhum recurso avançado
  if (!hasLocation && !hasImages && !hasScheduling) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Nenhum recurso avançado disponível nesta solicitação
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* MAPA - Localização */}
      {hasLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Localização
            </CardTitle>
            <CardDescription>
              Localização geográfica vinculada à solicitação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mapa Incorporado */}
            <div className="h-96 rounded-lg overflow-hidden border-2 border-border">
              <iframe
                src={`https://maps.google.com/maps?q=${protocol.latitude},${protocol.longitude}&z=15&output=embed`}
                className="w-full h-full border-0"
                title="Mapa de localização"
                loading="lazy"
              />
            </div>

            {/* Informações da localização */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Latitude</Label>
                <p className="text-sm font-mono">{protocol.latitude}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Longitude</Label>
                <p className="text-sm font-mono">{protocol.longitude}</p>
              </div>
            </div>

            {/* Endereço */}
            {hasAddress && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Endereço</Label>
                <p className="text-sm">{protocol.address}</p>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps?q=${protocol.latitude},${protocol.longitude}`,
                    '_blank'
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir no Google Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${protocol.latitude},${protocol.longitude}`,
                    '_blank'
                  )
                }
              >
                <MapPin className="h-4 w-4 mr-2" />
                Como Chegar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* IMAGENS - Galeria de Fotos */}
      {hasImages && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              Fotos Anexadas
            </CardTitle>
            <CardDescription>
              {protocol.customData.images.length} foto(s) enviada(s) pelo solicitante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {protocol.customData.images.map((img: any, idx: number) => (
                <div key={idx} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted">
                    <img
                      src={img.url || img}
                      alt={img.description || `Foto ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => setSelectedImage(img.url || img)}
                    />
                  </div>

                  {/* Overlay de ações */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedImage(img.url || img)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ampliar
                    </Button>
                    {(img.url || img) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        asChild
                      >
                        <a
                          href={img.url || img}
                          download={`foto-${idx + 1}.jpg`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Descrição da imagem */}
                  {img.description && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {img.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AGENDAMENTO - Calendário */}
      {hasScheduling && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Agendamento
            </CardTitle>
            <CardDescription>
              Informações de data e horário agendados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Data/Hora principal */}
            <div className="space-y-3">
              {protocol.customData.appointmentDate && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Data e Hora do Agendamento
                    </Label>
                    <p className="text-lg font-semibold">
                      {format(
                        new Date(protocol.customData.appointmentDate),
                        "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                </div>
              )}

              {protocol.customData.scheduleDate && !protocol.customData.appointmentDate && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Data Agendada</Label>
                    <p className="text-lg font-semibold">
                      {format(
                        new Date(protocol.customData.scheduleDate),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                </div>
              )}

              {protocol.customData.eventDate && !protocol.customData.appointmentDate && !protocol.customData.scheduleDate && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Data do Evento</Label>
                    <p className="text-lg font-semibold">
                      {format(
                        new Date(protocol.customData.eventDate),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Informações adicionais */}
            <div className="grid grid-cols-2 gap-4">
              {protocol.customData.location && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Local</Label>
                  <p className="text-sm">{protocol.customData.location}</p>
                </div>
              )}
              {protocol.customData.duration && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Duração</Label>
                  <p className="text-sm">{protocol.customData.duration}</p>
                </div>
              )}
              {protocol.customData.specialty && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Especialidade</Label>
                  <p className="text-sm">{protocol.customData.specialty}</p>
                </div>
              )}
              {protocol.customData.professional && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Profissional</Label>
                  <p className="text-sm">{protocol.customData.professional}</p>
                </div>
              )}
            </div>

            {/* Ações */}
            {protocol.customData.appointmentDate && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Reagendar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Comprovante
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de visualização de imagem */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-black/95">
            <div className="relative w-full h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>

              <div className="flex items-center justify-center p-8">
                <img
                  src={selectedImage}
                  alt="Visualização ampliada"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
