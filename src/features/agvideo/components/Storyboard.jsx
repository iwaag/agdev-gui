import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import SortableVideoClipCard from "./SortableVideoClipCard";

function Storyboard({ clips, storyTitle, onReorderClips, onDeleteClips }) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = clips.findIndex((clip) => clip.id === active.id);
      const newIndex = clips.findIndex((clip) => clip.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && onReorderClips) {
        onReorderClips(oldIndex, newIndex);
      }
    }
  };

  const handleSelect = (clipId) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clipId)) {
        newSet.delete(clipId);
      } else {
        newSet.add(clipId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0 && onDeleteClips) {
      onDeleteClips(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="storyboard">
      <div className="storyboard-header">
        <h2 className="storyboard-title">STORYBOARD: "{storyTitle}"</h2>
        {selectedIds.size > 0 && (
          <div className="selection-actions">
            <span className="selection-count">{selectedIds.size} 件選択中</span>
            <button
              type="button"
              className="btn-clear-selection"
              onClick={handleClearSelection}
            >
              選択解除
            </button>
            <button
              type="button"
              className="btn-delete-selected"
              onClick={handleDeleteSelected}
            >
              削除
            </button>
          </div>
        )}
      </div>

      <div className="storyboard-content">
        {clips.length === 0 ? (
          <div className="empty-storyboard">
            <p>ビデオクリップパレットから最初のクリップを生成してください</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={clips.map((clip) => clip.id)}
              strategy={verticalListSortingStrategy}
            >
              {clips.map((clip, index) => (
                <SortableVideoClipCard
                  key={clip.id}
                  clip={clip}
                  clipNumber={index + 1}
                  isSelected={selectedIds.has(clip.id)}
                  onSelect={handleSelect}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

export default Storyboard;
