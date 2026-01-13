/**
 * Test script for board detection
 * Tests the new edge-based rectangle detection on images with headers
 */

import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_IMAGES = [
  '/Users/johnhuang/Downloads/s-l1600.jpg',
  path.resolve(__dirname, 'src/test/fixtures/Sudoku-Board-1.jpg'),
  path.resolve(__dirname, 'src/test/fixtures/Sudoku-Board-2.png'),
];

/**
 * Apply 3x3 Gaussian blur
 */
function gaussianBlur(gray, width, height) {
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
function cannyEdgeDetection(gray, width, height) {
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
 * Returns the y-coordinate and the continuous segment length
 */
function findHorizontalLines(edges, width, height) {
  const lines = [];
  const minRunLength = width * 0.5; // At least 50% of width must be a continuous edge

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
function findVerticalLines(edges, width, height) {
  const lines = [];
  const minRunLength = height * 0.5; // At least 50% of height must be a continuous edge

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
function findLargestRectangle(edges, width, height) {
  // Find continuous horizontal lines (not just scattered edge pixels)
  const hLines = findHorizontalLines(edges, width, height);
  const vLines = findVerticalLines(edges, width, height);

  console.log(`  Found ${hLines.length} strong horizontal lines`);
  console.log(`  Found ${vLines.length} strong vertical lines`);

  // Group nearby lines and keep strongest
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

  // Sort by position
  groupedHLines.sort((a, b) => a.y - b.y);
  groupedVLines.sort((a, b) => a.x - b.x);

  console.log(`  Grouped H lines (${groupedHLines.length}): ${groupedHLines.map(l => l.y).join(', ')}`);
  console.log(`  Grouped V lines (${groupedVLines.length}): ${groupedVLines.map(l => l.x).join(', ')}`);

  if (groupedHLines.length < 2 || groupedVLines.length < 2) {
    console.log('  Not enough lines found, trying fallback...');
    return findLargestRectangleFallback(edges, width, height);
  }

  // Find the best square-like rectangle
  let bestRect = null;
  let bestScore = 0;

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

          // Strong preference for square (aspect ratio close to 1)
          // sudoku grids are always square
          const squareBonus = aspectRatio > 0.85 ? 2.0 : aspectRatio > 0.7 ? 1.5 : 1.0;
          const score = area * aspectRatio * squareBonus;

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
 * Fallback: find rectangle using edge density
 */
function findLargestRectangleFallback(edges, width, height) {
  // Find rows/cols with high edge density
  const hDensity = new Float32Array(height);
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > 0) count++;
    }
    hDensity[y] = count / width;
  }

  const vDensity = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    let count = 0;
    for (let y = 0; y < height; y++) {
      if (edges[y * width + x] > 0) count++;
    }
    vDensity[x] = count / height;
  }

  // Find the boundaries by looking for sudden increases in density
  // Skip the first 5% of the image to avoid border effects
  const skipMargin = 0.05;

  let top = Math.floor(height * skipMargin);
  let bottom = Math.floor(height * (1 - skipMargin));
  let left = Math.floor(width * skipMargin);
  let right = Math.floor(width * (1 - skipMargin));

  // Find top: first row with significant density
  for (let y = Math.floor(height * skipMargin); y < height * 0.5; y++) {
    if (hDensity[y] > 0.2) {
      top = y;
      break;
    }
  }

  // Find bottom: last row with significant density
  for (let y = Math.floor(height * (1 - skipMargin)); y > height * 0.5; y--) {
    if (hDensity[y] > 0.2) {
      bottom = y;
      break;
    }
  }

  // Find left and right similarly
  for (let x = Math.floor(width * skipMargin); x < width * 0.5; x++) {
    if (vDensity[x] > 0.2) {
      left = x;
      break;
    }
  }

  for (let x = Math.floor(width * (1 - skipMargin)); x > width * 0.5; x--) {
    if (vDensity[x] > 0.2) {
      right = x;
      break;
    }
  }

  return { left, top, right, bottom };
}

async function testDetection(imagePath) {
  console.log(`\nTesting: ${path.basename(imagePath)}`);

  if (!fs.existsSync(imagePath)) {
    console.log('  File not found, skipping');
    return;
  }

  const img = await loadImage(imagePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const width = canvas.width;
  const height = canvas.height;
  console.log(`  Image size: ${width}x${height}`);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert to grayscale
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = Math.floor(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }

  // Blur and edge detection
  const blurred = gaussianBlur(gray, width, height);
  const edges = cannyEdgeDetection(blurred, width, height);

  // Find rectangle
  const rect = findLargestRectangle(edges, width, height);

  if (rect) {
    console.log(`  Detected rectangle: (${rect.left}, ${rect.top}) to (${rect.right}, ${rect.bottom})`);
    console.log(`  Size: ${rect.right - rect.left}x${rect.bottom - rect.top}`);

    // Save cropped image
    const cropWidth = rect.right - rect.left;
    const cropHeight = rect.bottom - rect.top;
    const size = Math.min(cropWidth, cropHeight);
    const extraWidth = cropWidth - size;
    const extraHeight = cropHeight - size;
    const adjustedLeft = rect.left + Math.floor(extraWidth / 2);
    const adjustedTop = rect.top + Math.floor(extraHeight / 2);

    const croppedCanvas = createCanvas(size, size);
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(canvas, adjustedLeft, adjustedTop, size, size, 0, 0, size, size);

    const outputPath = `/tmp/detected-${path.basename(imagePath, path.extname(imagePath))}.png`;
    const buffer = croppedCanvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`  Saved cropped image to: ${outputPath}`);
  } else {
    console.log('  Rectangle detection FAILED');
  }
}

async function main() {
  console.log('Testing board rectangle detection...');

  for (const imagePath of TEST_IMAGES) {
    await testDetection(imagePath);
  }
}

main().catch(console.error);
