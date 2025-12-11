import { useEffect, useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  isCircle: boolean;
}

interface CompletionCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const PARTICLE_COUNT = 50;
const ANIMATION_DURATION = 3000;

export default function CompletionCelebration({ show, onComplete }: CompletionCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Create particles when show changes to true
  useEffect(() => {
    if (show && !isAnimating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAnimating(true);

      // Create particles from center
      const newParticles: Particle[] = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5;
        const speed = 2 + Math.random() * 4;
        newParticles.push({
          id: i,
          x: 50, // Center horizontally (%)
          y: 50, // Center vertically (%)
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2, // Slight upward bias
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 8 + Math.random() * 8,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 20,
          isCircle: Math.random() > 0.5,
        });
      }
      setParticles(newParticles);

      // End animation after duration
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
        onComplete?.();
      }, ANIMATION_DURATION);

      return () => clearTimeout(timeout);
    }
  }, [show, isAnimating, onComplete]);

  // Animate particles
  const updateParticles = useCallback(() => {
    setParticles(prev =>
      prev.map(p => ({
        ...p,
        x: p.x + p.vx * 0.5,
        y: p.y + p.vy * 0.5,
        vy: p.vy + 0.15, // Gravity
        rotation: p.rotation + p.rotationSpeed,
      }))
    );
  }, []);

  // Animation frame
  useEffect(() => {
    if (!isAnimating || particles.length === 0) return;

    const interval = setInterval(updateParticles, 16);
    return () => clearInterval(interval);
  }, [isAnimating, particles.length, updateParticles]);

  if (!isAnimating || particles.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            borderRadius: particle.isCircle ? '50%' : '2px',
            opacity: Math.max(0, 1 - particle.y / 150),
          }}
        />
      ))}
    </div>
  );
}
