import { Telescope } from 'lucide-react';

export default function About() {
  return (
    <div className="flex-col items-center mt-4 text-center">
      <h2 className="gradient-text mb-4 flex items-center gap-2 justify-center" style={{ fontFamily: "'Orbitron', sans-serif" }}>
        <Telescope size={32} color="var(--accent)" />
        About Nexus 3D
      </h2>
      <div className="glass-panel" style={{ maxWidth: '800px', width: '100%', textAlign: 'left', lineHeight: 1.8 }}>
        <p className="mb-4">
          Nexus 3D was forged with a single, uncompromising vision: to deliver the most immersive, seamless, and performant 
          in-browser 3D viewing experience across the digital cosmos. We harness the sheer power of modern WebGL 
          and React Three Fiber to bring your stellar digital assets to life.
        </p>
        <p>
          Whether you're a universe-building game developer, a 3D artist charting new aesthetic constellations, 
          or an enthusiast exploring models, Nexus 3D provides the essential instruments: lightning-fast rendering, 
          dynamic HDRI environments, and intuitive orbital controls, all enveloped in a premium astronomical interface.
        </p>
      </div>
    </div>
  );
}
