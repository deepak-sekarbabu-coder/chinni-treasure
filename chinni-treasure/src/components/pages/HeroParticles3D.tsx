/**
 * Hero particle layer — decorative, CSS only.
 *
 * Same visual role as the three.js canvas it replaced (gold hearts drifting up
 * behind the hero copy, plus one slow ring) with zero client JS and zero WebGL.
 * Layout is index-derived rather than random so the markup is deterministic;
 * motion, the ring, and reduced-motion handling all live in CSS
 * (`.hero-particles` in app/styles/hero.css, `heroDrift` in
 * app/styles/keyframes.css).
 */

import type { CSSProperties } from "react";

const PARTICLE_COUNT = 18;

/* Gold palette matching the brand. */
const GOLDS = ["#d4af37", "#c5a028", "#e8c84a", "#b8941f", "#f0d878"];

/** A custom property (`--y`) is not in CSSProperties, hence the cast. */
type ParticleStyle = CSSProperties & { "--y": string };

export default function HeroParticles3D() {
  return (
    <div className="hero-particles" aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <span
          key={i}
          className="hero-particle"
          style={{
            "--y": `${(i * 53) % 92}%`,
            left: `${(i * 61) % 100}%`,
            backgroundColor: GOLDS[i % GOLDS.length],
            // Negative delay starts each particle mid-flight, so the field
            // looks populated on first paint instead of pulsing in together.
            animationDelay: `${-(i * 1.9)}s`,
            animationDuration: `${16 + (i % 6) * 4}s`,
          } as ParticleStyle}
        />
      ))}
      <span className="hero-ring" />
    </div>
  );
}
