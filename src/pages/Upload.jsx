import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  UploadCloud, RotateCw, Grid, Image as ImageIcon, Settings,
  List, RefreshCw, Maximize2, Minimize2, Sun, Info,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import ModelViewer from '../components/ModelViewer';

export default function Upload() {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Controls
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [envPreset, setEnvPreset] = useState('city');
  const [lightIntensity, setLightIntensity] = useState(1);
  const [showLogs, setShowLogs] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const viewerRef = useRef(null);
  const controlsRef = useRef(null);
  const { addLog, history } = useStore();

  // Revoke the object URL when it changes or the component unmounts (prevents memory leaks)
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  // Reset dragging state if the drag operation is cancelled (e.g. user drags outside the window)
  useEffect(() => {
    const handleDragEnd = () => setDragging(false);
    window.addEventListener('dragend', handleDragEnd);
    return () => window.removeEventListener('dragend', handleDragEnd);
  }, []);

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const handleLog = (action, fName) => {
    const fn = fName || fileName || 'Model';
    addLog({ id: Date.now(), action, timestamp: new Date().toLocaleTimeString(), fileName: fn });
  };

  const processFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (['glb', 'gltf', 'obj'].includes(extension)) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFileType(extension);
      setFileName(file.name);
      setFileSize(file.size);
      handleLog(`Uploaded file: ${file.name}`, file.name);
    } else {
      alert('Please upload a valid .glb, .gltf, or .obj file.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleScreenshot = () => {
    const canvas = viewerRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${fileName}-screenshot.png`;
      link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      link.click();
      handleLog(`Took screenshot of ${fileName}`);
    }
  };

  const handleResetCamera = () => {
    controlsRef.current?.reset();
    handleLog('Reset camera view');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeLogs = history.filter(h => h.fileName === fileName || !fileUrl).slice(0, 50);

  return (
    <div style={{ display: 'flex', gap: '1rem', height: '78vh', width: '100%' }}>
      {/* Sidebar Controls */}
      <div style={{ width: '320px', minWidth: '320px', flexShrink: 0, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Upload Area */}
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <label
            className={`file-drop-area${dragging ? ' dragover' : ''}`}
            style={{ marginBottom: 0, display: 'block', cursor: 'pointer' }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <UploadCloud size={48} color="var(--accent)" style={{ margin: '0 auto 0.5rem auto' }} />
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>
              {dragging ? '📂 Drop it here!' : 'Drop 3D file or Click to Upload'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.4rem' }}>
              .glb · .gltf · .obj
            </span>
            <input type="file" accept=".glb,.gltf,.obj" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {fileUrl && (
          <>
            {/* Model Info */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, marginBottom: '0.5rem' }}>
                <Info size={18} /> Model Info
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>File:</strong> {fileName}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Format:</strong> .{fileType?.toUpperCase()}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Size:</strong> {formatFileSize(fileSize)}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, marginBottom: '0.25rem' }}>
                <Settings size={18} /> Controls
              </h3>

              <button
                className={`btn${autoRotate ? ' btn-primary' : ''}`}
                onClick={() => { setAutoRotate(!autoRotate); handleLog(`Auto Rotate ${!autoRotate ? 'ON' : 'OFF'}`); }}
              >
                <RotateCw size={16} /> Auto Rotate {autoRotate ? 'ON' : 'OFF'}
              </button>

              <button
                className={`btn${wireframe ? ' btn-primary' : ''}`}
                onClick={() => { setWireframe(!wireframe); handleLog(`Wireframe ${!wireframe ? 'ON' : 'OFF'}`); }}
              >
                <Grid size={16} /> Wireframe {wireframe ? 'ON' : 'OFF'}
              </button>

              <button className="btn" onClick={handleResetCamera}>
                <RefreshCw size={16} /> Reset Camera
              </button>

              <button className="btn btn-primary" onClick={handleScreenshot}>
                <ImageIcon size={16} /> Take Screenshot
              </button>

              <button className="btn" onClick={toggleFullscreen}>
                {isFullscreen ? <><Minimize2 size={16} /> Exit Fullscreen</> : <><Maximize2 size={16} /> Fullscreen</>}
              </button>

              {/* Light Intensity */}
              <div style={{ marginTop: '0.25rem' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.3rem' }}>
                  <Sun size={14} /> Light Intensity: {lightIntensity.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={lightIntensity}
                  onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                  style={{ marginBottom: 0 }}
                />
              </div>

              {/* Environment Preset */}
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Environment
                </label>
                <select
                  value={envPreset}
                  onChange={(e) => { setEnvPreset(e.target.value); handleLog(`Environment: ${e.target.value}`); }}
                  style={{ marginBottom: 0 }}
                >
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
            </div>

            {/* Action Logs */}
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <List size={18} /> Action Logs
                </h3>
                <button className="btn" style={{ padding: '0.2rem 0.6rem' }} onClick={() => setShowLogs(!showLogs)}>
                  {showLogs ? 'Hide' : 'Show'}
                </button>
              </div>
              {showLogs && (
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {activeLogs.map((log) => (
                    <div key={log.id} style={{ fontSize: '0.85rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>[{log.timestamp}]</span>
                      {log.action}
                    </div>
                  ))}
                  {activeLogs.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No recorded actions yet.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Viewer Area */}
      <div
        ref={viewerRef}
        className="glass-panel"
        style={{ flexGrow: 1, height: '100%', padding: 0, overflow: 'hidden', position: 'relative' }}
      >
        {!fileUrl ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
            <UploadCloud size={72} color="var(--accent)" style={{ opacity: 0.4 }} />
            <h2 style={{ margin: 0 }}>Upload a model to begin viewing.</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Supports .glb, .gltf, and .obj — drag &amp; drop or use the panel on the left</p>
          </div>
        ) : (
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ preserveDrawingBuffer: true }}
            style={{ width: '100%', height: '100%' }}
          >
            <ModelViewer
              url={fileUrl}
              fileType={fileType}
              wireframe={wireframe}
              autoRotate={autoRotate}
              envPreset={envPreset}
              controlsRef={controlsRef}
              lightIntensity={lightIntensity}
            />
          </Canvas>
        )}
      </div>
    </div>
  );
}
