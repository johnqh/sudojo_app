/**
 * ScanBoard - Component for scanning a Sudoku puzzle from an image
 * Uses OCR to extract digits from an uploaded or captured image
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent, Text } from '@sudobility/components';
import { extractSudokuFromImage, detectAndCropBoard, extractCellImages, type OCRProgress, type OCRResult } from '@/utils/SudokuOCR';

interface ScanBoardProps {
  onScanComplete: (puzzle: string) => void;
  onCancel: () => void;
}

export default function ScanBoard({ onScanComplete, onCancel }: ScanBoardProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [cellImages, setCellImages] = useState<string[]>([]);
  const [isCropping, setIsCropping] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Process a file (shared between file input and drag/drop)
  const processFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('scan.errors.invalidFileType'));
      return;
    }

    setError(null);
    setResult(null);
    setCroppedImage(null);
    setCellImages([]);
    setIsCropping(true);

    // Create preview of original
    const reader = new FileReader();
    reader.onload = async (e) => {
      const originalDataUrl = e.target?.result as string;
      setOriginalImage(originalDataUrl);

      // Detect and crop the board
      try {
        const croppedDataUrl = await detectAndCropBoard(originalDataUrl);
        setCroppedImage(croppedDataUrl);

        // Extract cell images with 15.4% margin from each side (optimal for OCR)
        const cells = await extractCellImages(croppedDataUrl, 0.154);
        setCellImages(cells);
      } catch (err) {
        console.error('Board detection error:', err);
        // If detection fails, use original image
        setCroppedImage(originalDataUrl);
      }
      setIsCropping(false);
    };
    reader.readAsDataURL(file);
  }, [t]);

  // Handle file selection from input
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // Trigger file picker
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Process the selected image
  const handleScan = useCallback(async () => {
    if (!croppedImage) return;

    setError(null);
    setResult(null);

    try {
      const ocrResult = await extractSudokuFromImage(
        croppedImage,
        {
          cellMargin: 0.154, // 15.4% margin - optimal for OCR accuracy
          minConfidence: 10, // Lower with contrast enhancement
          preprocess: false,
          skipBoardDetection: true, // Image is already cropped to board
        },
        setProgress
      );

      setResult(ocrResult);

      // Check if we got a reasonable number of digits
      const digitCount = ocrResult.puzzle.replace(/0/g, '').length;
      if (digitCount < 17) {
        setError(t('scan.errors.tooFewDigits', { count: digitCount }));
      } else {
        // Automatically switch to entry mode so user can review/fix mistakes
        onScanComplete(ocrResult.puzzle);
      }
    } catch (err) {
      setError(t('scan.errors.processingFailed'));
      console.error('OCR error:', err);
    }
  }, [croppedImage, t, onScanComplete]);

  // Accept the OCR result
  const handleAccept = useCallback(() => {
    if (result) {
      onScanComplete(result.puzzle);
    }
  }, [result, onScanComplete]);

  // Reset and try again
  const handleRetry = useCallback(() => {
    setOriginalImage(null);
    setCroppedImage(null);
    setCellImages([]);
    setProgress(null);
    setError(null);
    setResult(null);
    setIsCropping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const isProcessing = progress !== null && progress.status !== 'complete' && progress.status !== 'error';

  return (
    <div className="space-y-6 max-w-[500px] mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Instructions */}
      <Card>
        <CardContent className="py-3">
          <Text size="sm" color="muted" className="text-center">
            {t('scan.instructions')}
          </Text>
        </CardContent>
      </Card>

      {/* Image preview or upload prompt */}
      {originalImage ? (
        <div className="space-y-4">
          {/* Show both original and cropped images */}
          <div className="grid grid-cols-2 gap-4">
            {/* Original image */}
            <div>
              <Text size="xs" color="muted" className="mb-1 text-center">Original</Text>
              <img
                src={originalImage}
                alt="Original"
                className="w-full aspect-square object-contain rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </div>
            {/* Cropped image */}
            <div>
              <Text size="xs" color="muted" className="mb-1 text-center">Detected Board</Text>
              <div className="relative w-full aspect-square rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {isCropping ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : croppedImage ? (
                  <img
                    src={croppedImage}
                    alt="Detected board"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <Text size="sm" color="muted">Detection failed</Text>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 9x9 Grid of cropped and sharpened cell images */}
          {cellImages.length === 81 && (
            <div>
              <Text size="xs" color="muted" className="mb-1 text-center">Cell Images (scaled 100px)</Text>
              <div className="grid grid-cols-9 gap-[1px] bg-gray-400 dark:bg-gray-600 border border-gray-400 dark:border-gray-600">
                {cellImages.map((cellImg, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-white dark:bg-gray-900"
                  >
                    <img
                      src={cellImg}
                      alt={`Cell ${Math.floor(index / 9)},${index % 9}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing overlay */}
          {isProcessing && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-center mb-2">{progress?.message}</div>
              <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress?.progress ?? 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleUploadClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`w-full aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
          }`}
        >
          <svg
            className={`w-16 h-16 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <Text color="muted">{t('scan.uploadPrompt')}</Text>
        </button>
      )}

      {/* Error message */}
      {error && (
        <Card className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-3">
            <Text size="sm" className="text-red-600 dark:text-red-400 text-center">
              {error}
            </Text>
          </CardContent>
        </Card>
      )}

      {/* Result info */}
      {result && !error && (
        <Card className="border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
          <CardContent className="py-3">
            <Text size="sm" className="text-green-600 dark:text-green-400 text-center">
              {t('scan.detected', {
                count: result.puzzle.replace(/0/g, '').length,
                confidence: Math.round(result.confidence),
              })}
            </Text>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {!originalImage ? (
          <>
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleUploadClick}>
              {t('scan.selectImage')}
            </Button>
          </>
        ) : result ? (
          <>
            <Button variant="outline" className="flex-1" onClick={handleRetry}>
              {t('scan.retry')}
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleAccept}>
              {t('scan.accept')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" className="flex-1" onClick={handleRetry} disabled={isProcessing}>
              {t('scan.changeImage')}
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleScan} disabled={isProcessing}>
              {isProcessing ? t('scan.processing') : t('scan.scanImage')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
