import React, { useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ScatterParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export const ThemeToggleButton: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [particles, setParticles] = useState<ScatterParticle[]>([]);
  const [showShockwave, setShowShockwave] = useState(false);
  const [iconSpinKey, setIconSpinKey] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isTransitioningRef = useRef(false);

  const handleToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isTransitioningRef.current) return;

    // Determine the exact origin coordinates from the button center
    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : event.clientX || window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : event.clientY || 30;

    // Trigger icon spin
    setIconSpinKey((k) => k + 1);

    // Generate scattering burst particles
    const willBeDark = !isDark;
    const colors = willBeDark
      ? ['#60A5FA', '#818CF8', '#A78BFA', '#E2E8F0', '#38BDF8', '#C084FC']
      : ['#F59E0B', '#FBBF24', '#FCD34D', '#FEF08A', '#F97316', '#FDE047'];

    const count = 16;
    const newParticles: ScatterParticle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * (360 / count) + (Math.random() * 16 - 8)) * (Math.PI / 180);
      const distance = 28 + Math.random() * 38; // 28px - 66px radial scatter
      newParticles.push({
        id: Date.now() + i,
        x: Math.round(Math.cos(angle) * distance),
        y: Math.round(Math.sin(angle) * distance),
        size: Math.round((2.5 + Math.random() * 2.2) * 10) / 10,
        color: colors[i % colors.length],
      });
    }

    setParticles(newParticles);
    setShowShockwave(true);

    // Auto-clean particle burst after animation ends (extended for slower graceful trail)
    setTimeout(() => {
      setParticles([]);
      setShowShockwave(false);
  }, 1300);

  // Check for View Transitions API and reduced-motion user preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const doc = document as unknown as {
    startViewTransition?: (cb: () => void) => {
      ready: Promise<void>;
      finished: Promise<void>;
    };
  };

  if (typeof doc.startViewTransition !== 'function' || prefersReducedMotion) {
    toggleTheme();
    return;
  }

  isTransitioningRef.current = true;

  try {
    // Calculate max radius needed to cover the furthest corner of viewport
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Execute synchronous DOM update inside view transition callback
    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        toggleTheme();
      });
    });

    await transition.ready;

    // Animate circular reveal expanding smoothly from the button switch center (cinematic slower pace)
    const animation = document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 1050,
        easing: 'cubic-bezier(0.25, 1, 0.35, 1)',
        pseudoElement: '::view-transition-new(root)',
      }
    );

    await animation.finished;
  } catch {
    // Fallback if animation is cancelled or unsupported
  } finally {
    isTransitioningRef.current = false;
  }
};

return (
  <button
    ref={buttonRef}
    onClick={handleToggle}
    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    className="relative p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-card-hover transition-colors cursor-pointer shrink-0 focus-visible:outline-brand select-none flex items-center justify-center overflow-visible"
  >
    {/* Shockwave expanding ring from button switch */}
    {showShockwave && (
      <span
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-theme-shockwave border ${isDark ? 'border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'border-indigo-400/80 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
          }`}
        style={{ width: '28px', height: '28px' }}
      />
    )}

    {/* Radial scattering particles shooting from button switch */}
    {particles.map((p) => (
      <span
        key={p.id}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-theme-particle"
        style={
          {
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}, 0 0 3px ${p.color}`,
            '--scatter-x': `${p.x}px`,
            '--scatter-y': `${p.y}px`,
          } as React.CSSProperties
        }
      />
    ))}

    {/* Rotating Sun / Moon icon with spring momentum */}
    <span key={iconSpinKey} className="inline-flex items-center justify-center animate-theme-icon">
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 filter drop-shadow-[0_0_7px_rgba(251,191,36,0.55)]" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 filter drop-shadow-[0_0_6px_rgba(99,102,241,0.45)]" />
      )}
    </span>
  </button>
);
};

