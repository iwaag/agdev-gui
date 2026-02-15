function ImageMessage({ content }) {
  if (!content?.src) {
    return <div className="chat-media chat-media--placeholder">Image preview</div>
  }

  return (
    <figure className="chat-media">
      <img src={content.src} alt={content.alt ?? 'Attachment'} />
      {content.caption ? (
        <figcaption className="chat-media__caption">{content.caption}</figcaption>
      ) : null}
    </figure>
  )
}

export default ImageMessage
