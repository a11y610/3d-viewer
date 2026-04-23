import { Component, Suspense, useEffect, useMemo, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import {
  OrbitControls, Environment, Center, useProgress, Html, PointerLockControls,
} from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';

// ─── Loader overlay ───────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeModelStats(scene) {
  let triangles = 0;
  let vertices = 0;
  let meshCount = 0;
  const materialNames = new Set();

  scene.traverse((child) => {
    if (child.isMesh) {
      meshCount++;
      const geo = child.geometry;
      if (geo) {
        const pos = geo.attributes.position;
        if (pos) vertices += pos.count;
        if (geo.index) {
          triangles += geo.index.count / 3;
        } else if (pos) {
          triangles += pos.count / 3;
        }
      }
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => materialNames.add(m.name || m.type));
      }
    }
  });

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);

  return {
    triangles: Math.round(triangles),
    vertices,
    meshCount,
    materialCount: materialNames.size,
    size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
  };
}

function collectMeshLayers(scene) {
  const layers = [];
  scene.traverse((child) => {
    if (child.isMesh) {
      layers.push({ id: child.uuid, name: child.name || `Mesh_${layers.length + 1}` });
    }
  });
  return layers;
}

function applyOverrides(scene, viewMode, originalMats, color, metalness, roughness) {
  scene.traverse((child) => {
    if (!child.isMesh) return;

    if (viewMode === 'normal') {
      child.material = new THREE.MeshNormalMaterial();
      return;
    }

    const orig = originalMats.current.get(child.uuid);
    if (!orig) return;

    const mat = orig.clone();
    mat.wireframe = viewMode === 'wireframe';
    mat.flatShading = viewMode === 'flat';
    if (mat.flatShading) mat.needsUpdate = true;

    if (color && color !== '#ffffff' && mat.color) mat.color.set(color);
    if (mat.metalness !== undefined) mat.metalness = metalness;
    if (mat.roughness !== undefined) mat.roughness = roughness;

    child.material = mat;
  });
}

function applyLayerVisibility(scene, hiddenLayers) {
  scene.traverse((child) => {
    if (child.isMesh) {
      child.visible = !hiddenLayers.has(child.uuid);
    }
  });
}

// ─── Annotation pins ──────────────────────────────────────────────────────────
function AnnotationPin({ annotation, onRemove }) {
  return (
    <Html position={annotation.position} distanceFactor={8}>
      <div
        style={{
          background: annotation.color || 'rgba(0,255,204,0.92)',
          color: '#000',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          userSelect: 'none',
          fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          border: '2px solid rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        title="Click to remove annotation"
        onClick={() => onRemove(annotation.id)}
      >
        📍 {annotation.label}
      </div>
    </Html>
  );
}

// ─── First-person keyboard movement ──────────────────────────────────────────
function FirstPersonMovement() {
  const keys = useRef({});

  useEffect(() => {
    const down = (e) => { keys.current[e.code] = true; };
    const up = (e) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useFrame((state, delta) => {
    const speed = 3 * delta;
    const dir = new THREE.Vector3();
    state.camera.getWorldDirection(dir);
    const right = new THREE.Vector3().crossVectors(dir, state.camera.up).normalize();

    if (keys.current['KeyW'] || keys.current['ArrowUp'])    state.camera.position.addScaledVector(dir, speed);
    if (keys.current['KeyS'] || keys.current['ArrowDown'])  state.camera.position.addScaledVector(dir, -speed);
    if (keys.current['KeyA'] || keys.current['ArrowLeft'])  state.camera.position.addScaledVector(right, -speed);
    if (keys.current['KeyD'] || keys.current['ArrowRight']) state.camera.position.addScaledVector(right, speed);
    if (keys.current['KeyQ']) state.camera.position.y -= speed;
    if (keys.current['KeyE']) state.camera.position.y += speed;

    // Keep camera within a reasonable boundary (100 units from origin)
    state.camera.position.clampLength(0, 100);
  });

  return null;
}

// ─── Error boundary ───────────────────────────────────────────────────────────
class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    const { url, fileType } = this.props;
    const fileName = url ? url.split('/').pop() : 'unknown file';
    console.error(
      `[ModelViewer] Failed to load ${fileType?.toUpperCase() ?? 'model'} file "${fileName}":`,
      error,
      info,
    );
    if (this.props.onError) {
      this.props.onError({ message: error?.message || 'Unknown error', fileName, fileType });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div style={{
            color: '#ff6b6b',
            background: 'rgba(10,10,15,0.92)',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontFamily: 'system-ui, sans-serif',
            maxWidth: '340px',
            textAlign: 'center',
            border: '1px solid rgba(255,107,107,0.4)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>⚠️</div>
            <strong>Failed to load model</strong>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', wordBreak: 'break-word' }}>
              {this.state.message}
            </div>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

// ─── Individual model loaders ─────────────────────────────────────────────────
function GltfModel({ url, viewMode, modelScale, materialColor, metalness, roughness, hiddenLayers, annotationMode, annotations, onAnnotationAdd, onRemoveAnnotation, onModelLoad }) {
  const gltf = useLoader(GLTFLoader, url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf]);
  const originalMats = useRef(new Map());

  useEffect(() => {
    originalMats.current.clear();
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        originalMats.current.set(child.uuid, mats.length === 1 ? mats[0].clone() : mats.map((m) => m.clone()));
      }
    });
    if (onModelLoad) onModelLoad({ stats: computeModelStats(scene), layers: collectMeshLayers(scene) });
  }, [scene, onModelLoad]);

  useEffect(() => { applyOverrides(scene, viewMode, originalMats, materialColor, metalness, roughness); }, [scene, viewMode, materialColor, metalness, roughness]);
  useEffect(() => { applyLayerVisibility(scene, hiddenLayers); }, [scene, hiddenLayers]);

  const handleClick = (e) => {
    if (!annotationMode) return;
    e.stopPropagation();
    if (onAnnotationAdd) onAnnotationAdd(e.point);
  };

  return (
    <Center scale={[modelScale, modelScale, modelScale]}>
      <primitive object={scene} onClick={handleClick} />
      {annotations.map((ann) => <AnnotationPin key={ann.id} annotation={ann} onRemove={onRemoveAnnotation} />)}
    </Center>
  );
}

function ObjModel({ url, viewMode, modelScale, materialColor, metalness, roughness, hiddenLayers, annotationMode, annotations, onAnnotationAdd, onRemoveAnnotation, onModelLoad }) {
  const obj = useLoader(OBJLoader, url);
  const scene = useMemo(() => obj.clone(), [obj]);
  const originalMats = useRef(new Map());

  useEffect(() => {
    originalMats.current.clear();
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        originalMats.current.set(child.uuid, mats.length === 1 ? mats[0].clone() : mats.map((m) => m.clone()));
      }
    });
    if (onModelLoad) onModelLoad({ stats: computeModelStats(scene), layers: collectMeshLayers(scene) });
  }, [scene, onModelLoad]);

  useEffect(() => { applyOverrides(scene, viewMode, originalMats, materialColor, metalness, roughness); }, [scene, viewMode, materialColor, metalness, roughness]);
  useEffect(() => { applyLayerVisibility(scene, hiddenLayers); }, [scene, hiddenLayers]);

  const handleClick = (e) => {
    if (!annotationMode) return;
    e.stopPropagation();
    if (onAnnotationAdd) onAnnotationAdd(e.point);
  };

  return (
    <Center scale={[modelScale, modelScale, modelScale]}>
      <primitive object={scene} onClick={handleClick} />
      {annotations.map((ann) => <AnnotationPin key={ann.id} annotation={ann} onRemove={onRemoveAnnotation} />)}
    </Center>
  );
}

