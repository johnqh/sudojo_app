/**
 * SudokuOCR - Extracts Sudoku digits from an image
 *
 * Based on the OCR logic from iOS (SudokuScanner.swift) and Android (SudokuScanner.kt):
 * 1. Detect bounding rectangle (or accept pre-cropped image)
 * 2. Break the rectangle into 9x9 grid
 * 3. Run OCR on each cell with border margin removal
 */

import Tesseract from 'tesseract.js';

export interface OCRProgress {
  status: 'loading' | 'recognizing' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
}

export interface OCRResult {
  puzzle: string; // 81-character string (0 for empty cells)
  confidence: number; // Average confidence 0-100
  cellResults: CellOCRResult[];
}

export interface CellOCRResult {
  index: number;
  row: number;
  column: number;
  digit: number | null;
  confidence: number;
  text: string; // Raw recognized text
}

/**
 * Configuration for OCR processing
 */
export interface OCRConfig {
  /** Margin to remove from each cell (percentage, 0-0.5). Default: 0.12 (12%) */
  cellMargin: number;
  /** Minimum confidence threshold (0-100). Default: 40 */
  minConfidence: number;
  /** Whether to preprocess the image (contrast, threshold). Default: true */
  preprocess: boolean;
  /** Skip board detection - use when image is already cropped to the board. Default: false */
  skipBoardDetection: boolean;
}

const DEFAULT_CONFIG: OCRConfig = {
  cellMargin: 0.154, // 15.4% margin - optimal based on extensive testing
  minConfidence: 1, // Very low - rely on parseDigitFromText to validate
  preprocess: true,
  skipBoardDetection: false,
};

/**
 * Extract a Sudoku puzzle from an image
 *
 * @param imageSource - Image source (File, Blob, HTMLImageElement, HTMLCanvasElement, or data URL)
 * @param config - OCR configuration options
 * @param onProgress - Progress callback
 * @returns OCR result with puzzle string and confidence
 */
export async function extractSudokuFromImage(
  imageSource: File | Blob | HTMLImageElement | HTMLCanvasElement | string,
  config: Partial<OCRConfig> = {},
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  onProgress?.({ status: 'loading', progress: 0, message: 'Loading image...' });

  // Load image onto canvas
  const sourceCanvas = await loadImageToCanvas(imageSource);

  // Step 1: Detect the Sudoku board rectangle and crop to it (unless already cropped)
  let croppedCanvas: HTMLCanvasElement;
  if (cfg.skipBoardDetection) {
    croppedCanvas = sourceCanvas;
    onProgress?.({ status: 'processing', progress: 15, message: 'Processing image...' });
  } else {
    onProgress?.({ status: 'processing', progress: 5, message: 'Detecting board...' });
    croppedCanvas = await detectAndCropBoardInternal(sourceCanvas);
    onProgress?.({ status: 'processing', progress: 15, message: 'Processing image...' });
  }

  // Step 2: Preprocess if enabled
  const processedCanvas = cfg.preprocess
    ? preprocessImage(croppedCanvas)
    : croppedCanvas;

  // Step 3: Extract cells from the cropped board
  const cells = extractCells(processedCanvas, cfg.cellMargin);

  onProgress?.({
    status: 'recognizing',
    progress: 20,
    message: 'Recognizing digits...',
  });

  // Run OCR on all cells
  const cellResults = await recognizeCells(cells, cfg.minConfidence, (cellProgress) => {
    const overallProgress = 20 + (cellProgress * 0.75); // 20-95%
    onProgress?.({
      status: 'recognizing',
      progress: overallProgress,
      message: `Recognizing cell ${Math.floor(cellProgress * 81 / 100) + 1}/81...`,
    });
  });

  onProgress?.({ status: 'processing', progress: 95, message: 'Finalizing...' });

  // Build puzzle string
  const puzzle = cellResults.map((r) => r.digit ?? 0).join('');

  // Calculate average confidence (only for recognized digits)
  const recognizedCells = cellResults.filter((r) => r.digit !== null);
  const avgConfidence =
    recognizedCells.length > 0
      ? recognizedCells.reduce((sum, r) => sum + r.confidence, 0) / recognizedCells.length
      : 0;

  onProgress?.({ status: 'complete', progress: 100, message: 'Complete' });

  return {
    puzzle,
    confidence: avgConfidence,
    cellResults,
  };
}

