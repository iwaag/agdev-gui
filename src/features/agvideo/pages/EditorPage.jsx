import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  addClipToVideoSequence,
  createVideoSequence,
  downloadConcatenatedVideoSequence,
  fetchVideoSequence,
  removeClipFromVideoSequence,
  reorderVideoSequenceClips,
} from "../../../api/videoSequences";
import { authFetch } from "../../../api/authFetch";
import VideoClipPalette from "../components/VideoClipPalette";
import Storyboard from "../components/Storyboard";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

function EditorPage() {
  const location = useLocation();
  const [videoSequenceId, setVideoSequenceId] = useState(null);
  const [videoSequenceTitle, setVideoSequenceTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [videoClips, setVideoClips] = useState([]);
  const [, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // 既存VideoSequenceをGalleryから開いた場合、ロードする
  useEffect(() => {
    const loadVideoSequence = async () => {
      const passedVideoSequenceId = location.state?.videoSequenceId;
      if (passedVideoSequenceId) {
        const videoSequence = await fetchVideoSequence(passedVideoSequenceId);
        if (videoSequence) {
          setVideoSequenceId(videoSequence.id);
          setVideoSequenceTitle(videoSequence.title);
          // clipsを復元
          if (videoSequence.clips && videoSequence.clips.length > 0) {
            const loadedClips = videoSequence.clips.map((clip) => ({
              id: clip.scene_id,
              clipId: clip.scene_id,
              title: clip.title,
              startImagePreview: null,
              endImagePreview: null,
              firstFrameUrl: clip.first_frame_url || null,
              lastFrameUrl: clip.last_frame_url || null,
              prompt: clip.prompt || "",
              jobId: null,
              status: clip.status === "succeeded" ? "completed" : clip.status,
              videoUrl: clip.video_url || null,
            }));
            setVideoClips(loadedClips);
          }
        }
      }
    };
    loadVideoSequence();
  }, [location.state?.videoSequenceId]);

  const handleGenerateClip = async (newClip) => {
    // 新しいクリップを追加
    setVideoClips((prev) => [...prev, newClip]);

    // VideoSequenceがまだ無ければ作成
    let currentVideoSequenceId = videoSequenceId;
    if (!currentVideoSequenceId) {
      try {
        const title = videoSequenceTitle || "Untitled Video Sequence";
        const result = await createVideoSequence(title);
        currentVideoSequenceId = result.project_id;
        setVideoSequenceId(currentVideoSequenceId);
        if (!videoSequenceTitle) {
          setVideoSequenceTitle(title);
        }
        showSaveStatus("Video sequence created");
      } catch (error) {
        console.error("Failed to create video sequence:", error);
      }
    }

    // scene_idが返ってきたらVideoSequenceに追加
    if (currentVideoSequenceId && newClip.clipId) {
      try {
        await addClipToVideoSequence(currentVideoSequenceId, newClip.clipId);
        showSaveStatus("Video clip added to sequence");
      } catch (error) {
        console.error("Failed to add clip to video sequence:", error);
      }
    }
  };

  const handleTitleChange = (e) => {
    setVideoSequenceTitle(e.target.value);
  };

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (videoSequenceId && videoSequenceTitle) {
      await saveVideoSequenceTitle();
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  const saveVideoSequenceTitle = async () => {
    if (!videoSequenceId) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", videoSequenceTitle);

      const response = await authFetch(
        `${API_URL}/api/projects/${videoSequenceId}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      if (response.ok) {
        showSaveStatus("Title saved");
      }
    } catch (error) {
      console.error("Failed to save title:", error);
      showSaveStatus("Save failed", true);
    } finally {
      setIsSaving(false);
    }
  };

  const showSaveStatus = (message, isError = false) => {
    setSaveStatus({ message, isError });
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const extractFilename = (contentDisposition) => {
    if (!contentDisposition) return null;
    const match = contentDisposition.match(/filename=\"?([^\"]+)\"?/);
    return match ? match[1] : null;
  };

  const handleFinalizeVideoSequence = async () => {
    if (!videoSequenceId) {
      showSaveStatus("Video sequence is not created yet", true);
      return;
    }
    if (videoClips.length === 0) {
      showSaveStatus("No video clips to finalize", true);
      return;
    }
    if (isFinalizing) return;

    setIsFinalizing(true);
    showSaveStatus("Finalizing...", false);

    try {
      const response = await downloadConcatenatedVideoSequence({
        videoSequenceId,
        startIndex: 0,
        endIndex: videoClips.length - 1,
      });

      if (!response.ok) {
        const errorText = await response.text();
        showSaveStatus(`Finalize failed: ${errorText}`, true);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename =
        extractFilename(contentDisposition) ||
        `finalized_${videoSequenceId}.mp4`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSaveStatus("Final video downloaded");
    } catch (error) {
      console.error("Failed to finalize video sequence:", error);
      showSaveStatus("Finalize failed", true);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleCreateNewVideoSequence = async () => {
    const title = videoSequenceTitle || "Untitled Video Sequence";
    try {
      const result = await createVideoSequence(title);
      setVideoSequenceId(result.project_id);
      setVideoSequenceTitle(title);
      setVideoClips([]);
      showSaveStatus("New video sequence created");
    } catch (error) {
      console.error("Failed to create video sequence:", error);
      showSaveStatus("Failed to create video sequence", true);
    }
  };

  const handleReorderClips = async (oldIndex, newIndex) => {
    // Optimistic update
    const newClips = [...videoClips];
    const [movedClip] = newClips.splice(oldIndex, 1);
    newClips.splice(newIndex, 0, movedClip);
    setVideoClips(newClips);

    // Sync with backend
    if (videoSequenceId) {
      try {
        const clipIds = newClips.map((clip) => clip.clipId || clip.id);
        await reorderVideoSequenceClips(videoSequenceId, clipIds);
        showSaveStatus("Video clips reordered");
      } catch (error) {
        console.error("Failed to reorder video clips:", error);
        // Revert on failure
        setVideoClips(videoClips);
        showSaveStatus("Failed to reorder", true);
      }
    }
  };

  const handleDeleteClips = async (clipIdsToDelete) => {
    if (!clipIdsToDelete || clipIdsToDelete.length === 0) return;

    const clipsToDelete = videoClips.filter(
      (clip) => clipIdsToDelete.includes(clip.id) || clipIdsToDelete.includes(clip.clipId)
    );
    if (clipsToDelete.length === 0) return;

    // Optimistic update
    const previousClips = [...videoClips];
    const newClips = videoClips.filter(
      (clip) =>
        !clipIdsToDelete.includes(clip.id) && !clipIdsToDelete.includes(clip.clipId),
    );
    setVideoClips(newClips);

    // Sync with backend
    if (videoSequenceId) {
      try {
        for (const clip of clipsToDelete) {
          const clipId = clip.clipId || clip.id;
          await removeClipFromVideoSequence(videoSequenceId, clipId);
        }
        showSaveStatus(`${clipsToDelete.length} video clip(s) deleted`);
      } catch (error) {
        console.error("Failed to delete video clips:", error);
        // Revert on failure
        setVideoClips(previousClips);
        showSaveStatus("Failed to delete", true);
      }
    }
  };

  return (
    <div className="editor-page">
      <div className="editor-header">
        <div className="editor-title-section">
          {isEditingTitle ? (
            <input
              type="text"
              value={videoSequenceTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="editor-title-input"
              placeholder="Enter video sequence title..."
              autoFocus
            />
          ) : (
            <h1
              className="editor-title"
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit title"
            >
              {videoSequenceTitle || "Untitled Video Sequence"}
              <span className="edit-icon">✎</span>
            </h1>
          )}
          {videoSequenceId && (
            <span className="sequence-id-badge">{videoSequenceId}</span>
          )}
        </div>
        <div className="editor-actions">
          {saveStatus && (
            <span
              className={`save-status ${saveStatus.isError ? "error" : "success"}`}
            >
              {saveStatus.message}
            </span>
          )}
          {videoSequenceId && (
            <button
              className="btn-finalize-sequence"
              onClick={handleFinalizeVideoSequence}
              disabled={isFinalizing || videoClips.length === 0}
            >
              {isFinalizing ? "Finalizing..." : "Finalize Video Sequence"}
            </button>
          )}
          {!videoSequenceId && (
            <button
              className="btn btn-create-sequence"
              onClick={handleCreateNewVideoSequence}
            >
              Create Video Sequence
            </button>
          )}
        </div>
      </div>
      <div className="editor-container">
        <div className="editor-left-panel">
          <VideoClipPalette onGenerateClip={handleGenerateClip} />
        </div>
        <div className="editor-right-panel">
          <Storyboard
            clips={videoClips}
            storyTitle={videoSequenceTitle || "Untitled Video Sequence"}
            onReorderClips={handleReorderClips}
            onDeleteClips={handleDeleteClips}
          />
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
