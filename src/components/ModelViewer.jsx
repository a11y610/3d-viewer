import { Suspense, useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Center, useProgress, Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        color: '#00ffcc',
        background: 'rgba(10,10,15,0.85)',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontFamily: 'system-ui, sans-serif',
        whiteSpace: 'nowrap',
        border: '1px solid rgba(0,255,204,0.3)',
      }}>
        Loading model… {Math.round(progress)}%
      </div>
    </Html>
  );
}

const GltfModel = ({ url, wireframe }) => {
  const gltf = useLoader(GLTFLoader, url);
  const scene = useMemo(() => gltf.scene.clone(), [gltf]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.wireframe = wireframe;
        child.material.needsUpdate = true;
      }
    });
  }, [scene, wireframe]);

  return <Center><primitive object={scene} /></Center>;
};

const ObjModel = ({ url, wireframe }) => {
  const obj = useLoader(OBJLoader, url);
  const scene = useMemo(() => obj.clone(), [obj]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.wireframe = wireframe;
        child.material.needsUpdate = true;
      }
    });
  }, [scene, wireframe]);

  return <Center><primitive object={scene} /></Center>;
};

export default function ModelViewer({ url, fileType, wireframe, autoRotate, envPreset, controlsRef, lightIntensity }) {
  const env = envPreset || 'city';
  const intensity = lightIntensity ?? 1;

  return (
    <>
      <ambientLight intensity={intensity * 0.6} />
      <directionalLight position={[5, 10, 5]} intensity={intensity} castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={intensity * 0.2} />
      {/* Suspense is placed inside the Canvas so the Canvas never unmounts during loading */}
      <Suspense fallback={<Loader />}>
        {fileType === 'obj'
          ? <ObjModel url={url} wireframe={wireframe} />
          : <GltfModel url={url} wireframe={wireframe} />
        }
        <Environment preset={env} background blur={0.8} />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        autoRotate={autoRotate}
        autoRotateSpeed={2}
        makeDefault
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}