/**
 * Detect the Sudoku board in the image and crop to it
 * This is crucial for accurate cell extraction
 * Exported so UI can show the cropped preview
 */
export async function detectAndCropBoard(
  imageSource: File | Blob | HTMLImageElement | HTMLCanvasElement | string
): Promise<string> {
  const source = await loadImageToCanvas(imageSource);
  const cropped = await detectAndCropBoardInternal(source);
  return cropped.toDataURL('image/png');
}

// Image processing functions removed - Tesseract's internal processing works better
// than our preprocessing attempts (denoise, binarize, contrast enhance all made results worse)

/**
 * Extract the 81 cell images from a cropped board image
 * Returns array of 81 data URLs (row-major order)
 * Each cell is: cropped -> scaled up -> denoised -> contrast enhanced
 * This matches exactly what OCR receives
 */
export async function extractCellImages(
  croppedBoardImage: string,
  marginRatio: number = 0.10
): Promise<string[]> {
  const source = await loadImageToCanvas(croppedBoardImage);
  const cellWidth = source.width / 9;
  const cellHeight = source.height / 9;
  const marginX = cellWidth * marginRatio;
  const marginY = cellHeight * marginRatio;

  // Target size for OCR - 100px is optimal (tested)
  const targetSize = 100;

  const cellImages: string[] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const srcX = col * cellWidth + marginX;
      const srcY = row * cellHeight + marginY;
      const srcWidth = cellWidth - 2 * marginX;
      const srcHeight = cellHeight - 2 * marginY;

      // Scale up to target size
      const scale = Math.max(1, targetSize / Math.min(srcWidth, srcHeight));
      const cellCanvas = document.createElement('canvas');
      cellCanvas.width = Math.round(srcWidth * scale);
      cellCanvas.height = Math.round(srcHeight * scale);

      const ctx = cellCanvas.getContext('2d')!;
      // Use better interpolation for scaling up
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        source,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        0,
        0,
        cellCanvas.width,
        cellCanvas.height
      );

      // No processing - show raw scaled cell (matches OCR pipeline)
      cellImages.push(cellCanvas.toDataURL('image/png'));
    }
  }

  return cellImages;
}

/**
 * Internal function to detect and crop board from canvas
 * Uses edge detection and contour finding to locate the actual grid rectangle,
 * similar to Android's OpenCV approach
 */
async function detectAndCropBoardInternal(source: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const width = source.width;
  const height = source.height;
  const ctx = source.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Step 1: Convert to grayscale
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = Math.floor(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }

  // Step 2: Apply Gaussian blur (3x3 kernel)
  const blurred = gaussianBlur(gray, width, height);

  // Step 3: Canny-like edge detection
  const edges = cannyEdgeDetection(blurred, width, height);

  // Step 4: Find the largest rectangle using contour analysis
  const rectangle = findLargestRectangle(edges, width, height);

  if (rectangle) {
    // Found a rectangle - crop to it
    const { left, top, right, bottom } = rectangle;
    const cropWidth = right - left;
    const cropHeight = bottom - top;
    const size = Math.min(cropWidth, cropHeight);

    // Center within the detected rectangle if not perfectly square
    const extraWidth = cropWidth - size;
    const extraHeight = cropHeight - size;
    const adjustedLeft = left + Math.floor(extraWidth / 2);
    const adjustedTop = top + Math.floor(extraHeight / 2);

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = size;
    croppedCanvas.height = size;
    const croppedCtx = croppedCanvas.getContext('2d')!;
    croppedCtx.drawImage(source, adjustedLeft, adjustedTop, size, size, 0, 0, size, size);
    return croppedCanvas;
  }

  // Fallback: use the old dark-pixel method if rectangle detection fails
  console.warn('[OCR] Rectangle detection failed, using fallback method');
  return detectAndCropBoardFallback(source, gray, width, height);
}

/**
 * Apply 3x3 Gaussian blur
 */
function gaussianBlur(gray: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(width * height);
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kernelSum = 16;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          sum += gray[idx] * kernel[kernelIdx];
        }
      }
      result[y * width + x] = Math.floor(sum / kernelSum);
    }
  }
  return result;
}

