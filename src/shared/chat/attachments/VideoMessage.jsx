function VideoMessage({ content }) {
  if (!content?.src) {
    return <div className="chat-media chat-media--placeholder">Video preview</div>
  }

  return (
    <div className="chat-media">
      <video controls src={content.src} />
      {content.caption ? (
        <p className="chat-media__caption">{content.caption}</p>
      ) : null}
    </div>
  )
}

export default VideoMessage
