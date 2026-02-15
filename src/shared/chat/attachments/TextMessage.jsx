function TextMessage({ content }) {
  const text = typeof content === 'string' ? content : content?.text

  return <p className="chat-text">{text ?? '...'}</p>
}

export default TextMessage
