import './styles.css'
import MessageList from './MessageList'

function ChatThread({ title = 'Conversation Log', messages = [] }) {
  return (
    <section className="chat-thread">
      <div className="chat-thread__header">
        <div>
          <h2 className="chat-thread__title">{title}</h2>
          <p className="chat-thread__subtitle">AI × Human chat trace</p>
        </div>
        <span className="chat-thread__meta">{messages.length} messages</span>
      </div>
      <MessageList messages={messages} />
    </section>
  )
}

export default ChatThread