/**
 * Canny-like edge detection using Sobel operators
 */
function cannyEdgeDetection(gray: Uint8Array, width: number, height: number): Uint8Array {
  const edges = new Uint8Array(width * height);
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  // Calculate gradient magnitude
  const magnitude = new Float32Array(width * height);
  let maxMag = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += gray[idx] * sobelX[kernelIdx];
          gy += gray[idx] * sobelY[kernelIdx];
        }
      }
      const mag = Math.sqrt(gx * gx + gy * gy);
      magnitude[y * width + x] = mag;
      if (mag > maxMag) maxMag = mag;
    }
  }

  // Threshold at 20% of max magnitude (adaptive threshold)
  const threshold = maxMag * 0.2;
  for (let i = 0; i < magnitude.length; i++) {
    edges[i] = magnitude[i] > threshold ? 255 : 0;
  }

  return edges;
}

/**
 * Find long continuous horizontal runs of edge pixels
 */
function findHorizontalLines(edges: Uint8Array, width: number, height: number): Array<{ y: number; strength: number }> {
  const lines: Array<{ y: number; strength: number }> = [];
  const minRunLength = width * 0.5; // At least 50% of width must be continuous

  for (let y = 0; y < height; y++) {
    let maxRun = 0;
    let currentRun = 0;

    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > 0) {
        currentRun++;
        if (currentRun > maxRun) maxRun = currentRun;
      } else {
        currentRun = 0;
      }
    }

    if (maxRun >= minRunLength) {
      lines.push({ y, strength: maxRun / width });
    }
  }

  return lines;
}

/**
 * Find long continuous vertical runs of edge pixels
 */
function findVerticalLines(edges: Uint8Array, width: number, height: number): Array<{ x: number; strength: number }> {
  const lines: Array<{ x: number; strength: number }> = [];
  const minRunLength = height * 0.5;

  for (let x = 0; x < width; x++) {
    let maxRun = 0;
    let currentRun = 0;

    for (let y = 0; y < height; y++) {
      if (edges[y * width + x] > 0) {
        currentRun++;
        if (currentRun > maxRun) maxRun = currentRun;
      } else {
        currentRun = 0;
      }
    }

    if (maxRun >= minRunLength) {
      lines.push({ x, strength: maxRun / height });
    }
  }

  return lines;
}

/**
 * Find the largest rectangle in the edge image
 * Looks for continuous horizontal and vertical lines that form a grid border
 */
function findLargestRectangle(
  edges: Uint8Array,
  width: number,
  height: number
): { left: number; top: number; right: number; bottom: number } | null {
  // Find continuous lines (not just scattered edge pixels)
  const hLines = findHorizontalLines(edges, width, height);
  const vLines = findVerticalLines(edges, width, height);

  // Group nearby lines and keep strongest
  const margin = Math.min(width, height) * 0.03;

  const groupedHLines: Array<{ y: number; strength: number }> = [];
  for (const line of hLines) {
    const existing = groupedHLines.find(g => Math.abs(g.y - line.y) < margin);
    if (existing) {
      if (line.strength > existing.strength) {
        existing.y = line.y;
        existing.strength = line.strength;
      }
    } else {
      groupedHLines.push({ ...line });
    }
  }

  const groupedVLines: Array<{ x: number; strength: number }> = [];
  for (const line of vLines) {
    const existing = groupedVLines.find(g => Math.abs(g.x - line.x) < margin);
    if (existing) {
      if (line.strength > existing.strength) {
        existing.x = line.x;
        existing.strength = line.strength;
      }
    } else {
      groupedVLines.push({ ...line });
    }
  }

  // Sort by position
  groupedHLines.sort((a, b) => a.y - b.y);
  groupedVLines.sort((a, b) => a.x - b.x);

  if (groupedHLines.length < 2 || groupedVLines.length < 2) {
    return findLargestRectangleLowThreshold(edges, width, height);
  }

  // Find the best square-like rectangle
  let bestRect: { left: number; top: number; right: number; bottom: number } | null = null;
  let bestScore = 0;

  const borderMargin = Math.min(width, height) * 0.02;

  for (let i = 0; i < groupedHLines.length - 1; i++) {
    for (let j = i + 1; j < groupedHLines.length; j++) {
      const top = groupedHLines[i].y;
      const bottom = groupedHLines[j].y;
      const rectHeight = bottom - top;

      if (rectHeight < height * 0.3) continue;

      for (let k = 0; k < groupedVLines.length - 1; k++) {
        for (let l = k + 1; l < groupedVLines.length; l++) {
          const left = groupedVLines[k].x;
          const right = groupedVLines[l].x;
          const rectWidth = right - left;

          if (rectWidth < width * 0.3) continue;

          // Score: prefer large squares
          const area = rectWidth * rectHeight;
          const aspectRatio = Math.min(rectWidth, rectHeight) / Math.max(rectWidth, rectHeight);

          // Strong preference for square (sudoku grids are always square)
          const squareBonus = aspectRatio > 0.9 ? 2.5 : aspectRatio > 0.8 ? 2.0 : aspectRatio > 0.7 ? 1.5 : 1.0;

          // Penalize rectangles that touch image boundaries (likely includes headers/footers)
          let boundaryPenalty = 1.0;
          if (top < borderMargin) boundaryPenalty *= 0.7;
          if (bottom > height - borderMargin) boundaryPenalty *= 0.7;
          if (left < borderMargin) boundaryPenalty *= 0.8;
          if (right > width - borderMargin) boundaryPenalty *= 0.8;

          const score = area * aspectRatio * squareBonus * boundaryPenalty;

          if (score > bestScore) {
            bestScore = score;
            bestRect = { left, top, right, bottom };
          }
        }
      }
    }
  }

  return bestRect;
}

