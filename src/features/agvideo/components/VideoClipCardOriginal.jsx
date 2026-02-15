import { useEffect, useState } from "react";
import { authFetch } from "../../../api/authFetch";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

function VideoClipCardOriginal({ clip, clipNumber }) {
  const [videoStatus, setVideoStatus] = useState(clip.status);
  const [videoUrl, setVideoUrl] = useState(clip.videoUrl);
  const [startImageUrl, setStartImageUrl] = useState(
    clip.firstFrameUrl || clip.startImagePreview,
  );
  const [endImageUrl, setEndImageUrl] = useState(
    clip.lastFrameUrl || clip.endImagePreview,
  );

  useEffect(() => {
    setStartImageUrl(clip.firstFrameUrl || clip.startImagePreview);
    setEndImageUrl(clip.lastFrameUrl || clip.endImagePreview);
  }, [
    clip.firstFrameUrl,
    clip.lastFrameUrl,
    clip.startImagePreview,
    clip.endImagePreview,
  ]);

  useEffect(() => {
    if (clip.status === "generating" && clip.clipId) {
      // Poll for video status
      const pollInterval = setInterval(async () => {
        try {
          const response = await authFetch(`${API_URL}/api/status/${clip.clipId}`);
          if (!response.ok) throw new Error("Status check failed");

          const result = await response.json();

          if (result.status === "completed") {
            clearInterval(pollInterval);

            // API returns video_url directly
            if (result.video_url) {
              setVideoUrl(result.video_url);
              setVideoStatus("completed");

              // Fetch clip data for frame images
              try {
                const clipResponse = await authFetch(
                  `${API_URL}/api/scenes/${clip.clipId}`,
                );
                const clipData = await clipResponse.json();
                if (clipResponse.ok) {
                  setStartImageUrl(
                    (prev) => clipData.first_frame_url || prev,
                  );
                  setEndImageUrl(
                    (prev) => clipData.last_frame_url || prev,
                  );
                }
              } catch (clipError) {
                console.error("Video clip fetch error:", clipError);
              }
            } else {
              console.error("No video_url in completed response");
              setVideoStatus("failed");
            }
          } else if (result.status === "failed") {
            setVideoStatus("failed");
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error("Status check error:", error);
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [clip.clipId, clip.status]);

  return (
    <div className="clip-card">
      <div className="clip-card-header">
        <div className="clip-header-left">
          <span className="clip-label">CLIP {clipNumber}</span>
          {clip.title && (
            <span className="clip-title-label">{clip.title}</span>
          )}
        </div>
        {clip.clipId && (
          <span className="job-id-label">Clip: {clip.clipId}</span>
        )}
      </div>

      <div className="clip-images">
        <div className="clip-image-box">
          <div className="clip-image-label">STARTING IMAGE</div>
          <img
            src={startImageUrl}
            alt="Starting frame"
            className="clip-image"
          />
        </div>

        <div className="clip-image-box">
          <div className="clip-image-label">ENDING IMAGE</div>
          <img src={endImageUrl} alt="Ending frame" className="clip-image" />
        </div>
      </div>

      <div className="clip-prompt">
        <div className="clip-prompt-label">PROMPT:</div>
        <div className="clip-prompt-text">{clip.prompt}</div>
      </div>

      <div className="clip-video">
        {videoStatus === "generating" && (
          <div className="video-placeholder generating">
            <div className="spinner"></div>
            <div>Generating video...</div>
          </div>
        )}
        {videoStatus === "completed" && videoUrl && (
          <video controls className="video-player">
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        {videoStatus === "failed" && (
          <div className="video-placeholder error">
            <div>Generation failed</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoClipCardOriginal;
