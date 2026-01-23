/**
 * Dev page for generating technique tutorial images
 * Supports both SVG generation and html2canvas capture
 */

import { useState, useMemo } from 'react';
import { Heading, Text, Button, Card, CardContent } from '@sudobility/components';
import { Section } from '@/components/layout/Section';
import { generateSudokuSvg, svgToDataUrl, downloadSvg } from '@/utils/sudokuSvgGenerator';
import { techniqueExamples, type TechniqueExample } from '@/data/techniqueExamples';

// Filter out null examples
const validExamples = techniqueExamples.filter((ex): ex is TechniqueExample => ex !== null);

export default function TechniqueImageGenerator() {
  const [selectedExample, setSelectedExample] = useState<TechniqueExample>(validExamples[0]);
  const [darkMode, setDarkMode] = useState(false);
  const [size, setSize] = useState(400);

  // Generate SVG for selected example
  const svg = useMemo(() => {
    return generateSudokuSvg({
      puzzle: selectedExample.puzzle,
      pencilmarks: selectedExample.pencilmarks,
      highlights: selectedExample.highlights,
      size,
      darkMode,
      showPencilmarks: true,
    });
  }, [selectedExample, size, darkMode]);

  const svgDataUrl = useMemo(() => svgToDataUrl(svg), [svg]);

  const handleDownloadSvg = () => {
    const filename = `${selectedExample.technique.toLowerCase().replace(/[^a-z0-9]/g, '_')}_1.svg`;
    downloadSvg(svg, filename);
  };

  const handleDownloadPng = async () => {
    // Create a canvas and draw the SVG
    const img = new Image();
    img.src = svgDataUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size * 2; // 2x for retina
    canvas.height = size * 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, size, size);

      // Download as PNG
      const link = document.createElement('a');
      link.download = `${selectedExample.technique.toLowerCase().replace(/[^a-z0-9]/g, '_')}_1.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <Section spacing="xl" maxWidth="6xl">
      <header className="mb-8">
        <Heading level={1} size="2xl">
          Technique Image Generator
        </Heading>
        <Text color="muted" className="mt-2">
          Generate SVG and PNG images for technique tutorials
        </Text>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <Card>
          <CardContent className="py-6 space-y-6">
            <div>
              <Text weight="medium" className="mb-2 block">Select Technique Example</Text>
              <select
                value={selectedExample.id}
                onChange={(e) => {
                  const example = validExamples.find((ex) => ex.id === e.target.value);
                  if (example) setSelectedExample(example);
                }}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
              >
                {validExamples.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.technique} - {ex.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Text weight="medium" className="mb-2 block">Size (px)</Text>
              <input
                type="range"
                min="200"
                max="800"
                step="50"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full"
              />
              <Text size="sm" color="muted">{size}px</Text>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="darkMode"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
              <label htmlFor="darkMode">
                <Text>Dark Mode</Text>
              </label>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleDownloadSvg}>
                Download SVG
              </Button>
              <Button variant="outline" onClick={handleDownloadPng}>
                Download PNG
              </Button>
            </div>

            <div>
              <Text weight="medium" className="mb-2 block">Description</Text>
              <Text size="sm" color="muted">{selectedExample.description}</Text>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardContent className="py-6">
            <Text weight="medium" className="mb-4 block">Preview</Text>
            <div
              className="flex items-center justify-center p-4 rounded"
              style={{ backgroundColor: darkMode ? '#1f2937' : '#f3f4f6' }}
            >
              <img
                src={svgDataUrl}
                alt={`${selectedExample.technique} example`}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw SVG Code */}
      <Card className="mt-8">
        <CardContent className="py-6">
          <Text weight="medium" className="mb-4 block">SVG Code</Text>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-xs max-h-64">
            {svg}
          </pre>
        </CardContent>
      </Card>
    </Section>
  );
}