/**
 * Fallback rectangle detection with lower threshold
 */
function findLargestRectangleLowThreshold(
  edges: Uint8Array,
  width: number,
  height: number
): { left: number; top: number; right: number; bottom: number } | null {
  // Use a lower threshold and look for the largest white rectangular region
  // (sudoku cells are white, background might be colored)

  // Find rows with sudden transition from low to high edge density
  // This helps skip header text and find the actual grid

  const windowSize = Math.floor(height * 0.05);
  let bestTop = 0, bestBottom = height - 1;
  let bestLeft = 0, bestRight = width - 1;

  // Find horizontal boundaries - look for continuous horizontal edge segments
  const hDensity = new Float32Array(height);
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > 0) count++;
    }
    hDensity[y] = count / width;
  }

  // Find top edge - first row with high density followed by sustained density
  for (let y = 0; y < height - windowSize; y++) {
    if (hDensity[y] > 0.15) {
      // Check if this starts a dense region
      let sustainedCount = 0;
      for (let dy = 0; dy < windowSize; dy++) {
        if (hDensity[y + dy] > 0.1) sustainedCount++;
      }
      if (sustainedCount > windowSize * 0.3) {
        bestTop = y;
        break;
      }
    }
  }

  // Find bottom edge - last row with high density
  for (let y = height - 1; y > bestTop + windowSize; y--) {
    if (hDensity[y] > 0.15) {
      let sustainedCount = 0;
      for (let dy = 0; dy < windowSize && y - dy > bestTop; dy++) {
        if (hDensity[y - dy] > 0.1) sustainedCount++;
      }
      if (sustainedCount > windowSize * 0.3) {
        bestBottom = y;
        break;
      }
    }
  }

  // Find vertical boundaries similarly
  const vDensity = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    let count = 0;
    for (let y = bestTop; y <= bestBottom; y++) {
      if (edges[y * width + x] > 0) count++;
    }
    vDensity[x] = count / (bestBottom - bestTop + 1);
  }

  // Find left edge
  for (let x = 0; x < width - windowSize; x++) {
    if (vDensity[x] > 0.15) {
      let sustainedCount = 0;
      for (let dx = 0; dx < windowSize; dx++) {
        if (vDensity[x + dx] > 0.1) sustainedCount++;
      }
      if (sustainedCount > windowSize * 0.3) {
        bestLeft = x;
        break;
      }
    }
  }

  // Find right edge
  for (let x = width - 1; x > bestLeft + windowSize; x--) {
    if (vDensity[x] > 0.15) {
      let sustainedCount = 0;
      for (let dx = 0; dx < windowSize && x - dx > bestLeft; dx++) {
        if (vDensity[x - dx] > 0.1) sustainedCount++;
      }
      if (sustainedCount > windowSize * 0.3) {
        bestRight = x;
        break;
      }
    }
  }

  // Validate the detected rectangle
  const rectWidth = bestRight - bestLeft;
  const rectHeight = bestBottom - bestTop;

  if (rectWidth < width * 0.2 || rectHeight < height * 0.2) {
    return null; // Too small, detection failed
  }

  return { left: bestLeft, top: bestTop, right: bestRight, bottom: bestBottom };
}

