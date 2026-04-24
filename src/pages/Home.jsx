import { Link } from 'react-router-dom';
import { Box, UploadCloud, Orbit, Layers, Palette, Pin, Share2, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-col items-center justify-center text-center mt-4">

      {/* Cosmic badge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.2rem' }}>
        <span className="cosmic-badge">
          <Star size={12} fill="currentColor" />
          Astronomical Digital World
          <Star size={12} fill="currentColor" />
        </span>
      </div>

      <h1
        className="gradient-text"
        style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', marginBottom: '0.6rem', lineHeight: 1.1 }}
      >
        Nexus 3D
      </h1>

      <p
        className="text-secondary"
        style={{
          maxWidth: '660px',
          margin: '0 auto 0.5rem auto',
          fontSize: '1.05rem',
          fontFamily: "'Orbitron', sans-serif",
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(200,164,255,0.7)',
        }}
      >
        Immersive · Cosmic · Limitless
      </p>

      <p
        className="text-secondary"
        style={{ maxWidth: '620px', margin: '0 auto 2.5rem auto', fontSize: '1.1rem', lineHeight: 1.8 }}
      >
        Traverse the digital cosmos. Upload and render{' '}
        <strong style={{ color: 'var(--accent)' }}>GLB, GLTF, OBJ</strong> and{' '}
        <strong style={{ color: 'var(--accent-secondary)' }}>FBX</strong> files in a
        WebGL nebula — annotate, customise, and share across the stars.
      </p>

      <div className="flex justify-center gap-4 mb-4" style={{ marginBottom: '5rem' }}>
        <Link
          to="/upload"
          className="btn btn-primary"
          style={{ fontSize: '1.05rem', padding: '0.9rem 2rem' }}
        >
          <UploadCloud size={20} /> Launch Viewer
        </Link>
        <Link
          to="/about"
          className="btn"
          style={{ fontSize: '1.05rem', padding: '0.9rem 2rem' }}
        >
          <Orbit size={20} /> Explore
        </Link>
      </div>

      {/* Nakshatra / feature constellation grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.2rem',
          width: '100%',
          textAlign: 'left',
        }}
      >
        {[
          {
            icon: <Orbit color="var(--accent)" size={38} />,
            title: 'Orbital Controls',
            desc: 'Rotate, zoom, and pan with silky orbit controls. Toggle auto-rotation, reset the camera, or switch to first-person flight mode.',
          },
          {
            icon: <Layers color="var(--accent-secondary)" size={38} />,
            title: 'Multi-Format Support',
            desc: 'Full support for GLB, GLTF, OBJ, and FBX. Show or hide individual mesh layers and inspect real-time model statistics.',
          },
          {
            icon: <Palette color="var(--accent)" size={38} />,
            title: 'Nebula Materials',
            desc: 'Override colour, metalness, and roughness. Switch between Solid, Wireframe, Flat-shaded, and Normal-map rendering modes.',
          },
          {
            icon: <Box color="var(--accent-secondary)" size={38} />,
            title: 'HDRI Environments',
            desc: 'Choose from ten curated HDRI lighting presets — City, Dawn, Sunset, Studio, and more — applied in real time.',
          },
          {
            icon: <Pin color="var(--accent)" size={38} />,
            title: 'Star Annotations',
            desc: 'Click anywhere on the model to plant labelled nakshatra pins. Manage and remove annotations from the sidebar panel.',
          },
          {
            icon: <Share2 color="var(--accent-secondary)" size={38} />,
            title: 'Share & Export',
            desc: 'Copy a shareable settings link, grab an embed code, or download a high-resolution screenshot of your scene.',
          },
        ].map(({ icon, title, desc }, i) => (
          <div className="glass-panel" key={i}>
            <div style={{ marginBottom: '0.8rem' }}>{icon}</div>
            <h3
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '1rem',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)',
              }}
            >
              {title}
            </h3>
            <p className="text-sm">{desc}</p>
          </div>
        ))}
      </div>

      {/* Bottom constellation divider */}
      <div
        style={{
          marginTop: '4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          justifyContent: 'center',
          opacity: 0.4,
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, var(--accent))' }} />
        <Star size={14} color="var(--accent-gold)" fill="var(--accent-gold)" />
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
      </div>
    </div>
  );
}
