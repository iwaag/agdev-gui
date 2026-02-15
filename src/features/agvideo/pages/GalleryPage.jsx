import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VideoSequenceCard from "../components/VideoSequenceCard";
import FilterBar from "../../../shared/components/FilterBar";
import { fetchVideoSequences } from "../../../api/videoSequences";

function GalleryPage() {
  const navigate = useNavigate();
  const [videoSequences, setVideoSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("createdAt");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadVideoSequences() {
      setLoading(true);
      const data = await fetchVideoSequences({ sortBy, status, search });
      setVideoSequences(data);
      setLoading(false);
    }
    loadVideoSequences();
  }, [sortBy, status, search]);

  const handleNewVideoSequence = () => {
    navigate("/agvideo/editor");
  };

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <div className="gallery-header-left">
          <h1 className="gallery-title">Your Gallery</h1>
          <button
            className="btn btn-new-sequence"
            onClick={handleNewVideoSequence}
          >
            + New Video Sequence
          </button>
        </div>
        <FilterBar
          sortBy={sortBy}
          onSortChange={setSortBy}
          status={status}
          onStatusChange={setStatus}
          search={search}
          onSearchChange={setSearch}
        />
      </div>

      {loading ? (
        <div className="gallery-loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="sequence-grid">
          {videoSequences.map((videoSequence) => (
            <VideoSequenceCard
              key={videoSequence.id}
              videoSequence={videoSequence}
            />
          ))}
        </div>
      )}

      {!loading && videoSequences.length === 0 && (
        <div className="gallery-empty">
          <p>No video sequences found</p>
        </div>
      )}
    </div>
  );
}

export default GalleryPage;
