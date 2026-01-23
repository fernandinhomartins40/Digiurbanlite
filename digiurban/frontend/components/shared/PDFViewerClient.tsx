'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Importar PDFViewer apenas no cliente para evitar erros SSR com DOMMatrix
const PDFViewerComponent = dynamic(
  () => import('./PDFViewer').then(mod => ({ default: mod.PDFViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando visualizador PDF...</p>
        </div>
      </div>
    ),
  }
);

type PDFViewerProps = ComponentProps<typeof import('./PDFViewer').PDFViewer>;

export function PDFViewerClient(props: PDFViewerProps) {
  return <PDFViewerComponent {...props} />;
}
