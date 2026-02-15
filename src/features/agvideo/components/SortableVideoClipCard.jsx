import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import VideoClipCard from "./VideoClipCard";

function SortableVideoClipCard({ clip, clipNumber, isSelected, onSelect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  const handleClick = (e) => {
    // ドラッグハンドルやビデオボタンのクリックは無視
    if (e.target.closest(".drag-handle") || e.target.closest("button") || e.target.closest("video")) {
      return;
    }
    onSelect?.(clip.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-clip-card ${isDragging ? "dragging" : ""} ${isSelected ? "selected" : ""}`}
      onClick={handleClick}
    >
      <div className="drag-handle" {...attributes} {...listeners}>
        <span className="drag-handle-icon">⋮⋮</span>
      </div>
      <div className="clip-card-wrapper">
        <VideoClipCard clip={clip} clipNumber={clipNumber} />
      </div>
      {isSelected && <div className="selection-indicator">✓</div>}
    </div>
  );
}

export default SortableVideoClipCard;
