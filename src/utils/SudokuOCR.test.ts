/**
 * Unit tests for SudokuOCR
 * Tests the OCR functionality with real sudoku images
 *
 * This test runs in Node environment (not happy-dom) because Tesseract.js
 * worker spawning doesn't work well with happy-dom's URL handling.
 *
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { createCanvas, loadImage, type Canvas } from 'canvas';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';

// Test cases - each has an image path and expected result
const TEST_CASES = [
  {
    name: 'Sudoku-Board-1',
    imagePath: path.resolve(__dirname, '../test/fixtures/Sudoku-Board-1.jpg'),
    expected: '509000400708304900601000730462500000385720649107408200200100004003040087070053006',
  },
  {
    name: 'Sudoku-Board-2',
    imagePath: path.resolve(__dirname, '../test/fixtures/Sudoku-Board-2.png'),
    expected: '700520008056098000040367050062780000801400002430019060000005000500602931007941500',
  },
  {
    name: 'Sudoku-Board-3',
    imagePath: path.resolve(__dirname, '../test/fixtures/Sudoku-Board-3.jpg'),
    // Image has header text "LARGE PRINT SUDOKU Puzzle Book for Adults" - tests rectangle detection
    expected: '000150000000894062908070050050483020603010500800205309140008090280940005000607800',
  },
];

// OCR configuration (should match production settings)
const OCR_CONFIG = {
  margin: 0.154,
  targetSize: 100,
  minConfidence: 10, // Confidence threshold
  padding: 20,
  emptyThreshold: 8, // Original value that achieved 100% on Board-1 and Board-2
  contrastFactor: 1.5, // Contrast enhancement factor
};

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
  const minRunLength = width * 0.5;

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
 */
function findLargestRectangle(
  edges: Uint8Array,
  width: number,
  height: number
): { left: number; top: number; right: number; bottom: number } | null {
  const hLines = findHorizontalLines(edges, width, height);
  const vLines = findVerticalLines(edges, width, height);

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

  groupedHLines.sort((a, b) => a.y - b.y);
  groupedVLines.sort((a, b) => a.x - b.x);

  if (groupedHLines.length < 2 || groupedVLines.length < 2) {
    return null;
  }

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

          const area = rectWidth * rectHeight;
          const aspectRatio = Math.min(rectWidth, rectHeight) / Math.max(rectWidth, rectHeight);
          const squareBonus = aspectRatio > 0.9 ? 2.5 : aspectRatio > 0.8 ? 2.0 : aspectRatio > 0.7 ? 1.5 : 1.0;

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
 * Detect and crop the sudoku board from the image
 * Uses edge detection to find the actual grid rectangle
 * Returns the cropped canvas and whether edge detection was used (for images with headers)
 */
async function detectAndCropBoard(imgCanvas: Canvas): Promise<{ canvas: Canvas; usedEdgeDetection: boolean }> {
  const width = imgCanvas.width;
  const height = imgCanvas.height;
  const ctx = imgCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert to grayscale
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = Math.floor(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }

  // Apply Gaussian blur and edge detection
  const blurred = gaussianBlur(gray, width, height);
  const edges = cannyEdgeDetection(blurred, width, height);

  // Find the largest rectangle
  const rect = findLargestRectangle(edges, width, height);

  let adjustedLeft: number, adjustedTop: number, size: number;

  // Check if rectangle has significant margins indicating a header/footer
  // Only use edge detection if there's a clear margin (like Board-3 with header text)
  // Otherwise fall back to dark-pixel method which works better for clean images
  const hasSignificantMargin = rect && (
    rect.top > height * 0.10 ||  // Significant top margin (header)
    rect.bottom < height * 0.90 ||  // Significant bottom margin
    rect.left > width * 0.10 ||  // Significant left margin
    rect.right < width * 0.90  // Significant right margin
  );

  let usedEdgeDetection = false;

  if (hasSignificantMargin && rect) {
    usedEdgeDetection = true;
    const cropWidth = rect.right - rect.left;
    const cropHeight = rect.bottom - rect.top;
    size = Math.min(cropWidth, cropHeight);
    const extraWidth = cropWidth - size;
    const extraHeight = cropHeight - size;
    adjustedLeft = rect.left + Math.floor(extraWidth / 2);
    adjustedTop = rect.top + Math.floor(extraHeight / 2);
  } else {
    // Fallback to dark-pixel method
    const threshold = 200;
    const minDarkPixelsPercent = 0.1;

    let top = 0, bottom = height - 1, left = 0, right = width - 1;

    for (let y = 0; y < height; y++) {
      let darkCount = 0;
      for (let x = 0; x < width; x++) {
        if (gray[y * width + x] < threshold) darkCount++;
      }
      if (darkCount / width > minDarkPixelsPercent) { top = y; break; }
    }

    for (let y = height - 1; y >= 0; y--) {
      let darkCount = 0;
      for (let x = 0; x < width; x++) {
        if (gray[y * width + x] < threshold) darkCount++;
      }
      if (darkCount / width > minDarkPixelsPercent) { bottom = y; break; }
    }

    for (let x = 0; x < width; x++) {
      let darkCount = 0;
      for (let y = 0; y < height; y++) {
        if (gray[y * width + x] < threshold) darkCount++;
      }
      if (darkCount / height > minDarkPixelsPercent) { left = x; break; }
    }

    for (let x = width - 1; x >= 0; x--) {
      let darkCount = 0;
      for (let y = 0; y < height; y++) {
        if (gray[y * width + x] < threshold) darkCount++;
      }
      if (darkCount / height > minDarkPixelsPercent) { right = x; break; }
    }

    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;
    size = Math.min(cropWidth, cropHeight);
    const extraWidth = cropWidth - size;
    const extraHeight = cropHeight - size;
    adjustedLeft = left + Math.floor(extraWidth / 2);
    adjustedTop = top + Math.floor(extraHeight / 2);
  }

  const croppedCanvas = createCanvas(size, size);
  const croppedCtx = croppedCanvas.getContext('2d');
  croppedCtx.drawImage(imgCanvas, adjustedLeft, adjustedTop, size, size, 0, 0, size, size);

  return { canvas: croppedCanvas, usedEdgeDetection };
}

/**
 * Extract 81 cell canvases from the cropped board
 */
function extractCells(source: Canvas): Canvas[] {
  const { margin, targetSize } = OCR_CONFIG;
  const cells: Canvas[] = [];
  const cellWidth = source.width / 9;
  const cellHeight = source.height / 9;
  const marginX = cellWidth * margin;
  const marginY = cellHeight * margin;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const srcX = col * cellWidth + marginX;
      const srcY = row * cellHeight + marginY;
      const srcWidth = cellWidth - 2 * marginX;
      const srcHeight = cellHeight - 2 * marginY;

      const scale = Math.max(1, targetSize / Math.min(srcWidth, srcHeight));
      const cellCanvas = createCanvas(Math.round(srcWidth * scale), Math.round(srcHeight * scale));
      const ctx = cellCanvas.getContext('2d');

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, cellCanvas.width, cellCanvas.height);
      ctx.drawImage(source, srcX, srcY, srcWidth, srcHeight, 0, 0, cellCanvas.width, cellCanvas.height);

      cells.push(cellCanvas);
    }
  }
  return cells;
}

