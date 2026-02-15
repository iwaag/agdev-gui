import { ChatThread } from '../../../shared/chat'

const sampleImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0%" stop-color="%23212a3a"/><stop offset="100%" stop-color="%232b3b4f"/></linearGradient></defs><rect width="480" height="270" fill="url(%23g)"/><circle cx="360" cy="90" r="60" fill="%235b7fff"/><rect x="40" y="150" width="400" height="80" rx="12" fill="%23131a24"/><text x="60" y="200" fill="%23bcd1ff" font-size="22" font-family="Arial">Vision Snapshot</text></svg>'

const sampleMessages = [
  {
    id: 'm1',
    role: 'ai',
    type: 'text',
    content: {
      text: 'Idea cluster: ambient forest scene at dawn, soft fog layers, slow camera drift.',
    },
  },
  {
    id: 'm2',
    role: 'human',
    type: 'text',
    content: {
      text: 'Add a gentle pan to the right and keep the highlights warm.',
    },
  },
  {
    id: 'm3',
    role: 'ai',
    type: 'image',
    content: {
      src: sampleImage,
      alt: 'Concept preview',
      caption: 'Keyframe exploration (stylized placeholder)',
    },
  },
  {
    id: 'm4',
    role: 'human',
    type: 'audio',
    content: {
      caption: 'Ambient audio sample (placeholder)',
    },
  },
  {
    id: 'm5',
    role: 'ai',
    type: 'video',
    content: {
      caption: 'Motion preview (placeholder)',
    },
  },
]

function BrainMining() {
  return (
    <div className="brain-mining-page">
      <div className="brain-mining-grid">
        <section className="brain-mining-panel brain-mining-panel--left">
          <div>
            <h1 className="brain-mining-title">Brain Mining</h1>
            <p className="brain-mining-subtitle">
              Draft space for prompts, references, and extraction logic.
            </p>
          </div>
          <div className="brain-mining-placeholder">
            Left panel content is coming soon.
          </div>
        </section>
        <section className="brain-mining-panel brain-mining-panel--right">
          <ChatThread title="Conversation Log" messages={sampleMessages} />
        </section>
      </div>
    </div>
  )
}

export default BrainMining
