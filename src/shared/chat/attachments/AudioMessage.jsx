function AudioMessage({ content }) {
  if (!content?.src) {
    return <div className="chat-media chat-media--placeholder">Audio preview</div>
  }

  return (
    <div className="chat-media chat-media--audio">
      <audio controls src={content.src} />
      {content.caption ? (
        <p className="chat-media__caption">{content.caption}</p>
      ) : null}
    </div>
  )
}

export default AudioMessage
