/**
 * Script to generate SVG images for technique tutorials
 * Run with: bun scripts/generateTutorialSvgs.ts
 */

import { generateSudokuSvg, type SvgGeneratorOptions } from '../src/utils/sudokuSvgGenerator';
import * as fs from 'fs';
import * as path from 'path';

interface ExampleData {
  board: string;
  pencilmarks: string;
  hint_data: string;
}

interface HintCell {
  row: number;
  column: number;
  color: string;
  fill: boolean;
}

interface HintData {
  title: string;
  text: string;
  cells: HintCell[];
}

const TECHNIQUE_FILES: Record<number, string> = {
  1: 'full_house',
  2: 'hidden_single',
  3: 'naked_single',
  4: 'hidden_pair',
  5: 'naked_pair',
  6: 'locked_candidates',
  7: 'hidden_triple',
  8: 'naked_triple',
  9: 'hidden_quad',
  10: 'naked_quad',
  11: 'x-wing',
  12: 'swordfish',
  13: 'jellyfish',
  14: 'xy-wing',
  15: 'finned_x-wing',
  16: 'squirmbag',
  17: 'finned_swordfish',
  18: 'finned_jellyfish',
  19: 'xyz-wing',
  20: 'wxyz-wing',
  21: 'almost_locked_sets',
  22: 'finned_squirmbag',
  23: 'als-chain',
};

async function loadExampleFromApi(techniqueId: number): Promise<ExampleData | null> {
  try {
    const response = await fetch(`http://localhost:8010/api/v1/examples/random?technique=${techniqueId}`);
    const data = await response.json();
    if (data.success && data.data) {
      return data.data as ExampleData;
    }
  } catch (error) {
    console.error(`Failed to fetch example for technique ${techniqueId}:`, error);
  }
  return null;
}

function generateSvgForExample(example: ExampleData): string {
  const hintData: HintData = JSON.parse(example.hint_data || '{}');

  // Convert hint_data cells to SVG highlights
  const cellHighlights = (hintData.cells || []).map(cell => ({
    row: cell.row,
    col: cell.column,
    fill: cell.color || 'blue',
  }));

  const options: SvgGeneratorOptions = {
    puzzle: example.board,
    pencilmarks: example.pencilmarks || '',
    showPencilmarks: !!example.pencilmarks && example.pencilmarks.length > 0,
    highlights: {
      cells: cellHighlights,
    },
    size: 450,
    darkMode: false,
  };

  return generateSudokuSvg(options);
}

async function main() {
  const outputDir = path.join(__dirname, '../public/help');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating SVG images for technique tutorials...\n');

  let generated = 0;
  let failed = 0;

  for (const [idStr, filename] of Object.entries(TECHNIQUE_FILES)) {
    const techniqueId = parseInt(idStr);
    console.log(`Processing technique ${techniqueId} (${filename})...`);

    const example = await loadExampleFromApi(techniqueId);

    if (!example) {
      console.log(`  ⚠️  No example available for technique ${techniqueId}`);
      failed++;
      continue;
    }

    try {
      const svg = generateSvgForExample(example);
      const outputPath = path.join(outputDir, `${filename}_1.svg`);
      fs.writeFileSync(outputPath, svg);
      console.log(`  ✓ Generated: ${filename}_1.svg`);
      generated++;
    } catch (error) {
      console.error(`  ✗ Failed to generate SVG for technique ${techniqueId}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Generated ${generated} SVG images`);
  if (failed > 0) {
    console.log(`⚠️  ${failed} techniques had no examples or failed`);
  }
}

main().catch(console.error);
