import { Link } from 'react-router-dom';
import { Box, UploadCloud, Orbit, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-col items-center justify-center text-center mt-4">
      <h1 className="gradient-text" style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        Next-Level 3D Immersion
      </h1>
      <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', fontSize: '1.2rem' }}>
        Experience your 3D models like never before. With our advanced WebGL renderer,
        you can view, customize, and analyze your `.glb`, `.gltf`, and `.obj` files in an intuitive digital environment.
      </p>
      
      <div className="flex justify-center gap-4 mb-4" style={{ marginBottom: '4rem' }}>
        <Link to="/upload" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
          <UploadCloud /> Start Uploading
        </Link>
        <Link to="/about" className="btn" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
          Learn More
        </Link>
      </div>

      <div className="flex gap-4 justify-between" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', width: '100%', textAlign: 'left' }}>
        <div className="glass-panel">
          <Orbit color="var(--accent)" size={48} className="mb-2" />
          <h3>Interactive Viewing</h3>
          <p className="text-sm">Seamlessly rotate, zoom, and inspect your models from any angle with high performance.</p>
        </div>
        <div className="glass-panel">
          <Layers color="var(--accent)" size={48} className="mb-2" />
          <h3>Multiple Formats</h3>
          <p className="text-sm">Full support for industry standards including GLB, GLTF, and pure OBJ files.</p>
        </div>
        <div className="glass-panel">
          <Box color="var(--accent)" size={48} className="mb-2" />
          <h3>Dynamic Environments</h3>
          <p className="text-sm">Switch between curated lighting setups like Dawn, Sunset, and Studio in real-time.</p>
        </div>
      </div>
    </div>
  );
}
