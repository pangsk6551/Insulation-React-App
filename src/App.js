import React, { useState, useRef } from 'react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';

// --- CSS STYLES (INTEGRATED) ---
const cssStyles = `
  body { background-color: #f8f9fa; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; }
  .app-container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; min-height: 100vh; }
  .header-section { text-align: center; margin-bottom: 25px; }
  .superlon-logo { font-family: "Arial Black", sans-serif; font-style: italic; font-weight: 900; font-size: 2.5rem; color: #0056b8; margin: 0; }
  .reg-mark { font-size: 1rem; vertical-align: top; }
  .header-line { width: 60%; height: 2px; background-color: #0056b8; margin: 8px auto; }
  .subtitle { color: #0056b8; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; margin: 0; }
  .control-card { background: #f1f5f9; padding: 20px; border-radius: 16px; margin-bottom: 20px; }
  .file-input { display: none; }
  .file-label { display: block; text-align: center; background: white; padding: 15px; border: 2px dashed #0056b8; color: #0056b8; border-radius: 10px; font-weight: 700; cursor: pointer; margin-bottom: 15px; }
  .slider-container { margin-bottom: 15px; }
  .slider-container label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 5px; }
  input[type=range] { width: 100%; accent-color: #0056b8; }
  .loading-text { text-align: center; color: #0056b8; font-weight: bold; margin: 10px 0; }
  .result-header { text-align: center; margin-bottom: 15px; }
  .count-number { color: #0056b8; font-size: 2.5rem; font-weight: 800; }
  .image-wrapper { position: relative; border-radius: 12px; overflow: hidden; background-color: #eee; text-align: center; }
  .interactive-area { position: relative; display: inline-block; cursor: crosshair; }
  .main-image { display: block; max-width: 100%; height: auto; user-select: none; }
  .marker-circle { position: absolute; border: 2px solid white; border-radius: 50%; color: white; font-weight: bold; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); pointer-events: none; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
`;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sensitivity, setSensitivity] = useState(50);
  const [markerSize, setMarkerSize] = useState(24);

  const imgRef = useRef(null);
  const API_URL = "https://pangsk6551-insulation-api.hf.space/detect";

  const markerColors = ["rgba(34, 197, 94, 0.9)", "rgba(59, 130, 246, 0.9)", "rgba(168, 85, 247, 0.9)", "rgba(249, 115, 22, 0.9)", "rgba(239, 68, 68, 0.9)"];

  const performCount = async (fileToCount, sensValue) => {
    if (!fileToCount) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", fileToCount);

    try {
      const response = await axios.post(`${API_URL}?sensitivity=${sensValue}`, formData);
      const img = imgRef.current;
      if (img && response.data.points) {
         setMarkers(response.data.points.map(pt => ({
            x: (pt.x / img.naturalWidth) * 100,
            y: (pt.y / img.naturalHeight) * 100
         })));
      }
    } catch (error) {
      alert("Error connecting to AI server.");
    }
    setLoading(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true); // Show loading while compressing
      try {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        setSelectedFile(compressedFile);
        setPreview(URL.createObjectURL(compressedFile));
        setMarkers([]);
        performCount(compressedFile, sensitivity);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleImageClick = (e) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const xP = ((e.clientX - rect.left) / rect.width) * 100;
    const yP = ((e.clientY - rect.top) / rect.height) * 100;
    const hitThreshold = (markerSize / rect.width) * 120;
    const hitIndex = markers.findIndex(m => Math.sqrt(Math.pow(m.x - xP, 2) + Math.pow(m.y - yP, 2)) < hitThreshold);

    if (hitIndex !== -1) {
      const updated = [...markers];
      updated.splice(hitIndex, 1);
      setMarkers(updated);
    } else {
      setMarkers([...markers, { x: xP, y: yP }]);
    }
  };

  return (
    <div className="app-container">
      <style>{cssStyles}</style>
      <div className="header-section">
        <h1 className="superlon-logo">SUPERLON<span className="reg-mark">®</span></h1>
        <div className="header-line"></div>
        <h2 className="subtitle">Insulation Tubes Count</h2>
      </div>

      <div className="control-card">
        <input type="file" accept="image/*" onChange={handleFileChange} id="file-upload" className="file-input" />
        <label htmlFor="file-upload" className="file-label">📸 {selectedFile ? "Change Photo" : "Upload Photo"}</label>
        <div className="slider-container">
          <label>Sensitivity: {sensitivity}%</label>
          <input type="range" min="10" max="80" value={sensitivity} onChange={(e) => setSensitivity(e.target.value)} onMouseUp={() => performCount(selectedFile, sensitivity)} onTouchEnd={() => performCount(selectedFile, sensitivity)} />
        </div>
        <div className="slider-container">
          <label>Dot Size: {markerSize}px</label>
          <input type="range" min="10" max="50" value={markerSize} onChange={(e) => setMarkerSize(parseInt(e.target.value))} />
        </div>
        {loading && <div className="loading-text">Optimizing & Analyzing... ⏳</div>}
      </div>

      {preview && (
        <>
          <div className="result-header">
            <h3>Total: <span className="count-number">{markers.length}</span></h3>
            <p style={{fontSize:'0.8rem', color:'#64748b'}}>Tap image to add/remove dots</p>
          </div>
          <div className="image-wrapper">
            <div className="interactive-area" onClick={handleImageClick}>
              <img ref={imgRef} src={preview} alt="Upload" className="main-image" />
              {markers.map((pt, i) => (
                <div key={i} className="marker-circle" style={{
                  left: `${pt.x}%`, top: `${pt.y}%`, width: `${markerSize}px`, height: `${markerSize}px`,
                  fontSize: `${markerSize * 0.5}px`, backgroundColor: markerColors[Math.floor(i / 20) % markerColors.length]
                }}>{i + 1}</div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default App;