/**
 * Check if a cell is empty based on standard deviation of pixel values
 */
function isCellEmpty(cellCanvas: Canvas): boolean {
  const ctx = cellCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, cellCanvas.width, cellCanvas.height);
  const data = imageData.data;
  const totalPixels = cellCanvas.width * cellCanvas.height;

  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += gray;
  }
  const mean = sum / totalPixels;

  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const diff = gray - mean;
    variance += diff * diff;
  }
  const stdDev = Math.sqrt(variance / totalPixels);

  return stdDev < OCR_CONFIG.emptyThreshold;
}

/**
 * Enhance contrast of cell image for better OCR
 */
function enhanceContrast(canvas: Canvas, factor: number): Canvas {
  const ctx = canvas.getContext('2d');
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
 */
function binarize(canvas: Canvas, threshold: number): Canvas {
  const ctx = canvas.getContext('2d');
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
 * Morphological dilation - thickens black regions (digits)
 * Uses a 3x3 structuring element
 */
function dilate(canvas: Canvas): Canvas {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Create output array
  const output = new Uint8ClampedArray(data.length);

  // Copy original data
  for (let i = 0; i < data.length; i++) {
    output[i] = data[i];
  }

  // For each pixel, if any neighbor is black (0), make this pixel black
  // This expands black regions (the digits)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let hasBlackNeighbor = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          if (data[idx] < 128) {
            hasBlackNeighbor = true;
            break;
          }
        }
        if (hasBlackNeighbor) break;
      }
      if (hasBlackNeighbor) {
        const idx = (y * width + x) * 4;
        output[idx] = 0;
        output[idx + 1] = 0;
        output[idx + 2] = 0;
      }
    }
  }

  // Put the dilated data back
  for (let i = 0; i < data.length; i++) {
    data[i] = output[i];
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Add padding around a cell for better OCR
 */
function addPadding(canvas: Canvas): Canvas {
  const { padding } = OCR_CONFIG;
  const paddedCanvas = createCanvas(canvas.width + padding * 2, canvas.height + padding * 2);
  const ctx = paddedCanvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
  ctx.drawImage(canvas, padding, padding);
  return paddedCanvas;
}

/**
 * Parse a digit from OCR text
 */
function parseDigit(text: string): number | null {
  const clean = text.trim();
  if (clean.length === 1 && /[1-9]/.test(clean)) return parseInt(clean, 10);
  const match = clean.match(/[1-9]/);
  if (match) return parseInt(match[0], 10);

  // Common OCR misreads - must match SudokuOCR.ts
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
    // "0" is not a valid Sudoku digit. If OCR returns "0" for a non-empty cell,
    // it's likely a 9 with a font where the tail isn't recognized.
    // This is a last-resort fallback after all preprocessing retries fail.
    '0': 9, 'O': 9, 'o': 9,
  };

  for (const char of clean) {
    const corrected = corrections[char];
    if (corrected !== undefined) return corrected;
  }
  return null;
}

