import streamlit as st
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO
from streamlit_image_coordinates import streamlit_image_coordinates
import os

# --- Page Configuration ---
st.set_page_config(
    page_title="Superlon Tube Counter",
    page_icon="⭕",
    layout="centered",
    initial_sidebar_state="collapsed"
)


# --- 1. MODEL LOADING (Using your specific folder path) ---
@st.cache_resource
def load_yolo_model():
    # This matches the folder structure in your screenshot
    relative_path = "runs/detect/train10/weights/best.pt"

    # Simple check to help debug if it fails
    if not os.path.exists(relative_path):
        st.error(f"❌ File not found! Python is looking here: {os.path.abspath(relative_path)}")
        st.stop()

    return YOLO(relative_path)


try:
    model = load_yolo_model()
except Exception as e:
    st.error(f"Error loading model: {e}")
    st.stop()

# --- Custom CSS for Styling ---
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

    .stApp {
        background-color: #ffffff;
    }

    /* Header Styling */
    .superlon-header {
        font-family: 'Arial Black', 'Arial', sans-serif;
        font-style: italic;

        /* THE FIX: Added !important to force the color */
        color: #0056b8 !important;

        font-weight: 900;

        /* THE SIZE UPDATE: Changed from 2.5rem to 3.5rem */
        font-size: 3.5rem; 

        text-align: center;
        letter-spacing: -2px;
        line-height: 1;
        margin-bottom: 0;
    }

    .superlon-reg {
        font-family: 'Arial', sans-serif;
        font-style: normal;
        font-size: 1.5rem; /* Increased this slightly too so it matches the big text */
        vertical-align: top;
        margin-left: 5px;
        color: #0056b8 !important; /* Force this blue too */
    }

    .header-divider {
        height: 1px;
        background-color: #e2e8f0;
        width: 60%;
        margin: 10px auto;
    }

    .subtitle {
        color: #0056b8 !important; /* Added !important just in case */
        font-weight: bold;
        text-transform: uppercase;
        text-align: center;
        font-size: 0.85rem;
        letter-spacing: 1px;
        font-family: sans-serif;
    }

    /* Count Box Styling */
    .metric-container {
        background-color: #ffffff;
        border: 1px solid #f1f5f9;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        margin-bottom: 20px;
    }

    .metric-label {
        color: #64748b;
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        text-align: left;
    }

    .metric-value {
        color: #0056b8;
        font-size: 3rem;
        font-weight: 800;
        line-height: 1;
        text-align: left;
    }

    /* Helper Text */
    .helper-text {
        text-align: center;
        color: #64748b;
        font-size: 0.875rem;
        font-weight: 600;
        margin-top: 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Adjust Streamlit default padding */
    .block-container {
        padding-top: 2rem;
        padding-bottom: 5rem;
    }

    /* Hide default elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    </style>
""", unsafe_allow_html=True)

# --- State Management ---
if 'markers' not in st.session_state:
    st.session_state.markers = []
if 'image_hash' not in st.session_state:
    st.session_state.image_hash = None
if 'last_click' not in st.session_state:
    st.session_state.last_click = None


# --- 2. AI LOGIC (Fixed: Removed old 'img_cv' errors) ---
def auto_detect(image_pil, sensitivity):
    # Convert slider (1-100) to Confidence (0.01 - 1.0)
    conf_threshold = sensitivity / 100.0

    # Run YOLO prediction
    results = model.predict(image_pil, conf=conf_threshold)

    detected_markers = []

    # Extract centers of detected boxes
    for result in results:
        for box in result.boxes:
            x_center, y_center, w, h = box.xywh[0]
            detected_markers.append({
                'x': float(x_center),
                'y': float(y_center)
            })

    return detected_markers


# --- Drawing Logic ---
def draw_markers_on_image(image_pil, markers, color_hex, size):
    color_hex = color_hex.lstrip('#')
    rgb_color = tuple(int(color_hex[i:i + 2], 16) for i in (0, 2, 4))

    img_draw = image_pil.copy()
    draw = ImageDraw.Draw(img_draw)

    try:
        font = ImageFont.truetype("arial.ttf", size)
    except IOError:
        font = ImageFont.load_default()

    for i, marker in enumerate(markers):
        x, y = marker['x'], marker['y']
        r = size
        draw.ellipse([(x - r, y - r), (x + r, y + r)], fill=rgb_color, outline="white", width=2)
        text = str(i + 1)
        draw.text((x, y), text, fill="white", font=font, anchor="mm")

    return img_draw


# --- Main Layout ---
st.markdown("""
    <div style="text-align: center;">
        <h1 class="superlon-header">SUPERLON<span class="superlon-reg">®</span></h1>
        <div class="header-divider"></div>
        <div class="subtitle">Insulation Tubes Count</div>
    </div>
""", unsafe_allow_html=True)

with st.expander("Settings / Adjust"):
    col1, col2 = st.columns(2)
    with col1:
        # Default 25% confidence
        sensitivity = st.slider("AI Sensitivity (Confidence %)", 1, 100, 50)
        marker_size = st.number_input("Marker Size", 5, 50, 15)
    with col2:
        marker_color = st.color_picker("Marker Color", "#22c55e")
        manual_rescan = st.button("Re-Scan with AI")

uploaded_file = st.file_uploader("Upload Image", type=['png', 'jpg', 'jpeg'], label_visibility="collapsed")

if uploaded_file is not None:
    image = Image.open(uploaded_file)

    # This was likely where your error was (line 131)
    current_hash = f"{uploaded_file.name}_{uploaded_file.size}"

    if st.session_state.image_hash != current_hash or manual_rescan:
        st.session_state.image_hash = current_hash
        st.session_state.markers = auto_detect(image, sensitivity)
        st.session_state.last_click = None

    display_img = draw_markers_on_image(image, st.session_state.markers, marker_color, marker_size)

    # Interactive Component
    value = streamlit_image_coordinates(display_img, key="img_coords")

    if value is not None and value != st.session_state.last_click:
        st.session_state.last_click = value
        click_x, click_y = value['x'], value['y']

        radius = marker_size * 1.5
        hit_index = -1
        for i, marker in enumerate(st.session_state.markers):
            dist = np.sqrt((marker['x'] - click_x) ** 2 + (marker['y'] - click_y) ** 2)
            if dist < radius:
                hit_index = i
                break

        if hit_index != -1:
            st.session_state.markers.pop(hit_index)
        else:
            st.session_state.markers.append({'x': click_x, 'y': click_y})
        st.rerun()

    st.markdown('<p class="helper-text">Tap image to add missing tubes or remove incorrect ones.</p>',
                unsafe_allow_html=True)

    st.markdown(f"""
        <div class="metric-container">
            <div>
                <div class="metric-label">Total Tubes</div>
                <div class="metric-value">{len(st.session_state.markers)}</div>
            </div>
        </div>
    """, unsafe_allow_html=True)

    c1, c2 = st.columns(2)
    with c1:
        if st.button("Undo Last", use_container_width=True):
            if st.session_state.markers:
                st.session_state.markers.pop()
                st.rerun()
    with c2:
        if st.button("Clear All", type="primary", use_container_width=True):
            st.session_state.markers = []
            st.rerun()
else:
    st.info("👆 Please upload a photo to start counting.")