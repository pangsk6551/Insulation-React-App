import React, { useState, useRef } from 'react';
import axios from 'axios';

// --- CSS STYLES (INTEGRATED) ---
const cssStyles = `
  /* --- GLOBAL RESET --- */
  body {
    background-color: #f8f9fa;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 0;
    color: #333;
  }

  .app-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    min-height: 100vh;
    box-shadow: 0 0 20px rgba(0,0,0,0.05);
  }

  /* --- SUPERLON HEADER BRANDING --- */
  .header-section {
      text-align: center;
      margin-bottom: 25px;
  }

  .superlon-logo {
      font-family: "Arial Black", Arial, sans-serif;
      font-style: italic;
      font-weight: 900;
      font-size: 2.5rem;
      color: #0056b8;
      margin: 0;
      line-height: 1;
      letter-spacing: -1px;
  }

  .reg-mark {
      font-family: Arial, sans-serif;
      font-style: normal;
      font-size: 1rem;
      vertical-align: top;
      margin-left: 8px;
  }

  .header-line {
      width: 60%;
      height: 1px;
      background-color: #e0e0e0;
      margin: 8px auto;
  }

  .subtitle {
      font-family: Arial, sans-serif;
      color: #0056b8;
      font-size: 0.9rem;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0;
      letter-spacing: 1px;
  }

  /* --- CONTROLS --- */
  .control-card {
      background: #f1f5f9;
      padding: 20px;
      border-radius: 16px;
      margin-bottom: 20px;
  }

  .file-input {
      display: none;
  }

  .file-label {
      display: block;
      text-align: center;
      background: white;
      padding: 12px;
      border: 1px dashed #0056b8;
      color: #0056b8;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 15px;
      transition: all 0.2s;
  }

  .file-label:active {
      transform: scale(0.98);
      background-color: #f8f9fa;
  }

  .slider-container {
      margin-bottom: 12px;
  }

  .slider-container label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 5px;
  }

  input[type=range] {
      width: 100%;
      accent-color: #0056b8;
  }

  .loading-text {
      text-align: center;
      color: #0056b8;
      font-weight: bold;
      margin-top: 10px;
      font-size: 0.9rem;
  }

  /* --- RESULTS & INTERACTIVE AREA --- */
  .result-header {
      text-align: center;
      margin-bottom: 10px;
  }

  .count-number {
      color: #0056b8;
      font-size: 2rem;
      font-weight: 800;
  }

  .instruction-text {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: -5px;
  }

  /* --- IMAGE DISPLAY (STANDARDIZED) --- */
  .image-wrapper {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      border: 1px solid #eee;
      background-color: #333;
      text-align: center;
      padding: 10px;
  }

  .interactive-area {
      position: relative;
      display: inline-block;
      line-height: 0;
      cursor: crosshair;
      max-height: 60vh;
  }

  .main-image {
      display: block;
      max-width: 100%;
      max-height: 60vh;
      width: auto;
      height: auto;
      user-select: none;
  }

  /* --- THE MARKERS (Circles) --- */
  .marker-circle {
      position: absolute;
      border: 2px solid white;
      border-radius: 50%;
      color: white;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      pointer-events: none;
      /* Width, Height, BG Color, and Font Size set dynamically in JS */
  }
`;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sensitivity, setSensitivity] = useState(50);
  const [markerSize, setMarkerSize] = useState(24); // NEW: Circle size state

  const imgRef = useRef(null);

  const API_URL = "https://pangsk6551-insulation-api.hf.space/detect";

  const markerColors = [
      "rgba(34, 197, 94, 0.9)",   // 1-20: Green
      "rgba(59, 130, 246, 0.9)",  // 21-40: Blue
      "rgba(168, 85, 247, 0.9)",  // 41-60: Purple
      "rgba(249, 115, 22, 0.9)",  // 61-80: Orange
      "rgba(239, 68, 68, 0.9)",   // 81-100: Red
      "rgba(20, 184, 166, 0.9)",  // 101-120: Teal
      "rgba(236, 72, 153, 0.9)",  // 121-140: Pink
      "rgba(234, 179, 8, 0.9)"    // 141-160: Yellow
  ];

  const performCount = async (fileToCount, sensValue) => {
    if (!fileToCount) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", fileToCount);

    try {
      const response = await axios.post(`${API_URL}?sensitivity=${sensValue}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const img = imgRef.current;
      if (img && response.data.points) {
         const naturalWidth = img.naturalWidth;
         const naturalHeight = img.naturalHeight;

         const newMarkers = response.data.points.map(pt => ({
            x: (pt.x / naturalWidth) * 100,
            y: (pt.y / naturalHeight) * 100
         }));
         setMarkers(newMarkers);
      } else {
        setTimeout(() => {
           const retryImg = imgRef.current;
           if(retryImg && response.data.points) {
             const nw = retryImg.naturalWidth;
             const nh = retryImg.naturalHeight;
             const retryMarkers = response.data.points.map(pt => ({
                x: (pt.x / nw) * 100,
                y: (pt.y / nh) * 100
             }));
             setMarkers(retryMarkers);
           }
        }, 150);
      }

    } catch (error) {
      console.error("Error uploading:", error);
      alert("Error connecting. Is the Hugging Face space running?");
    }
    setLoading(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setMarkers([]);
      performCount(file, sensitivity);
    }
  };

  const handleSensitivityChange = (e) => {
      setSensitivity(e.target.value);
  }

  const handleSensitivityCommit = () => {
      if (selectedFile) {
          performCount(selectedFile, sensitivity);
      }
  }

  const handleImageClick = (e) => {
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = (clickX / rect.width) * 100;
    const yPercent = (clickY / rect.height) * 100;

    // Hit threshold adjusts based on marker size (converted to relative % approx)
    const hitThreshold = (markerSize / rect.width) * 100 * 1.2;

    const hitIndex = markers.findIndex(m => {
        const dist = Math.sqrt(Math.pow(m.x - xPercent, 2) + Math.pow(m.y - yPercent, 2));
        return dist < hitThreshold;
    });

    if (hitIndex !== -1) {
        const updated = [...markers];
        updated.splice(hitIndex, 1);
        setMarkers(updated);
    } else {
        setMarkers([...markers, { x: xPercent, y: yPercent }]);
    }
  };

  return (
    <div className="app-container">
      <style>{cssStyles}</style>

      {/* --- BRANDING HEADER --- */}
      <div className="header-section">
        <h1 className="superlon-logo">
            SUPERLON<span className="reg-mark">®</span>
        </h1>
        <div className="header-line"></div>
        <h2 className="subtitle">Insulation Tubes Count</h2>
      </div>

      {/* --- CONTROLS --- */}
      <div className="card control-card">
        <input type="file" accept="image/*" onChange={handleFileChange} id="file-upload" className="file-input" />
        <label htmlFor="file-upload" className="file-label">
            {selectedFile ? "📸 Take Photo / Upload" : "📸 Upload Photo"}
        </label>

        <div className="slider-container">
          <label>Sensitivity: {sensitivity}%</label>
          <input
            type="range"
            min="10" max="80"
            value={sensitivity}
            onChange={handleSensitivityChange}
            onMouseUp={handleSensitivityCommit}
            onTouchEnd={handleSensitivityCommit}
          />
        </div>

        {/* NEW: Circle Size Slider */}
        <div className="slider-container">
          <label>Circle Size: {markerSize}px</label>
          <input
            type="range"
            min="10" max="50"
            value={markerSize}
            onChange={(e) => setMarkerSize(parseInt(e.target.value))}
          />
        </div>

        {loading && <div className="loading-text">Analyzing Image... ⏳</div>}
      </div>

      {/* --- RESULTS DISPLAY --- */}
      {preview && (
          <div className="result-header">
            <h3>Total: <span className="count-number">{markers.length}</span></h3>
            <p className="instruction-text">Tap image to add or remove dots</p>
          </div>
      )}

      {/* --- IMAGE CANVAS --- */}
      <div className="image-wrapper">
        {preview && (
          <div className="interactive-area" onClick={handleImageClick}>
            <img
                ref={imgRef}
                src={preview}
                alt="Upload"
                className="main-image"
            />

            {/* Render Circles with Numbers */}
            {markers.map((pt, i) => {
              const colorIndex = Math.floor(i / 20) % markerColors.length;
              return (
                  <div
                    key={i}
                    className="marker-circle"
                    style={{
                      left: `${pt.x}%`,
                      top: `${pt.y}%`,
                      width: `${markerSize}px`,
                      height: `${markerSize}px`,
                      fontSize: `${markerSize * 0.5}px`, // Font scales with circle
                      backgroundColor: markerColors[colorIndex]
                    }}
                  >
                    {i + 1}
                  </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;