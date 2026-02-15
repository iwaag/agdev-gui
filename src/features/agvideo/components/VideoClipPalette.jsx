import { useState } from "react";
import { authFetch } from "../../../api/authFetch";

const API_URL = import.meta.env.VITE_AGVIDEO_API_URL || "http://localhost:8000";

function VideoClipPalette({ onGenerateClip }) {
  const [clipTitle, setClipTitle] = useState("");
  const [startImage, setStartImage] = useState(null);
  const [startImagePreview, setStartImagePreview] = useState(null);
  const [endImage, setEndImage] = useState(null);
  const [endImagePreview, setEndImagePreview] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const getExtensionFromType = (mimeType) => {
    if (!mimeType) return "png";
    if (mimeType === "image/jpeg") return "jpg";
    if (mimeType === "image/png") return "png";
    if (mimeType === "image/webp") return "webp";
    if (mimeType === "image/gif") return "gif";
    if (mimeType === "image/bmp") return "bmp";
    return "png";
  };

  const ensureFileName = (file) => {
    if (file?.name) {
      return file;
    }
    const ext = getExtensionFromType(file?.type);
    const filename = `image_${Date.now()}.${ext}`;
    return new File([file], filename, { type: file?.type || "image/png" });
  };

  const setImageFromFile = (type, file) => {
    if (!file) return;
    const normalizedFile = ensureFileName(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (type === "start") {
        setStartImage(normalizedFile);
        setStartImagePreview(event.target.result);
      } else {
        setEndImage(normalizedFile);
        setEndImagePreview(event.target.result);
      }
    };
    reader.readAsDataURL(normalizedFile);
  };

  const handleImageUpload = (type, e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFromFile(type, file);
    }
  };

  const handleDrop = (type, e) => {
    e.preventDefault();
    const file = Array.from(e.dataTransfer.files || []).find((item) =>
      item.type?.startsWith("image/"),
    );
    if (file) {
      setImageFromFile(type, file);
    }
  };

  const handlePaste = (type, e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type?.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (file) {
      setImageFromFile(type, file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("プロンプトを入力してください");
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      if (startImage) {
        formData.append("start_image", startImage);
      }
      if (endImage) {
        formData.append("end_image", endImage);
      }
      if (clipTitle.trim()) {
        formData.append("title", clipTitle.trim());
      }

      const response = await authFetch(`${API_URL}/api/generate`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      onGenerateClip({
        id: result.scene_id,
        clipId: result.scene_id,
        title: clipTitle.trim() || `Video Clip ${result.scene_id}`,
        startImagePreview,
        endImagePreview,
        firstFrameUrl: null,
        lastFrameUrl: null,
        prompt,
        jobId: result.job_id,
        status: "generating",
        videoUrl: null,
      });

      // Clear the form
      setClipTitle("");
      setStartImage(null);
      setStartImagePreview(null);
      setEndImage(null);
      setEndImagePreview(null);
      setPrompt("");
    } catch (error) {
      console.error("Generate error:", error);
      alert(`エラー: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setClipTitle("");
    setStartImage(null);
    setStartImagePreview(null);
    setEndImage(null);
    setEndImagePreview(null);
    setPrompt("");
  };

  return (
    <div className="clip-palette">
      <h2 className="palette-title">VIDEO CLIP PALETTE</h2>

      <div className="palette-content">
        <div className="clip-title-section">
          <label className="input-label">VIDEO CLIP TITLE (optional)</label>
          <input
            type="text"
            value={clipTitle}
            onChange={(e) => setClipTitle(e.target.value)}
            placeholder="Enter video clip title..."
            className="clip-title-input"
          />
        </div>

        <div className="image-upload-section">
          <div className="upload-box">
            <label className="upload-label">STARTING IMAGE</label>
            <div
              className="upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop("start", e)}
              onPaste={(e) => handlePaste("start", e)}
            >
              {startImagePreview ? (
                <img
                  src={startImagePreview}
                  alt="Starting"
                  className="preview-image"
                />
              ) : (
                <div className="upload-placeholder">UPLOAD ZONE</div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload("start", e)}
              className="file-input"
            />
          </div>

          <div className="upload-box">
            <label className="upload-label">ENDING IMAGE</label>
            <div
              className="upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop("end", e)}
              onPaste={(e) => handlePaste("end", e)}
            >
              {endImagePreview ? (
                <img
                  src={endImagePreview}
                  alt="Ending"
                  className="preview-image"
                />
              ) : (
                <div className="upload-placeholder">UPLOAD ZONE</div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload("end", e)}
              className="file-input"
            />
          </div>
        </div>

        <div className="prompt-section">
          <label className="prompt-label">PROMPT:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Describe the transition (e.g., "The sun rises and a city emerges from the night")...'
            className="prompt-textarea"
          />
        </div>

        <div className="palette-actions">
          <button
            className="btn btn-generate"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "GENERATING..." : "GENERATE VIDEO CLIP"}
          </button>
          <button className="btn btn-clear" onClick={handleClear}>
            CLEAR
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoClipPalette;
