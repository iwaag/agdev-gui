import TextMessage from './attachments/TextMessage'
import ImageMessage from './attachments/ImageMessage'
import VideoMessage from './attachments/VideoMessage'
import AudioMessage from './attachments/AudioMessage'

const attachmentMap = {
  text: TextMessage,
  image: ImageMessage,
  video: VideoMessage,
  audio: AudioMessage,
}

function MessageBubble({ message }) {
  const Attachment = attachmentMap[message.type] ?? TextMessage

  return (
    <div className={`chat-bubble chat-bubble--${message.role}`}>
      <Attachment content={message.content} />
      {message.caption ? (
        <span className="chat-bubble__caption">{message.caption}</span>
      ) : null}
    </div>
  )
}

export default MessageBubble
