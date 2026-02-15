import { useNavigate } from "react-router-dom";

function VideoSequenceCard({ videoSequence }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/agvideo/editor", { state: { videoSequenceId: videoSequence.id } });
  };

  const getStatusBadge = () => {
    switch (videoSequence.status) {
      case "processing":
        return (
          <div className="sequence-status-badge processing">Processing...</div>
        );
      case "draft":
        return <div className="sequence-status-badge draft">Draft</div>;
      default:
        return null;
    }
  };

  return (
    <div className="sequence-card" onClick={handleClick}>
      <div className="sequence-thumbnail">
        {videoSequence.thumbnail ? (
          <img src={videoSequence.thumbnail} alt={videoSequence.title} />
        ) : (
          <div className="sequence-thumbnail-placeholder">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>No thumbnail</span>
          </div>
        )}
        {getStatusBadge()}
      </div>
      <div className="sequence-info">
        <h3 className="sequence-title">{videoSequence.title}</h3>
        <div className="sequence-meta">
          <span className="sequence-clips">
            {videoSequence.clipsCount} Video Clip
            {videoSequence.clipsCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

export default VideoSequenceCard;
