'use client';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { queryRecords } from '@/services/registry.service';
import { Card, CardContent } from '@/components/ui/card';
import type { WidgetProps } from './WidgetRegistry';
import { buildQuery } from './useRecords';

const icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function parseGeo(raw: unknown): { lat: number; lng: number } | null {
  if (raw == null) return null;
  if (typeof raw === 'string') { const [a, b] = raw.split(',').map((s) => Number(s.trim())); return Number.isFinite(a) && Number.isFinite(b) ? { lat: a, lng: b } : null; }
  if (Array.isArray(raw) && raw.length >= 2) { const [a, b] = raw.map(Number); return Number.isFinite(a) && Number.isFinite(b) ? { lat: a, lng: b } : null; }
  if (typeof raw === 'object') { const o = raw as Record<string, unknown>; const lat = Number(o.lat ?? o.latitude); const lng = Number(o.lng ?? o.long ?? o.longitude); return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null; }
  return null;
}

/** MAP — pontos dos registros com campo GEO (aplica filtros compartilhados). */
export function MapWidget({ code, schema, sharedFilters }: WidgetProps) {
  const geoField = useMemo(() => (schema.fields ?? []).find((f) => f.dataType === 'GEO'), [schema]);
  const labelKey = useMemo(() => (schema.fields ?? []).find((f) => f.displayInTable)?.key || (schema.fields ?? [])[0]?.key, [schema]);
  const [pins, setPins] = useState<Array<{ id: string; lat: number; lng: number; label: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!geoField) { setLoading(false); return; }
    setLoading(true);
    queryRecords({ ...buildQuery(code, schema, sharedFilters, 200) })
      .then((res) => {
        const list: Array<{ id: string; lat: number; lng: number; label: string }> = [];
        for (const r of res.records as Array<{ id: string; data: Record<string, unknown> }>) {
          const g = parseGeo(r.data[geoField.key]);
          if (g) list.push({ id: r.id, ...g, label: labelKey ? String(r.data[labelKey] ?? '') : r.id });
        }
        setPins(list);
      })
      .catch(() => setPins([]))
      .finally(() => setLoading(false));
  }, [code, schema, geoField, labelKey, JSON.stringify(sharedFilters)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!geoField) return <Card><CardContent className="p-8 text-center text-muted-foreground">Sem campo de localização.</CardContent></Card>;
  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando mapa…</div>;
  if (pins.length === 0) return <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum registro com localização.</CardContent></Card>;

  return (
    <Card><CardContent className="p-0">
      <MapContainer center={[pins[0].lat, pins[0].lng]} zoom={12} style={{ height: 420, width: '100%', borderRadius: 8 }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {pins.map((p) => <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}><Popup>{p.label || 'Registro'}</Popup></Marker>)}
      </MapContainer>
    </CardContent></Card>
  );
}