function FbxModel({ url, viewMode, modelScale, materialColor, metalness, roughness, hiddenLayers, annotationMode, annotations, onAnnotationAdd, onRemoveAnnotation, onModelLoad }) {
  const fbx = useLoader(FBXLoader, url);
  const scene = useMemo(() => fbx.clone(), [fbx]);
  const originalMats = useRef(new Map());

  useEffect(() => {
    originalMats.current.clear();
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        originalMats.current.set(child.uuid, mats.length === 1 ? mats[0].clone() : mats.map((m) => m.clone()));
      }
    });
    if (onModelLoad) onModelLoad({ stats: computeModelStats(scene), layers: collectMeshLayers(scene) });
  }, [scene, onModelLoad]);

  useEffect(() => { applyOverrides(scene, viewMode, originalMats, materialColor, metalness, roughness); }, [scene, viewMode, materialColor, metalness, roughness]);
  useEffect(() => { applyLayerVisibility(scene, hiddenLayers); }, [scene, hiddenLayers]);

  const handleClick = (e) => {
    if (!annotationMode) return;
    e.stopPropagation();
    if (onAnnotationAdd) onAnnotationAdd(e.point);
  };

  return (
    <Center scale={[modelScale, modelScale, modelScale]}>
      <primitive object={scene} onClick={handleClick} />
      {annotations.map((ann) => <AnnotationPin key={ann.id} annotation={ann} onRemove={onRemoveAnnotation} />)}
    </Center>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ModelViewer({
  url, fileType, viewMode = 'solid', autoRotate, envPreset, controlsRef, lightIntensity,
  modelScale = 1, materialColor = '#ffffff', metalness = 0.5, roughness = 0.5,
  hiddenLayers = new Set(), annotationMode = false, annotations = [],
  onAnnotationAdd, onRemoveAnnotation, onModelLoad, onError,
  firstPerson = false, zoomMin = 0.5, zoomMax = 20,
}) {
  const env = envPreset || 'city';
  const intensity = lightIntensity ?? 1;

  const modelProps = {
    url, viewMode, modelScale, materialColor, metalness, roughness, hiddenLayers,
    annotationMode, annotations, onAnnotationAdd, onRemoveAnnotation, onModelLoad,
  };

  return (
    <>
      <ambientLight intensity={intensity * 0.6} />
      <directionalLight position={[5, 10, 5]} intensity={intensity} castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={intensity * 0.2} />

      <Suspense fallback={<Loader />}>
        <ModelErrorBoundary url={url} fileType={fileType} onError={onError}>
          {fileType === 'obj'
            ? <ObjModel {...modelProps} />
            : fileType === 'fbx'
              ? <FbxModel {...modelProps} />
              : <GltfModel {...modelProps} />
          }
        </ModelErrorBoundary>
        <Environment preset={env} background blur={0.8} />
      </Suspense>

      {firstPerson ? (
        <>
          <PointerLockControls />
          <FirstPersonMovement />
        </>
      ) : (
        <OrbitControls
          ref={controlsRef}
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={zoomMin}
          maxDistance={zoomMax}
        />
      )}
    </>
  );
}
