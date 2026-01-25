'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface SignaturePosition {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PDFSignaturePlacerProps {
  fileUrl: string;
  fileName: string;
  onPositionSelected: (position: SignaturePosition) => void;
  selectedPosition?: SignaturePosition | null;
}

export function PDFSignaturePlacer({
  fileUrl,
  fileName,
  onPositionSelected,
  selectedPosition
}: PDFSignaturePlacerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.5);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [tempPosition, setTempPosition] = useState<SignaturePosition | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Carregar PDF.js dinamicamente
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Importar PDF.js
        const pdfjsLib = await import('pdfjs-dist');

        // Configurar worker - usar CDN para evitar problemas de build
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        // Carregar documento
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;

        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err: any) {
        console.error('Erro ao carregar PDF:', err);
        setError('Erro ao carregar o documento PDF');
        setLoading(false);
        toast.error('Erro ao carregar PDF');
      }
    };

    if (fileUrl) {
      loadPdfJs();
    }
  }, [fileUrl]);

  // Renderizar página atual
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Erro ao renderizar página:', err);
        toast.error('Erro ao renderizar página do PDF');
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale]);

  // Handlers de mouse para desenhar área de assinatura
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
    setTempPosition(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);
    const x = Math.min(dragStart.x, currentX);
    const y = Math.min(dragStart.y, currentY);

    setTempPosition({
      page: currentPage,
      x,
      y,
      width,
      height,
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !tempPosition) {
      setIsDragging(false);
      setDragStart(null);
      return;
    }

    // Validar tamanho mínimo
    if (tempPosition.width < 50 || tempPosition.height < 30) {
      toast.error('A área de assinatura deve ter tamanho mínimo de 50x30 pixels');
      setTempPosition(null);
      setIsDragging(false);
      setDragStart(null);
      return;
    }

    // Converter coordenadas do canvas para coordenadas do PDF
    const canvas = canvasRef.current;
    if (!canvas) return;

    const normalizedPosition: SignaturePosition = {
      page: currentPage,
      x: tempPosition.x / canvas.width,
      y: tempPosition.y / canvas.height,
      width: tempPosition.width / canvas.width,
      height: tempPosition.height / canvas.height,
    };

    onPositionSelected(normalizedPosition);
    setIsDragging(false);
    setDragStart(null);

    toast.success('Área de assinatura definida com sucesso!');
  };

  // Renderizar retângulo da área de assinatura
  const renderSignatureArea = () => {
    const position = tempPosition || selectedPosition;
    if (!position || position.page !== currentPage) return null;

    const canvas = canvasRef.current;
    if (!canvas) return null;

    let displayX = position.x;
    let displayY = position.y;
    let displayWidth = position.width;
    let displayHeight = position.height;

    // Se é uma posição selecionada (normalizada), converter de volta para pixels
    if (selectedPosition && !tempPosition) {
      displayX = position.x * canvas.width;
      displayY = position.y * canvas.height;
      displayWidth = position.width * canvas.width;
      displayHeight = position.height * canvas.height;
    }

    return (
      <div
        style={{
          position: 'absolute',
          left: `${displayX}px`,
          top: `${displayY}px`,
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          border: '3px dashed #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
        className="flex items-center justify-center"
      >
        <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium shadow-lg">
          Área de Assinatura
        </div>
      </div>
    );
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    setTempPosition(null);
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
    setTempPosition(null);
  };

  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex items-center justify-center h-full p-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando documento PDF...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex items-center justify-center h-full p-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">Erro ao carregar PDF</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Navegação de páginas */}
          <div className="flex items-center gap-2 border-r pr-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-700 min-w-[80px] text-center">
              Página {currentPage} de {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Controles de zoom */}
          <div className="flex items-center gap-2 border-r pr-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-700 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-start gap-3">
          <MousePointer2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Como posicionar a assinatura:</p>
            <p className="mt-1">
              Clique e arraste no documento para definir onde a assinatura digital será aplicada.
              A área selecionada será destacada em azul.
            </p>
          </div>
        </div>
      </div>

      {/* Visualizador PDF */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 bg-gray-100"
      >
        <div className="relative inline-block mx-auto">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 shadow-lg bg-white cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (isDragging) {
                setIsDragging(false);
                setDragStart(null);
                setTempPosition(null);
              }
            }}
          />
          {renderSignatureArea()}
        </div>
      </div>
    </div>
  );
}
