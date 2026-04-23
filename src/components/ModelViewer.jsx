import React, { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Stage } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

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

  return <primitive object={scene} />;
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

  return <primitive object={scene} />;
};

export default function ModelViewer({ url, fileType, wireframe, autoRotate, envPreset }) {
  // Use a fallback environment preset if null or empty
  const env = envPreset || 'city';
  
  return (
    <>
      <color attach="background" args={['var(--bg-primary)']} />
      <Stage intensity={0.5} environment={null} center>
         {fileType === 'obj' ? <ObjModel url={url} wireframe={wireframe} /> : <GltfModel url={url} wireframe={wireframe} />}
      </Stage>
      <OrbitControls autoRotate={autoRotate} makeDefault />
      {/* Dynamic Environment */}
      <Environment preset={env} background blur={0.8} />
    </>
  );
}
