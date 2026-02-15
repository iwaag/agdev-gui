import MessageBubble from './MessageBubble'

function MessageList({ messages = [] }) {
  return (
    <div className="chat-thread__list">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id ?? `${message.role}-${message.type}-${index}`}
          message={message}
        />
      ))}
    </div>
  )
}

export default MessageList