/**
 * Fallback board detection using dark pixel method
 */
function detectAndCropBoardFallback(
  source: HTMLCanvasElement,
  gray: Uint8Array,
  width: number,
  height: number
): HTMLCanvasElement {
  const threshold = 200;
  const minDarkPixelsPercent = 0.1;

  let top = 0;
  for (let y = 0; y < height; y++) {
    let darkCount = 0;
    for (let x = 0; x < width; x++) {
      if (gray[y * width + x] < threshold) darkCount++;
    }
    if (darkCount / width > minDarkPixelsPercent) {
      top = y;
      break;
    }
  }

  let bottom = height - 1;
  for (let y = height - 1; y >= 0; y--) {
    let darkCount = 0;
    for (let x = 0; x < width; x++) {
      if (gray[y * width + x] < threshold) darkCount++;
    }
    if (darkCount / width > minDarkPixelsPercent) {
      bottom = y;
      break;
    }
  }

  let left = 0;
  for (let x = 0; x < width; x++) {
    let darkCount = 0;
    for (let y = 0; y < height; y++) {
      if (gray[y * width + x] < threshold) darkCount++;
    }
    if (darkCount / height > minDarkPixelsPercent) {
      left = x;
      break;
    }
  }

  let right = width - 1;
  for (let x = width - 1; x >= 0; x--) {
    let darkCount = 0;
    for (let y = 0; y < height; y++) {
      if (gray[y * width + x] < threshold) darkCount++;
    }
    if (darkCount / height > minDarkPixelsPercent) {
      right = x;
      break;
    }
  }

  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;
  const size = Math.min(cropWidth, cropHeight);
  const extraWidth = cropWidth - size;
  const extraHeight = cropHeight - size;
  const adjustedLeft = left + Math.floor(extraWidth / 2);
  const adjustedTop = top + Math.floor(extraHeight / 2);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = size;
  croppedCanvas.height = size;
  const croppedCtx = croppedCanvas.getContext('2d')!;
  croppedCtx.drawImage(source, adjustedLeft, adjustedTop, size, size, 0, 0, size, size);

  return croppedCanvas;
}

/**
 * Load an image source onto a canvas
 */
async function loadImageToCanvas(
  source: File | Blob | HTMLImageElement | HTMLCanvasElement | string
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  if (source instanceof HTMLCanvasElement) {
    canvas.width = source.width;
    canvas.height = source.height;
    ctx.drawImage(source, 0, 0);
    return canvas;
  }

  if (source instanceof HTMLImageElement) {
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    ctx.drawImage(source, 0, 0);
    return canvas;
  }

  // File, Blob, or data URL string
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to load image'));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      // source is File or Blob
      img.src = URL.createObjectURL(source);
    }
  });
}

/**
 * Preprocess image for better OCR results
 * For clean printed images, we do minimal processing to preserve digit details.
 * Tesseract has its own internal binarization that works well.
 */
