import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  UploadCloud, RotateCw, Image as ImageIcon, Settings,
  List, RefreshCw, Maximize2, Minimize2, Sun, Info,
  Layers, Palette, Sliders, Pin, Share2, Eye, EyeOff,
  Crosshair, Ruler, ChevronDown, ChevronRight, Copy, Check,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import ModelViewer from '../components/ModelViewer';

// ─── Collapsible panel section ────────────────────────────────────────────────
function Section({ icon, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem' }}>
      <button
        className="section-header"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'none', border: 'none', color: 'var(--text-primary)',
          cursor: 'pointer', width: '100%', padding: 0,
          fontWeight: 700, fontSize: '0.95rem',
        }}
      >
        {icon}
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>{children}</div>}
    </div>
  );
}

// ─── Label helper ─────────────────────────────────────────────────────────────
function Label({ icon, text, value }) {
  return (
    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.3rem' }}>
      {icon} {text}{value !== undefined ? `: ${value}` : ''}
    </label>
  );
}

// ─── View mode buttons ────────────────────────────────────────────────────────
const VIEW_MODES = ['solid', 'wireframe', 'flat', 'normal'];

function ViewModeSelector({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
      {VIEW_MODES.map((m) => (
        <button
          key={m}
          className={`btn${value === m ? ' btn-primary' : ''}`}
          style={{ padding: '0.4rem', fontSize: '0.78rem', textTransform: 'capitalize' }}
          onClick={() => onChange(m)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

// ─── Camera auto-fit constants ────────────────────────────────────────────────
const MIN_CAMERA_DISTANCE = 2;       // minimum sensible camera distance (world units)
const NEAR_PLANE_FACTOR   = 0.001;   // cam.near = zoomMin * NEAR_PLANE_FACTOR
const MIN_NEAR_PLANE      = 0.001;   // absolute lower bound for cam.near
const FAR_PLANE_FACTOR    = 100;     // cam.far  = zoomMax * FAR_PLANE_FACTOR
const MIN_ZOOM_GAP        = 0.1;     // minimum gap kept between zoomMin and zoomMax

// ─── Main Upload page ─────────────────────────────────────────────────────────
export default function Upload() {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Rendering
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState('solid');
  const [envPreset, setEnvPreset] = useState('city');
  const [lightIntensity, setLightIntensity] = useState(1);
  const [materialColor, setMaterialColor] = useState('#ffffff');
  const [metalness, setMetalness] = useState(0.5);
  const [roughness, setRoughness] = useState(0.5);

  // Camera
  const [firstPerson, setFirstPerson] = useState(false);
  const [zoomMin, setZoomMin] = useState(0.5);
  const [zoomMax, setZoomMax] = useState(20);
  const [fpLocked, setFpLocked] = useState(false);

  // Model
  const [modelScale, setModelScale] = useState(1);
  const [modelStats, setModelStats] = useState(null);
  const [meshLayers, setMeshLayers] = useState([]);
  const [hiddenLayers, setHiddenLayers] = useState(new Set());
  const [loadError, setLoadError] = useState(null);

  // Annotations
  const [annotationMode, setAnnotationMode] = useState(false);
  const [pendingLabel, setPendingLabel] = useState('');
  const [pendingPoint, setPendingPoint] = useState(null);
  const { annotations, addAnnotation, removeAnnotation, clearAnnotations } = useStore();

  // Logs & Share
  const [showLogs, setShowLogs] = useState(true);
  const [copied, setCopied] = useState(false);

  const viewerRef = useRef(null);
  const controlsRef = useRef(null);
  const canvasRef = useRef(null);
  const currentUrlRef = useRef(null);
  const { addLog, history } = useStore();

  // Cleanup current object URL on unmount only; revocation on change is handled in processFile
  useEffect(() => () => { if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current); }, []);

  useEffect(() => {
    const handleDragEnd = () => { dragCounter.current = 0; setDragging(false); };
    window.addEventListener('dragend', handleDragEnd);
    return () => window.removeEventListener('dragend', handleDragEnd);
  }, []);

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Pointer-lock status for first-person mode
  useEffect(() => {
    const onChange = () => setFpLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);

  const handleLog = (action, fName) => {
    const fn = fName || fileName || 'Model';
    addLog({ id: Date.now(), action, timestamp: new Date().toLocaleTimeString(), fileName: fn });
  };

  const processFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (['glb', 'gltf', 'obj', 'fbx'].includes(extension)) {
      // Revoke previous blob URL before creating a new one
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      currentUrlRef.current = url;
      setFileUrl(url);
      setFileType(extension);
      setFileName(file.name);
      setFileSize(file.size);
      setModelStats(null);
      setMeshLayers([]);
      setHiddenLayers(new Set());
      setLoadError(null);
      setModelScale(1);
      setAnnotationMode(false);
      clearAnnotations();
      setFirstPerson(false);
      handleLog(`Uploaded file: ${file.name}`, file.name);
    } else {
      alert('Please upload a valid .glb, .gltf, .obj, or .fbx file.');
    }
  };

  const handleFileUpload = (e) => { if (e.target.files[0]) processFile(e.target.files[0]); };
  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setDragging(true); };
  const handleDrop = (e) => { e.preventDefault(); dragCounter.current = 0; setDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setDragging(false); } };

  const handleScreenshot = () => {
    const canvas = viewerRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${fileName || 'model'}-screenshot.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      handleLog(`Took screenshot of ${fileName}`);
    }
  };

  const handleResetCamera = () => { controlsRef.current?.reset(); handleLog('Reset camera view'); };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) viewerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const handleModelLoad = useCallback(({ stats, layers }) => {
    setModelStats(stats);
    setMeshLayers(layers);

    // Auto-fit camera and zoom limits based on model dimensions
    const maxDim = Math.max(
      parseFloat(stats.size.x),
      parseFloat(stats.size.y),
      parseFloat(stats.size.z),
    );
    if (maxDim > 0) {
      const fitDistance = maxDim * 2;
      const newZoomMax = Math.max(20, maxDim * 10);
      const newZoomMin = Math.max(0.01, maxDim * 0.01);
      setZoomMax(newZoomMax);
      setZoomMin(newZoomMin);
      // Reposition camera via OrbitControls ref after the current render cycle
      requestAnimationFrame(() => {
        if (controlsRef.current) {
          const cam = controlsRef.current.object;
          cam.position.set(0, maxDim * 0.5, Math.max(fitDistance, MIN_CAMERA_DISTANCE));
          cam.near = Math.max(newZoomMin * NEAR_PLANE_FACTOR, MIN_NEAR_PLANE);
          cam.far = newZoomMax * FAR_PLANE_FACTOR;
          cam.updateProjectionMatrix();
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      });
    }
  }, []);

  const handleModelError = useCallback(({ message, fileName: errFile, fileType: errType }) => {
    console.error(`[Upload] Model load failed — file: "${errFile}", format: ${errType?.toUpperCase() ?? 'unknown'}, reason: ${message}`);
    setLoadError({ message, fileName: errFile, fileType: errType });
  }, []);

  // Annotation: first click sets point, then user enters label
  const handleAnnotationAdd = useCallback((point) => {
    setPendingPoint([point.x, point.y, point.z]);
  }, []);

  const confirmAnnotation = () => {
    if (!pendingPoint) return;
    addAnnotation({
      id: Date.now(),
      position: pendingPoint,
      label: pendingLabel || `Pin ${annotations.length + 1}`,
      color: 'rgba(0,255,204,0.92)',
    });
    setPendingPoint(null);
    setPendingLabel('');
    handleLog('Added annotation pin');
  };

  const cancelAnnotation = () => { setPendingPoint(null); setPendingLabel(''); };

  const toggleLayer = (id) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCopyShareLink = () => {
    const params = new URLSearchParams({
      env: envPreset,
      intensity: lightIntensity,
      viewMode,
      scale: modelScale,
      color: materialColor.replace('#', ''),
      metalness,
      roughness,
      autoRotate: autoRotate ? '1' : '0',
    });
    const url = `${window.location.origin}/upload?settings=${btoa(params.toString())}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    handleLog('Copied share link');
  };

  const embedCode = `<iframe src="${window.location.origin}/upload" width="800" height="600" style="border:0" allowfullscreen></iframe>`;

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeLogs = history.filter((h) => h.fileName === fileName || !fileUrl).slice(0, 50);

  return (
    <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 120px)', width: '100%' }}>
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div style={{ width: '320px', minWidth: '320px', height: '100%', flexShrink: 0, overflowY: 'auto', paddingRight: '8px', paddingBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

        {/* Upload Area */}
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <label
            className={`file-drop-area${dragging ? ' dragover' : ''}`}
            style={{ marginBottom: 0, display: 'block', cursor: 'pointer' }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <UploadCloud size={40} color="var(--accent)" style={{ margin: '0 auto 0.5rem auto' }} />
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>
              {dragging ? '☄️ Drop payload here!' : 'Drop 3D payload or Click to Transmit'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.3rem' }}>
              .glb · .gltf · .obj · .fbx
            </span>
            <input type="file" accept=".glb,.gltf,.obj,.fbx" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {fileUrl && (
          <>
            {/* Model Info */}
            <Section icon={<Info size={16} />} title="Model Info" defaultOpen>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>File:</strong> {fileName}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Format:</strong> .{fileType?.toUpperCase()}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Size:</strong> {formatFileSize(fileSize)}</div>
                {modelStats && (
                  <>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Triangles:</strong> {modelStats.triangles.toLocaleString()}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Vertices:</strong> {modelStats.vertices.toLocaleString()}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Meshes:</strong> {modelStats.meshCount}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Materials:</strong> {modelStats.materialCount}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Dimensions:</strong> {modelStats.size.x} × {modelStats.size.y} × {modelStats.size.z}</div>
                  </>
                )}
              </div>
            </Section>

            {/* Controls */}
            <Section icon={<Settings size={16} />} title="Controls" defaultOpen>
              <button
                className={`btn${autoRotate ? ' btn-primary' : ''}`}
                onClick={() => { setAutoRotate(!autoRotate); handleLog(`Auto Rotate ${!autoRotate ? 'ON' : 'OFF'}`); }}
              >
                <RotateCw size={14} /> Auto Rotate {autoRotate ? 'ON' : 'OFF'}
              </button>

              <button className="btn" onClick={handleResetCamera}>
                <RefreshCw size={14} /> Reset Camera
              </button>

              <button className="btn btn-primary" onClick={handleScreenshot}>
                <ImageIcon size={14} /> Take Screenshot
              </button>

              <button className="btn" onClick={toggleFullscreen}>
                {isFullscreen ? <><Minimize2 size={14} /> Exit Fullscreen</> : <><Maximize2 size={14} /> Fullscreen</>}
              </button>
            </Section>

            {/* View Mode */}
            <Section icon={<Eye size={16} />} title="View Mode">
              <ViewModeSelector value={viewMode} onChange={(m) => { setViewMode(m); handleLog(`View mode: ${m}`); }} />
            </Section>

            {/* Rendering */}
            <Section icon={<Sun size={16} />} title="Lighting & Environment">
              <div>
                <Label icon={<Sun size={12} />} text="Light Intensity" value={lightIntensity.toFixed(1)} />
                <input type="range" min="0" max="3" step="0.1" value={lightIntensity} onChange={(e) => setLightIntensity(parseFloat(e.target.value))} style={{ marginBottom: 0 }} />
              </div>
              <div>
                <Label text="Environment" />
                <select value={envPreset} onChange={(e) => { setEnvPreset(e.target.value); handleLog(`Environment: ${e.target.value}`); }} style={{ marginBottom: 0 }}>
                  <option value="city">City (Default)</option>
                  <option value="dawn">Dawn</option>
                  <option value="sunrise">Sunrise</option>
                  <option value="sunset">Sunset</option>
                  <option value="night">Night</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="forest">Forest</option>
                  <option value="apartment">Apartment</option>
                  <option value="studio">Studio</option>
                  <option value="lobby">Lobby</option>
                </select>
              </div>
            </Section>

            {/* Material */}
            <Section icon={<Palette size={16} />} title="Material Overrides">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Label text="Color Tint" />
                <input
                  type="color"
                  value={materialColor}
                  onChange={(e) => setMaterialColor(e.target.value)}
                  style={{ width: '40px', height: '32px', padding: '2px', marginBottom: 0, flex: 'none' }}
                />
                <button className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setMaterialColor('#ffffff')}>Reset</button>
              </div>
              <div>
                <Label icon={<Sliders size={12} />} text="Metalness" value={metalness.toFixed(2)} />
                <input type="range" min="0" max="1" step="0.01" value={metalness} onChange={(e) => setMetalness(parseFloat(e.target.value))} style={{ marginBottom: 0 }} />
              </div>
              <div>
                <Label icon={<Sliders size={12} />} text="Roughness" value={roughness.toFixed(2)} />
                <input type="range" min="0" max="1" step="0.01" value={roughness} onChange={(e) => setRoughness(parseFloat(e.target.value))} style={{ marginBottom: 0 }} />
              </div>
            </Section>

            {/* Scale & Camera */}
            <Section icon={<Ruler size={16} />} title="Scale & Camera">
              <div>
                <Label text="Model Scale" value={`${modelScale.toFixed(2)}×`} />
                <input type="range" min="0.1" max="5" step="0.05" value={modelScale} onChange={(e) => setModelScale(parseFloat(e.target.value))} style={{ marginBottom: 0 }} />
              </div>
              <div>
                <Label text="Zoom Min" value={zoomMin.toFixed(2)} />
                <input type="range" min="0.01" max="50" step="0.01" value={zoomMin} onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setZoomMin(Math.min(v, zoomMax - MIN_ZOOM_GAP));
                }} style={{ marginBottom: 0 }} />
              </div>
              <div>
                <Label text="Zoom Max" value={zoomMax.toFixed(1)} />
                <input type="range" min="1" max="2000" step="1" value={zoomMax} onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setZoomMax(Math.max(v, zoomMin + MIN_ZOOM_GAP));
                }} style={{ marginBottom: 0 }} />
              </div>
              <button
                className={`btn${firstPerson ? ' btn-primary' : ''}`}
                onClick={() => { setFirstPerson(!firstPerson); handleLog(`First-person mode ${!firstPerson ? 'ON' : 'OFF'}`); }}
              >
                <Crosshair size={14} /> {firstPerson ? 'Exit First-Person' : 'First-Person Mode'}
              </button>
              {firstPerson && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {fpLocked
                    ? 'Pointer locked — use WASD/arrows to move, mouse to look. Press ESC to exit.'
                    : 'Click the viewport to lock pointer and enter first-person navigation.'}
                </p>
              )}
            </Section>

            {/* Annotations */}
            <Section icon={<Pin size={16} />} title={`Annotations (${annotations.length})`}>
              <button
                className={`btn${annotationMode ? ' btn-primary' : ''}`}
                onClick={() => { setAnnotationMode(!annotationMode); setPendingPoint(null); setPendingLabel(''); }}
              >
                <Pin size={14} /> {annotationMode ? 'Stop Placing Pins' : 'Place Pin Mode'}
              </button>

              {annotationMode && !pendingPoint && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Click on the model to place a pin.</p>
              )}

              {pendingPoint && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--accent)', margin: 0 }}>Pin placed! Enter a label:</p>
                  <input
                    type="text"
                    placeholder="Annotation label…"
                    value={pendingLabel}
                    onChange={(e) => setPendingLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmAnnotation()}
                    style={{ marginBottom: 0 }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '0.3rem' }} onClick={confirmAnnotation}>Confirm</button>
                    <button className="btn" style={{ flex: 1, padding: '0.3rem' }} onClick={cancelAnnotation}>Cancel</button>
                  </div>
                </div>
              )}

              {annotations.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '150px', overflowY: 'auto' }}>
                  {annotations.map((ann) => (
                    <div key={ann.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.3rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                      <span>📍 {ann.label}</span>
                      <button className="btn" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem', border: 'none', color: 'var(--text-secondary)' }} onClick={() => { removeAnnotation(ann.id); handleLog(`Removed annotation: ${ann.label}`); }}>✕</button>
                    </div>
                  ))}
                  <button className="btn" style={{ padding: '0.3rem', fontSize: '0.78rem' }} onClick={() => { clearAnnotations(); handleLog('Cleared all annotations'); }}>Clear All</button>
                </div>
              )}
            </Section>

            {/* Mesh Layers */}
            {meshLayers.length > 0 && (
              <Section icon={<Layers size={16} />} title={`Mesh Layers (${meshLayers.length})`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {meshLayers.map((layer) => {
                    const hidden = hiddenLayers.has(layer.id);
                    return (
                      <div key={layer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.3rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px', opacity: hidden ? 0.5 : 1 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{layer.name}</span>
                        <button
                          className="btn"
                          style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', border: 'none' }}
                          onClick={() => toggleLayer(layer.id)}
                          title={hidden ? 'Show' : 'Hide'}
                        >
                          {hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button className="btn" style={{ padding: '0.3rem', fontSize: '0.78rem' }} onClick={() => setHiddenLayers(new Set())}>Show All</button>
              </Section>
            )}

            {/* Share */}
            <Section icon={<Share2 size={16} />} title="Share & Export">
              <button className="btn" onClick={handleCopyShareLink} style={{ justifyContent: 'center' }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Settings Link</>}
              </button>
              <div>
                <Label text="Embed Code" />
                <textarea
                  readOnly
                  value={embedCode}
                  rows={3}
                  style={{ fontSize: '0.72rem', fontFamily: 'monospace', resize: 'none', marginBottom: 0 }}
                  onClick={(e) => e.target.select()}
                />
              </div>
            </Section>

            {/* Action Logs */}
            <Section icon={<List size={16} />} title="Action Logs">
              <button className="btn" style={{ padding: '0.25rem 0.6rem', alignSelf: 'flex-end', fontSize: '0.78rem' }} onClick={() => setShowLogs(!showLogs)}>
                {showLogs ? 'Hide' : 'Show'}
              </button>
              {showLogs && (
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {activeLogs.map((log) => (
                    <div key={log.id} style={{ fontSize: '0.82rem', marginBottom: '0.4rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>[{log.timestamp}]</span>
                      {log.action}
                    </div>
                  ))}
                  {activeLogs.length === 0 && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>No recorded actions yet.</p>}
                </div>
              )}
            </Section>
          </>
        )}
      </div>

      {/* ── Viewport ─────────────────────────────────────────────── */}
      <div
        ref={viewerRef}
        className="glass-panel"
        style={{ flexGrow: 1, height: '100%', padding: 0, overflow: 'hidden', position: 'relative' }}
      >
        {!fileUrl ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
            <UploadCloud size={72} color="var(--accent)" style={{ opacity: 0.4 }} />
            <h2 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif" }}>Transmit a model to initiate viewing.</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Supports .glb, .gltf, .obj and .fbx — drag &amp; drop or use the comm panel on the left</p>
          </div>
        ) : (
          <>
            {annotationMode && (
              <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(0,255,204,0.15)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '0.4rem 1rem', fontSize: '0.82rem', color: 'var(--accent)', pointerEvents: 'none' }}>
                📍 Click on the model to place an annotation pin
              </div>
            )}
            {loadError && (
              <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,107,107,0.6)', borderRadius: '8px', padding: '0.5rem 1.2rem', fontSize: '0.83rem', color: '#ff6b6b', maxWidth: '80%', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span>
                  ⚠️ Failed to load <strong>{loadError.fileName}</strong>
                  {loadError.fileType && <span> ({loadError.fileType.toUpperCase()})</span>}
                  {' — '}{loadError.message}
                </span>
                <button
                  onClick={() => setLoadError(null)}
                  style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 0.2rem', flexShrink: 0 }}
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            )}
            <Canvas
              ref={canvasRef}
              camera={{ position: [0, 0, 5], fov: firstPerson ? 75 : 50 }}
              gl={{ preserveDrawingBuffer: true }}
              style={{ width: '100%', height: '100%' }}
            >
              <ModelViewer
                url={fileUrl}
                fileType={fileType}
                viewMode={viewMode}
                autoRotate={autoRotate && !firstPerson}
                envPreset={envPreset}
                controlsRef={controlsRef}
                lightIntensity={lightIntensity}
                modelScale={modelScale}
                materialColor={materialColor}
                metalness={metalness}
                roughness={roughness}
                hiddenLayers={hiddenLayers}
                annotationMode={annotationMode}
                annotations={annotations}
                onAnnotationAdd={handleAnnotationAdd}
                onRemoveAnnotation={(id) => { removeAnnotation(id); handleLog('Removed annotation pin'); }}
                onModelLoad={handleModelLoad}
                onError={handleModelError}
                firstPerson={firstPerson}
                zoomMin={zoomMin}
                zoomMax={zoomMax}
              />
            </Canvas>
          </>
        )}
      </div>
    </div>
  );
}
