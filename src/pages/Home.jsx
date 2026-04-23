import { Link } from 'react-router-dom';
import { Box, UploadCloud, Orbit, Layers, Palette, Pin, Share2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-col items-center justify-center text-center mt-4">
      <h1 className="gradient-text" style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        Next-Level 3D Immersion
      </h1>
      <p className="text-secondary" style={{ maxWidth: '640px', margin: '0 auto 2rem auto', fontSize: '1.2rem' }}>
        Experience your 3D models like never before. View, annotate, and customise
        <strong style={{ color: 'var(--text-primary)' }}> GLB, GLTF, OBJ </strong>and
        <strong style={{ color: 'var(--text-primary)' }}> FBX </strong>{' '}files in an advanced WebGL environment.
      </p>

      <div className="flex justify-center gap-4 mb-4" style={{ marginBottom: '4rem' }}>
        <Link to="/upload" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
          <UploadCloud /> Start Uploading
        </Link>
        <Link to="/about" className="btn" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
          Learn More
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', width: '100%', textAlign: 'left' }}>
        <div className="glass-panel">
          <Orbit color="var(--accent)" size={40} className="mb-2" />
          <h3>Interactive Controls</h3>
          <p className="text-sm">Rotate, zoom, and pan with orbit controls. Toggle auto-rotation, reset the camera, or switch to first-person navigation.</p>
        </div>
        <div className="glass-panel">
          <Layers color="var(--accent)" size={40} className="mb-2" />
          <h3>Multiple Formats</h3>
          <p className="text-sm">Full support for GLB, GLTF, OBJ, and FBX. Show or hide individual mesh layers, and inspect real-time model statistics.</p>
        </div>
        <div className="glass-panel">
          <Palette color="var(--accent)" size={40} className="mb-2" />
          <h3>Material Customisation</h3>
          <p className="text-sm">Override material colour, metalness, and roughness. Switch between Solid, Wireframe, Flat-shaded, and Normal-map view modes.</p>
        </div>
        <div className="glass-panel">
          <Box color="var(--accent)" size={40} className="mb-2" />
          <h3>Dynamic Environments</h3>
          <p className="text-sm">Switch between ten curated HDRI lighting presets — City, Dawn, Sunset, Studio, and more — in real time.</p>
        </div>
        <div className="glass-panel">
          <Pin color="var(--accent)" size={40} className="mb-2" />
          <h3>Annotations</h3>
          <p className="text-sm">Click anywhere on the model to place labelled pin annotations. Manage and remove them from the sidebar panel.</p>
        </div>
        <div className="glass-panel">
          <Share2 color="var(--accent)" size={40} className="mb-2" />
          <h3>Share & Export</h3>
          <p className="text-sm">Copy a shareable settings link, grab an embed code for your website, or download a high-resolution screenshot.</p>
        </div>
      </div>
    </div>
  );
}
