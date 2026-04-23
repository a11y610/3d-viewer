import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { UploadCloud, RotateCw, Grid, Image as ImageIcon, Settings, List } from 'lucide-react';
import { useStore } from '../store/useStore';
import ModelViewer from '../components/ModelViewer';

export default function Upload() {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileName, setFileName] = useState('');
  
  // Controls
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [envPreset, setEnvPreset] = useState('city');
  const [showLogs, setShowLogs] = useState(true);
  
  const canvasRef = useRef(null);
  const { user, addLog, history } = useStore();

  const handleLog = (action, fName) => {
    const fn = fName || fileName || 'Model';
    const log = { id: Date.now(), action, timestamp: new Date().toLocaleTimeString(), fileName: fn };
    addLog(log);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (['glb', 'gltf', 'obj'].includes(extension)) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFileType(extension);
      setFileName(file.name);
      handleLog(`Uploaded file: ${file.name}`, file.name);
    } else {
      alert("Please upload a valid .glb, .gltf, or .obj file.");
    }
  };

  const handleScreenshot = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.setAttribute('download', `${fileName}-screenshot.png`);
      link.setAttribute('href', canvasRef.current.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
      link.click();
      handleLog(`Took screenshot of ${fileName}`);
    }
  };

  const activeLogs = history.filter(h => h.fileName === fileName || !fileUrl).slice(0, 50);

  return (
    <div className="flex gap-4" style={{ height: '78vh', width: '100%' }}>
      {/* Sidebar Controls */}
      <div className="flex-col gap-4" style={{ width: '320px', minWidth: '320px', flexShrink: 0, overflowY: 'auto', paddingRight: '8px' }}>
        <div className="glass-panel text-center">
          <label className="file-drop-area block cursor-pointer" style={{marginBottom: 0}}>
            <UploadCloud size={48} color="var(--accent)" style={{ margin: '0 auto 0.5rem auto' }} />
            <span className="text-secondary block">Drop 3D file or Click to Upload</span>
            <span className="text-sm block mt-2">.glb, .gltf, .obj</span>
            <input type="file" accept=".glb,.gltf,.obj" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {fileUrl && (
          <>
            <div className="glass-panel flex-col gap-2">
              <h3 className="flex items-center gap-2"><Settings size={18}/> Controls</h3>
              
              <button 
                className={`btn ${autoRotate ? 'btn-primary' : ''}`} 
                onClick={() => { setAutoRotate(!autoRotate); handleLog(`Toggled Auto Rotate to ${!autoRotate ? 'ON' : 'OFF'}`); }}
              >
                <RotateCw size={16}/> Auto Rotate {autoRotate ? 'ON' : 'OFF'}
              </button>
              
              <button 
                className={`btn ${wireframe ? 'btn-primary' : ''}`} 
                onClick={() => { setWireframe(!wireframe); handleLog(`Toggled Wireframe to ${!wireframe ? 'ON' : 'OFF'}`); }}
              >
                <Grid size={16}/> Wireframe {wireframe ? 'ON' : 'OFF'}
              </button>

              <select 
                value={envPreset} 
                onChange={(e) => { setEnvPreset(e.target.value); handleLog(`Changed Environment to ${e.target.value}`); }}
                className="mt-2"
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

              <button className="btn btn-primary mt-2" onClick={handleScreenshot}>
                <ImageIcon size={16}/> Take Screenshot
              </button>
            </div>

            <div className="glass-panel">
              <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2" style={{margin: 0}}><List size={18}/> Action Logs</h3>
                <button className="btn" style={{padding: '0.2rem 0.6rem'}} onClick={() => setShowLogs(!showLogs)}>
                  {showLogs ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showLogs && (
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {activeLogs.map((log) => (
                    <div key={log.id} className="text-sm mb-2 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <span className="text-secondary" style={{display: 'block', fontSize: '0.75rem'}}>[{log.timestamp}]</span> 
                      {log.action}
                    </div>
                  ))}
                  {activeLogs.length === 0 && <p className="text-sm text-secondary">No recorded actions yet.</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Viewer Area */}
      <div className="glass-panel" style={{ flexGrow: 1, height: '100%', padding: 0, overflow: 'hidden', position: 'relative' }}>
         {!fileUrl ? (
           <div className="flex justify-center items-center h-full text-secondary">
             <h2>Upload a model to begin viewing.</h2>
           </div>
         ) : (
           <Suspense fallback={<div className="flex justify-center items-center h-full"><h2>Loading Engine & Model...</h2></div>}>
             <Canvas 
               ref={canvasRef} 
               camera={{ position: [0, 0, 5], fov: 50 }} 
               gl={{ preserveDrawingBuffer: true, alpha: true }}
             >
               <ModelViewer 
                 url={fileUrl} 
                 fileType={fileType} 
                 wireframe={wireframe} 
                 autoRotate={autoRotate} 
                 envPreset={envPreset} 
               />
             </Canvas>
           </Suspense>
         )}
      </div>
    </div>
  );
}