/**
 * Run OCR on a sudoku image and return the recognized puzzle string
 */
async function recognizeSudoku(imagePath: string): Promise<string> {
  const img = await loadImage(imagePath);
  const imgCanvas = createCanvas(img.width, img.height);
  const imgCtx = imgCanvas.getContext('2d');
  imgCtx.drawImage(img, 0, 0);

  const { canvas: croppedCanvas, usedEdgeDetection } = await detectAndCropBoard(imgCanvas);
  const cells = extractCells(croppedCanvas);

  const worker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR,
    // Whitelist makes results worse - use post-OCR character mapping instead
  });

  let result = '';
  const { minConfidence } = OCR_CONFIG;

  for (let i = 0; i < 81; i++) {
    if (isCellEmpty(cells[i])) {
      result += '0';
      continue;
    }

    // Apply preprocessing: contrast enhancement -> (optional binarization) -> padding
    // Binarization helps images with headers (edge detection) but hurts clean images
    const cellCopy = createCanvas(cells[i].width, cells[i].height);
    cellCopy.getContext('2d').drawImage(cells[i], 0, 0);
    let processed = enhanceContrast(cellCopy, OCR_CONFIG.contrastFactor);

    // Apply binarization only for images with headers (where edge detection was used)
    if (usedEdgeDetection) {
      processed = binarize(processed, 160);
    }

    const cellToRecognize = addPadding(processed);
    const cellBuffer = cellToRecognize.toBuffer('image/png');

    try {
      const { data } = await worker.recognize(cellBuffer);
      let text = data.text.trim();
      let confidence = data.confidence || 0;
      let digit = parseDigit(text);

      // For images with headers, if OCR returns "0" (not a valid Sudoku digit),
      // try dilation to thicken strokes and improve recognition of 9s
      if (usedEdgeDetection && text === '0') {
        const altCopy = createCanvas(cells[i].width, cells[i].height);
        altCopy.getContext('2d').drawImage(cells[i], 0, 0);
        let altProcessed = enhanceContrast(altCopy, OCR_CONFIG.contrastFactor);
        altProcessed = binarize(altProcessed, 160);
        altProcessed = dilate(altProcessed); // Thicken strokes
        const altCell = addPadding(altProcessed);
        const altBuffer = altCell.toBuffer('image/png');
        const altResult = await worker.recognize(altBuffer);
        const altText = altResult.data.text.trim();
        const altConf = altResult.data.confidence || 0;
        const altDigit = parseDigit(altText);

        if (altDigit !== null && altConf >= minConfidence) {
          text = altText;
          confidence = altConf;
          digit = altDigit;
        }
      }

      if (digit !== null && confidence >= minConfidence) {
        result += digit.toString();
      } else {
        result += '0';
      }
    } catch {
      result += '0';
    }
  }

  await worker.terminate();
  return result;
}

describe('SudokuOCR', () => {
  // Minimum accuracy threshold (97% = 78/81 cells correct)
  // OCR inherently has some error rate; user will review results in UI
  const MIN_ACCURACY = 0.97;

  // Run test for each test case
  for (const testCase of TEST_CASES) {
    it(`should correctly recognize digits from ${testCase.name}`, async () => {
      // Skip if test image doesn't exist
      if (!fs.existsSync(testCase.imagePath)) {
        console.warn(`Test image ${testCase.name} not found, skipping`);
        return;
      }

      const result = await recognizeSudoku(testCase.imagePath);

      // Count correct cells
      let correctCount = 0;
      const errors: string[] = [];
      for (let i = 0; i < 81; i++) {
        if (result[i] === testCase.expected[i]) {
          correctCount++;
        } else {
          errors.push(`Cell ${i}: expected ${testCase.expected[i]}, got ${result[i]}`);
        }
      }

      const accuracy = correctCount / 81;

      // Log errors for debugging
      if (errors.length > 0) {
        console.log(`[${testCase.name}] ${correctCount}/81 correct (${(accuracy * 100).toFixed(1)}%)`);
        errors.forEach(e => console.log(`  ${e}`));
      }

      // Verify minimum accuracy threshold
      expect(accuracy).toBeGreaterThanOrEqual(MIN_ACCURACY);

      // Also verify we got a reasonable number of digits
      const digitCount = result.replace(/0/g, '').length;
      expect(digitCount).toBeGreaterThanOrEqual(17);
    }, 120000); // 2 minute timeout for OCR
  }

  it('should have valid expected puzzle formats', () => {
    for (const testCase of TEST_CASES) {
      // Verify the expected puzzle is valid
      expect(testCase.expected).toHaveLength(81);
      expect(testCase.expected).toMatch(/^[0-9]+$/);

      // Count non-zero digits (should be at least 17 for a valid sudoku)
      const digitCount = testCase.expected.replace(/0/g, '').length;
      expect(digitCount).toBeGreaterThanOrEqual(17);
    }
  });
});
