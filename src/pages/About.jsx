export default function About() {
  return (
    <div className="flex-col items-center mt-4">
      <h2 className="gradient-text mb-4">About Nexus3D</h2>
      <div className="glass-panel" style={{ maxWidth: '800px', width: '100%' }}>
        <p className="mb-4">
          Nexus3D was built with a single goal: to provide the most immersive, seamless, and performant 
          in-browser 3D viewing experience possible. We leverage cutting-edge WebGL technology through 
          React Three Fiber to bring your digital assets to life.
        </p>
        <p>
          Whether you're a game developer inspecting assets, a 3D artist showcasing your portfolio, 
          or an enthusiast exploring models, Nexus3D provides the tools you need: lightning-fast rendering, 
          customizable environments, and intuitive controls, all wrapped in a premium digital interface.
        </p>
      </div>
    </div>
  );
}
