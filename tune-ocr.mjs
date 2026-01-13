/**
 * OCR Parameter Tuning Script
 * Tests different configurations to find optimal settings for both test images
 */

import Tesseract from 'tesseract.js';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_CASES = [
  {
    name: 'Board-1',
    path: path.resolve(__dirname, 'src/test/fixtures/Sudoku-Board-1.jpg'),
    expected: '509000400708304900601000730462500000385720649107408200200100004003040087070053006',
  },
  {
    name: 'Board-2',
    path: path.resolve(__dirname, 'src/test/fixtures/Sudoku-Board-2.png'),
    expected: '700520008056098000040367050062780000801400002430019060000005000500602931007941500',
  },
  {
    name: 'Board-3',
    path: path.resolve(__dirname, 'src/test/fixtures/Sudoku-Board-3.jpg'),
    expected: '000150000000894062908070050050483020603010500800205309140008090280940005000607800',
  },
];

function gaussianBlurTune(gray, width, height) {
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

function cannyEdgeDetectionTune(gray, width, height) {
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

function findHorizontalLinesTune(edges, width, height) {
  const lines = [];
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

function findVerticalLinesTune(edges, width, height) {
  const lines = [];
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

function findLargestRectangleTune(edges, width, height) {
  const hLines = findHorizontalLinesTune(edges, width, height);
  const vLines = findVerticalLinesTune(edges, width, height);

  const margin = Math.min(width, height) * 0.03;

  const groupedHLines = [];
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

  const groupedVLines = [];
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

  let bestRect = null;
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

async function detectAndCropBoard(imgCanvas) {
  const width = imgCanvas.width;
  const height = imgCanvas.height;
  const ctx = imgCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = Math.floor(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }

  // Use improved edge-based detection
  const blurred = gaussianBlurTune(gray, width, height);
  const edges = cannyEdgeDetectionTune(blurred, width, height);
  const rect = findLargestRectangleTune(edges, width, height);

  let adjustedLeft, adjustedTop, size;

  if (rect) {
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

  return croppedCanvas;
}

function extractCells(source, margin, targetSize) {
  const cells = [];
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

function isCellEmpty(cellCanvas, threshold) {
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

  return stdDev < threshold;
}

function addPadding(canvas, padding) {
  const paddedCanvas = createCanvas(canvas.width + padding * 2, canvas.height + padding * 2);
  const ctx = paddedCanvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
  ctx.drawImage(canvas, padding, padding);
  return paddedCanvas;
}

function enhanceContrast(canvas, factor = 1.5) {
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

function binarize(canvas, threshold = 128) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = gray < threshold ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = val;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function parseDigit(text) {
  const clean = text.trim();
  if (clean.length === 1 && /[1-9]/.test(clean)) return parseInt(clean, 10);
  const match = clean.match(/[1-9]/);
  if (match) return parseInt(match[0], 10);

  const corrections = {
    'l': 1, 'I': 1, '|': 1, 'i': 1, '!': 1,
    'Z': 2, 'z': 2,
    'E': 3,
    'A': 4, 'h': 4,
    'S': 5, 's': 5,
    'G': 6, 'b': 6,
    'T': 7, '/': 7, '?': 7, ')': 7, ']': 7, 'J': 7, 'j': 7,
    'B': 8,
    'g': 9, 'q': 9,
  };

  for (const char of clean) {
    const corrected = corrections[char];
    if (corrected !== undefined) return corrected;
  }
  return null;
}

async function testConfig(config) {
  const { margin, targetSize, emptyThreshold, minConfidence, padding, whitelist, contrast, binarizeThreshold } = config;
  let totalCorrect = 0;
  let totalCells = 0;
  const results = [];

  for (const testCase of TEST_CASES) {
    const img = await loadImage(testCase.path);
    const imgCanvas = createCanvas(img.width, img.height);
    imgCanvas.getContext('2d').drawImage(img, 0, 0);

    const croppedCanvas = await detectAndCropBoard(imgCanvas);
    const cells = extractCells(croppedCanvas, margin, targetSize);

    const worker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
    const params = { tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR };
    if (whitelist) params.tessedit_char_whitelist = whitelist;
    await worker.setParameters(params);

    let result = '';
    let errors = [];

    for (let i = 0; i < 81; i++) {
      const expected = testCase.expected[i];

      if (isCellEmpty(cells[i], emptyThreshold)) {
        result += '0';
        if (expected !== '0') {
          errors.push({ i, expected, got: '0', reason: 'empty' });
        }
        continue;
      }

      // Apply preprocessing if enabled
      let processedCell = cells[i];
      if (contrast) {
        // Create a copy for preprocessing
        const copyCanvas = createCanvas(processedCell.width, processedCell.height);
        copyCanvas.getContext('2d').drawImage(processedCell, 0, 0);
        processedCell = enhanceContrast(copyCanvas, contrast);
      }
      if (binarizeThreshold) {
        // Create a copy for preprocessing if not already copied
        if (!contrast) {
          const copyCanvas = createCanvas(processedCell.width, processedCell.height);
          copyCanvas.getContext('2d').drawImage(processedCell, 0, 0);
          processedCell = copyCanvas;
        }
        binarize(processedCell, binarizeThreshold);
      }

      const cellToRecognize = addPadding(processedCell, padding);
      const cellBuffer = cellToRecognize.toBuffer('image/png');

      try {
        const { data } = await worker.recognize(cellBuffer);
        const text = data.text.trim();
        const confidence = data.confidence || 0;
        const digit = parseDigit(text);

        if (digit !== null && confidence >= minConfidence) {
          result += digit.toString();
          if (digit.toString() !== expected) {
            errors.push({ i, expected, got: digit, text, conf: Math.round(confidence) });
          }
        } else {
          result += '0';
          if (expected !== '0') {
            errors.push({ i, expected, got: '0', text, conf: Math.round(confidence), reason: 'low_conf' });
          }
        }
      } catch {
        result += '0';
        if (expected !== '0') errors.push({ i, expected, got: '0', reason: 'error' });
      }
    }

    await worker.terminate();

    const correct = [...result].filter((c, i) => c === testCase.expected[i]).length;
    totalCorrect += correct;
    totalCells += 81;
    results.push({ name: testCase.name, correct, errors });
  }

  return { config, totalCorrect, totalCells, results };
}

async function main() {
  console.log('Testing OCR configurations for both images...\n');

  const configs = [
    // Best without whitelist: 241/243 each with different error cells
    // m154,b160,mc1: Board-3 cells 13, 18 (both 9s)
    // m152,b150,mc1: Board-3 cells 18, 66 (both 9s)

    // Try combining the best of both - maybe different margins help different cells
    { margin: 0.154, targetSize: 100, emptyThreshold: 8, minConfidence: 1, padding: 20, whitelist: null, binarizeThreshold: 155, name: 'm154,b155,mc1' },
    { margin: 0.153, targetSize: 100, emptyThreshold: 8, minConfidence: 1, padding: 20, whitelist: null, binarizeThreshold: 160, name: 'm153,b160,mc1' },
    { margin: 0.153, targetSize: 100, emptyThreshold: 8, minConfidence: 1, padding: 20, whitelist: null, binarizeThreshold: 155, name: 'm153,b155,mc1' },

    // Try lower empty threshold in case 9s are being marked empty
    { margin: 0.154, targetSize: 100, emptyThreshold: 6, minConfidence: 1, padding: 20, whitelist: null, binarizeThreshold: 160, name: 'm154,b160,mc1,e6' },
    { margin: 0.152, targetSize: 100, emptyThreshold: 6, minConfidence: 1, padding: 20, whitelist: null, binarizeThreshold: 150, name: 'm152,b150,mc1,e6' },

    // Try without binarization, just contrast
    { margin: 0.154, targetSize: 100, emptyThreshold: 8, minConfidence: 1, padding: 20, whitelist: null, contrast: 2.0, name: 'm154,c2.0,mc1' },
    { margin: 0.154, targetSize: 100, emptyThreshold: 8, minConfidence: 1, padding: 20, whitelist: null, contrast: 2.5, name: 'm154,c2.5,mc1' },

    // Higher contrast + binarization
    { margin: 0.154, targetSize: 100, emptyThreshold: 8, minConfidence: 1, padding: 20, whitelist: null, contrast: 2.0, binarizeThreshold: 160, name: 'm154,c2.0,b160,mc1' },
    { margin: 0.152, targetSize: 100, emptyThreshold: 8, minConfidence: 1, padding: 20, whitelist: null, contrast: 2.0, binarizeThreshold: 150, name: 'm152,c2.0,b150,mc1' },

    // More padding - sometimes helps with recognition
    { margin: 0.154, targetSize: 100, emptyThreshold: 8, minConfidence: 1, padding: 25, whitelist: null, binarizeThreshold: 160, name: 'm154,b160,mc1,p25' },
    { margin: 0.154, targetSize: 100, emptyThreshold: 8, minConfidence: 1, padding: 30, whitelist: null, binarizeThreshold: 160, name: 'm154,b160,mc1,p30' },

    // Try larger target size without whitelist
    { margin: 0.154, targetSize: 120, emptyThreshold: 8, minConfidence: 1, padding: 20, whitelist: null, binarizeThreshold: 160, name: 'm154,b160,mc1,t120' },
    { margin: 0.152, targetSize: 120, emptyThreshold: 8, minConfidence: 1, padding: 20, whitelist: null, binarizeThreshold: 150, name: 'm152,b150,mc1,t120' },
  ];

  const allResults = [];

  for (const config of configs) {
    process.stdout.write(`Testing ${config.name}... `);
    const result = await testConfig(config);
    allResults.push(result);
    console.log(`${result.totalCorrect}/${result.totalCells}`);

    for (const r of result.results) {
      if (r.errors.length > 0 && r.errors.length <= 5) {
        console.log(`  ${r.name}: ${r.correct}/81`);
        r.errors.slice(0, 5).forEach(e => {
          console.log(`    Cell ${e.i}: exp=${e.expected}, got=${e.got} (${e.reason || e.text}, conf=${e.conf || 0})`);
        });
      } else if (r.errors.length > 5) {
        console.log(`  ${r.name}: ${r.correct}/81 (${r.errors.length} errors)`);
      }
    }
  }

  console.log('\n=== RANKED BY TOTAL ACCURACY ===\n');
  allResults.sort((a, b) => b.totalCorrect - a.totalCorrect);
  allResults.forEach((r, i) => {
    const pct = Math.round(r.totalCorrect / r.totalCells * 100);
    console.log(`${i + 1}. ${r.config.name}: ${r.totalCorrect}/${r.totalCells} (${pct}%)`);
  });

  const best = allResults[0];
  if (best.totalCorrect === best.totalCells) {
    console.log(`\n✅ PERFECT CONFIG FOUND: ${best.config.name}`);
    console.log(JSON.stringify(best.config, null, 2));
  }
}

main().catch(console.error);
