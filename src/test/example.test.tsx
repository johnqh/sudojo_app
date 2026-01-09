import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple component for testing
function HelloWorld({ name }: { name: string }) {
  return <div>Hello, {name}!</div>;
}

describe('Example Tests', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should render a component', () => {
    render(<HelloWorld name="Sudojo" />);
    expect(screen.getByText('Hello, Sudojo!')).toBeDefined();
  });
});