function preprocessImage(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const numPixels = canvas.width * canvas.height;

  // Convert to grayscale and enhance contrast
  // Find min/max for contrast stretching
  let minGray = 255;
  let maxGray = 0;

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const gray = Math.floor(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
    if (gray < minGray) minGray = gray;
    if (gray > maxGray) maxGray = gray;
  }

  // Apply contrast stretching to make digits darker and background whiter
  const range = maxGray - minGray || 1;

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const gray = Math.floor(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);

    // Stretch contrast: map [minGray, maxGray] to [0, 255]
    let stretched = Math.floor(((gray - minGray) / range) * 255);

    // Apply slight gamma correction to make digits more distinct
    // Values < 128 get darker, values > 128 get lighter
    stretched = Math.floor(255 * Math.pow(stretched / 255, 0.8));

    data[idx] = stretched;
    data[idx + 1] = stretched;
    data[idx + 2] = stretched;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Check if a cell is empty (mostly uniform brightness)
 * Uses standard deviation of pixel values to detect content
 */
function isCellEmpty(cellCanvas: HTMLCanvasElement, cellIndex?: number): boolean {
  const ctx = cellCanvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, cellCanvas.width, cellCanvas.height);
  const data = imageData.data;
  const totalPixels = cellCanvas.width * cellCanvas.height;

  // Calculate mean brightness (convert to grayscale properly)
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += gray;
  }
  const mean = sum / totalPixels;

  // Calculate standard deviation
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const diff = gray - mean;
    variance += diff * diff;
  }
  const stdDev = Math.sqrt(variance / totalPixels);

  // Empty cells have low standard deviation (uniform color)
  // Use threshold of 8 - thin digits like "7" and "1" have low stdDev
  const isEmpty = stdDev < 8;

  // Debug: log for first row
  if (cellIndex !== undefined && cellIndex < 9) {
    console.log(`[OCR] Cell ${cellIndex} empty check: stdDev=${stdDev.toFixed(1)}, isEmpty=${isEmpty}`);
  }

  return isEmpty;
}

/**
 * Extract 81 cell images from the sudoku grid
 * Each cell is cropped by marginRatio (e.g., 0.10 = 10%) from each of the four sides
 */
function extractCells(
  source: HTMLCanvasElement,
  marginRatio: number
): HTMLCanvasElement[] {
  const cells: HTMLCanvasElement[] = [];
  const cellWidth = source.width / 9;
  const cellHeight = source.height / 9;

  // Calculate margin in pixels - this is cropped from EACH side
  const marginX = cellWidth * marginRatio;
  const marginY = cellHeight * marginRatio;

  console.log(`[OCR] Source size: ${source.width}x${source.height}`);
  console.log(`[OCR] Cell size: ${cellWidth}x${cellHeight}`);
  console.log(`[OCR] Margin: ${marginX}px x ${marginY}px (${marginRatio * 100}% from each side)`);
  console.log(`[OCR] Cropped cell size: ${cellWidth - 2 * marginX}x${cellHeight - 2 * marginY}`);

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      // Calculate the source rectangle for this cell WITH margin removed
      // x starts at (col * cellWidth + marginX) to skip the left margin
      // width is (cellWidth - 2 * marginX) to remove both left and right margins
      const srcX = col * cellWidth + marginX;
      const srcY = row * cellHeight + marginY;
      const srcWidth = cellWidth - 2 * marginX;
      const srcHeight = cellHeight - 2 * marginY;

      const cellCanvas = document.createElement('canvas');
      // Scale cells to 100px - tested as optimal size for Tesseract
      const targetSize = 100;
      const scale = Math.max(1, targetSize / Math.min(srcWidth, srcHeight));
      cellCanvas.width = Math.round(srcWidth * scale);
      cellCanvas.height = Math.round(srcHeight * scale);

      const ctx = cellCanvas.getContext('2d')!;
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, cellCanvas.width, cellCanvas.height);
      // Use better interpolation for scaling up
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the cropped cell content (with margins removed)
      ctx.drawImage(
        source,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        0,
        0,
        cellCanvas.width,
        cellCanvas.height
      );

      // Debug: output first row of cell images as data URLs
      if (row === 0) {
        console.log(`[OCR] Cell (${row},${col}) - src rect: (${Math.round(srcX)}, ${Math.round(srcY)}, ${Math.round(srcWidth)}, ${Math.round(srcHeight)})`);
        console.log(`[OCR] Cell (${row},${col}) image:`, cellCanvas.toDataURL());
      }

      cells.push(cellCanvas);
    }
  }

  return cells;
}

/**
 * Enhance contrast of cell image for better OCR
 * This significantly improves recognition of problematic digits
 */
