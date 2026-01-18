import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css'; // This connects your CSS file!

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sensitivity, setSensitivity] = useState(50); // Start at 50

  const imgRef = useRef(null);

  // YOUR HUGGING FACE BRAIN ADDRESS
  const API_URL = "https://pangsk6551-insulation-api.hf.space/detect";

  // --- COLOR PALETTE FOR GROUPS OF 20 ---
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

  // Reusable function to perform the counting
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
        }, 100);
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
      // Auto-run immediately upon selection
      performCount(file, sensitivity);
    }
  };

  // Trigger re-count when user finishes dragging slider (if file exists)
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

    const hitThreshold = 3;
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
            onMouseUp={handleSensitivityCommit} // Desktop
            onTouchEnd={handleSensitivityCommit} // Mobile
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
              // Calculate color group based on index (0-19, 20-39, etc.)
              const colorIndex = Math.floor(i / 20) % markerColors.length;
              return (
                  <div
                    key={i}
                    className="marker-circle"
                    style={{
                      left: `${pt.x}%`,
                      top: `${pt.y}%`,
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