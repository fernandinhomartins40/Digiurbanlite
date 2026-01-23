'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Printer,
  Maximize2,
  Minimize2
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configurar worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: string | File | ArrayBuffer;
  fileName?: string;
  onDownload?: () => void;
  onPrint?: () => void;
  showControls?: boolean;
  className?: string;
}

export function PDFViewer({
  file,
  fileName = 'documento.pdf',
  onDownload,
  onPrint,
  showControls = true,
  className = ''
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Erro ao carregar PDF:', error);
    setError('Erro ao carregar documento PDF');
    setLoading(false);
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }

    // Download padrão
    if (typeof file === 'string') {
      const link = document.createElement('a');
      link.href = file;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    window.print();
  };

  return (
    <div className={`flex flex-col h-full bg-gray-100 ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Controls */}
      {showControls && (
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Navegação de Páginas */}
          <div className="flex items-center gap-2">
            <Button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1 || loading}
              variant="outline"
              size="sm"
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium whitespace-nowrap">
              {loading ? '...' : `${pageNumber} / ${numPages}`}
            </span>
            <Button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages || loading}
              variant="outline"
              size="sm"
              className="h-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <Button
              onClick={zoomOut}
              disabled={scale <= 0.5 || loading}
              variant="outline"
              size="sm"
              className="h-8"
              title="Reduzir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              onClick={zoomIn}
              disabled={scale >= 3.0 || loading}
              variant="outline"
              size="sm"
              className="h-8"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="h-8"
              title="Baixar PDF"
            >
              <Download className="h-4 w-4 mr-1" />
              Baixar
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="h-8"
              title="Imprimir"
            >
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </Button>
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className="h-8"
              title={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* PDF Container */}
      <div className="flex-1 overflow-auto bg-gray-200 p-4">
        <div className="flex justify-center">
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando documento...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-red-600">
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-2">Tente novamente ou entre em contato com o suporte</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              className="shadow-lg"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="bg-white"
              />
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}
