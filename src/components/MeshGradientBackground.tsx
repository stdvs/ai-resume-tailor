import React from 'react';

interface MeshGradientBackgroundProps {
  isDark?: boolean;
}

export const MeshGradientBackground: React.FC<MeshGradientBackgroundProps> = ({
  isDark = true,
}) => {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-colors duration-1000"
      style={{
        backgroundColor: isDark ? '#0B1020' : '#0F172A',
      }}
      aria-hidden="true"
    >
      {/* Mesh Gradient Blurred Floating Blobs */}
      <div
        className="absolute w-[580px] h-[580px] rounded-full blur-[100px] md:blur-[120px] -top-24 -left-20 animate-blob-1 transition-all duration-1000 opacity-90"
        style={{ backgroundColor: 'var(--blob-1)' }}
      />
      <div
        className="absolute w-[620px] h-[620px] rounded-full blur-[100px] md:blur-[130px] -bottom-32 -right-20 animate-blob-2 transition-all duration-1000 opacity-80"
        style={{ backgroundColor: 'var(--blob-2)' }}
      />
      <div
        className="absolute w-[460px] h-[460px] rounded-full blur-[90px] md:blur-[110px] top-1/3 -right-16 animate-blob-3 transition-all duration-1000 opacity-75"
        style={{ backgroundColor: 'var(--blob-3)' }}
      />
      <div
        className="absolute w-[420px] h-[420px] rounded-full blur-[90px] md:blur-[110px] bottom-1/4 left-1/4 animate-blob-4 transition-all duration-1000 opacity-70"
        style={{ backgroundColor: 'var(--blob-4)' }}
      />

      {/* Realistic Noise / Grain Texture Overlay */}
      <div className="absolute inset-0 noise-texture pointer-events-none opacity-40 mix-blend-overlay" />

      {/* Subtle Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/10 to-black/40 pointer-events-none" />
    </div>
  );
};