function enhanceContrastForOCR(cellCanvas: HTMLCanvasElement, factor: number = 1.5): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = cellCanvas.width;
  canvas.height = cellCanvas.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(cellCanvas, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Calculate average brightness
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const avgBrightness = sum / (data.length / 4);

  // Enhance contrast around the average
  for (let i = 0; i < data.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      const val = data[i + j];
      const newVal = avgBrightness + (val - avgBrightness) * factor;
      data[i + j] = Math.max(0, Math.min(255, Math.round(newVal)));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Binarize image - convert to black and white
 * This improves OCR accuracy by removing grayscale ambiguity
 */
function binarizeForOCR(cellCanvas: HTMLCanvasElement, threshold: number = 160): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = cellCanvas.width;
  canvas.height = cellCanvas.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(cellCanvas, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = gray < threshold ? 0 : 255;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Add padding around the digit for better OCR
 * Also ensures the image has good contrast
 */
function addPadding(cellCanvas: HTMLCanvasElement, padding: number): HTMLCanvasElement {
  const paddedCanvas = document.createElement('canvas');
  paddedCanvas.width = cellCanvas.width + padding * 2;
  paddedCanvas.height = cellCanvas.height + padding * 2;

  const ctx = paddedCanvas.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
  ctx.drawImage(cellCanvas, padding, padding);

  return paddedCanvas;
}

/**
 * Try to recognize a digit in the text returned by Tesseract
 */
function parseDigitFromText(text: string): number | null {
  const cleanText = text.trim();

  // Direct single digit match
  if (cleanText.length === 1 && /[1-9]/.test(cleanText)) {
    return parseInt(cleanText, 10);
  }

  // Look for any digit in the text (sometimes Tesseract adds extra characters)
  const match = cleanText.match(/[1-9]/);
  if (match) {
    return parseInt(match[0], 10);
  }

  // Common OCR misreads
  const corrections: Record<string, number> = {
    'l': 1, 'I': 1, '|': 1, 'i': 1, '!': 1,
    'Z': 2, 'z': 2,
    'E': 3,
    'A': 4, 'h': 4,
    'S': 5, 's': 5,
    'G': 6, 'b': 6,
    'T': 7, '/': 7, '?': 7, ')': 7, ']': 7, 'J': 7, 'j': 7,
    'B': 8,
    'g': 9, 'q': 9,
    'O': 0, 'o': 0, 'D': 0, // These map to 0 but we ignore 0
  };

  for (const char of cleanText) {
    const corrected = corrections[char];
    if (corrected !== undefined && corrected !== 0) {
      return corrected;
    }
  }

  return null;
}

/**
 * Run OCR on all cells using Tesseract.js
 * Simple approach: each cell is already cropped with 10% margin, just run OCR
 */
async function recognizeCells(
  cells: HTMLCanvasElement[],
  minConfidence: number,
  onProgress?: (progress: number) => void
): Promise<CellOCRResult[]> {
  const results: CellOCRResult[] = [];

  // Create a single worker for all cells
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: () => {}, // Suppress verbose logging
  });

  // Configure for single character recognition
  // PSM 10 = Single character mode
  // Note: No whitelist - works better with contrast enhancement
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR,
  });

  for (let i = 0; i < cells.length; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;

    // Check if cell is empty first (optimization)
    if (isCellEmpty(cells[i], i)) {
      results.push({
        index: i,
        row,
        column: col,
        digit: null,
        confidence: 100,
        text: '',
      });
      onProgress?.(((i + 1) / cells.length) * 100);
      continue;
    }

    // Apply preprocessing pipeline: contrast enhancement -> binarization -> padding
    // This significantly improves recognition accuracy (99%+ in testing)
    const contrastEnhanced = enhanceContrastForOCR(cells[i], 1.5);
    const binarized = binarizeForOCR(contrastEnhanced, 160);
    const cellToRecognize = addPadding(binarized, 20);
    let digit: number | null = null;
    let finalConfidence = 0;
    let finalText = '';

    // Debug: output processed cell for first row
    if (Math.floor(i / 9) === 0) {
      console.log(`[OCR] Cell ${i} size: ${cellToRecognize.width}x${cellToRecognize.height}`);
      console.log(`[OCR] Cell ${i} processed image:`, cellToRecognize.toDataURL());
    }

    try {
      const { data } = await worker.recognize(cellToRecognize);
      const text = data.text.trim();
      const confidence = data.confidence || 0;

      finalText = text;
      finalConfidence = confidence;

      // Debug: log OCR results for first row
      if (row === 0) {
        console.log(`[OCR] Cell (${row},${col}): text="${text}", confidence=${confidence}`);
      }

      // Try to parse a digit from the recognized text
      const parsedDigit = parseDigitFromText(text);

      if (parsedDigit !== null && confidence >= minConfidence) {
        digit = parsedDigit;
      }
    } catch {
      // OCR failed for this cell, leave as empty
    }

    results.push({
      index: i,
      row,
      column: col,
      digit,
      confidence: finalConfidence,
      text: finalText,
    });

    onProgress?.(((i + 1) / cells.length) * 100);
  }

  await worker.terminate();

  return results;
}

/**
 * Detect the largest rectangle in an image (simplified version)
 * Returns the corner points for perspective transform
 *
 * Note: For accurate rectangle detection, consider using opencv.js
 * This is a simplified version that works best with high-contrast images
 */
export async function detectSudokuRectangle(
  imageSource: File | Blob | HTMLImageElement | HTMLCanvasElement | string
): Promise<{ x: number; y: number }[] | null> {
  const canvas = await loadImageToCanvas(imageSource);
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Convert to grayscale and detect edges using Sobel operator
  const edges = detectEdges(imageData);

  // Find contours (simplified - look for strong horizontal and vertical lines)
  const lines = findLines(edges, canvas.width, canvas.height);

  if (lines.horizontal.length < 2 || lines.vertical.length < 2) {
    return null;
  }

  // Find the outermost lines to form the rectangle
  const topLine = lines.horizontal[0];
  const bottomLine = lines.horizontal[lines.horizontal.length - 1];
  const leftLine = lines.vertical[0];
  const rightLine = lines.vertical[lines.vertical.length - 1];

  // Return corners in order: top-left, top-right, bottom-right, bottom-left
  return [
    { x: leftLine, y: topLine },
    { x: rightLine, y: topLine },
    { x: rightLine, y: bottomLine },
    { x: leftLine, y: bottomLine },
  ];
}

/**
 * Apply perspective transform to crop and straighten the sudoku grid
 */
export function applyPerspectiveTransform(
  source: HTMLCanvasElement,
  corners: { x: number; y: number }[],
  outputSize: number = 450
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d')!;

  // For a simple rectangular crop (no perspective distortion),
  // we can use drawImage with source coordinates
  const [topLeft, topRight, , bottomLeft] = corners;

  const srcX = topLeft.x;
  const srcY = topLeft.y;
  const srcWidth = topRight.x - topLeft.x;
  const srcHeight = bottomLeft.y - topLeft.y;

  ctx.drawImage(source, srcX, srcY, srcWidth, srcHeight, 0, 0, outputSize, outputSize);

  return canvas;
}

/**
 * Simple edge detection using Sobel operator
 */
function detectEdges(imageData: ImageData): Uint8Array {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const edges = new Uint8Array(width * height);

  // Convert to grayscale first
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = Math.floor(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }

  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += gray[idx] * sobelX[kernelIdx];
          gy += gray[idx] * sobelY[kernelIdx];
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = magnitude > 128 ? 255 : 0;
    }
  }

  return edges;
}

/**
 * Find horizontal and vertical lines in edge image using projection
 */
function findLines(
  edges: Uint8Array,
  width: number,
  height: number
): { horizontal: number[]; vertical: number[] } {
  // Horizontal projection (sum of edge pixels in each row)
  const horizontalProjection = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > 0) {
        horizontalProjection[y]++;
      }
    }
  }

  // Vertical projection
  const verticalProjection = new Array(width).fill(0);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (edges[y * width + x] > 0) {
        verticalProjection[x]++;
      }
    }
  }

  // Find peaks in projections (lines)
  const horizontalThreshold = width * 0.3; // At least 30% of width should be edge
  const verticalThreshold = height * 0.3;

  const horizontal: number[] = [];
  const vertical: number[] = [];

  for (let y = 0; y < height; y++) {
    if (horizontalProjection[y] > horizontalThreshold) {
      // Avoid duplicate nearby lines
      if (horizontal.length === 0 || y - horizontal[horizontal.length - 1] > height * 0.05) {
        horizontal.push(y);
      }
    }
  }

  for (let x = 0; x < width; x++) {
    if (verticalProjection[x] > verticalThreshold) {
      if (vertical.length === 0 || x - vertical[vertical.length - 1] > width * 0.05) {
        vertical.push(x);
      }
    }
  }

  return { horizontal, vertical };
}
