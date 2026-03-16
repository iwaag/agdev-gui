import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { authFetch } from '../../../api/authFetch'
import { ChatThread } from '../../../shared/chat'

const AGCODE_URL = import.meta.env.VITE_AGCODE_API_URL || 'http://localhost:8000'
const AGCODE_SIDE_URL =
  import.meta.env.VITE_AGCODE_SIDE_API_URL || 'http://localhost:11003'
const previewImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0%" stop-color="%23212a3a"/><stop offset="100%" stop-color="%232b3b4f"/></linearGradient></defs><rect width="480" height="270" fill="url(%23g)"/><circle cx="360" cy="90" r="60" fill="%235b7fff"/><rect x="40" y="150" width="400" height="80" rx="12" fill="%23131a24"/><text x="60" y="200" fill="%23bcd1ff" font-size="22" font-family="Arial">Vision Snapshot</text></svg>'
const previewMessages = [
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
      src: previewImage,
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

function AGCodeSessionPage() {
  const maxSessionCount = 1

  const { selectedProject } = useOutletContext()
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [hostToken, setHostToken] = useState('')
  const [tunnelName, setTunnelName] = useState('')
  const [tunnelStatus, setTunnelStatus] = useState('')
  const [isSubmittingTunnelSetup, setIsSubmittingTunnelSetup] = useState(false)
  const hasReachedSessionLimit = sessions.length >= maxSessionCount

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? sessions[0] ?? null

  const loadSessions = async (projectId, options = {}) => {
    const { shouldAbort } = options

    if (!projectId) {
      setSessions([])
      setSelectedSessionId(null)
      setIsLoading(false)
      setError('')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await authFetch(
        `${AGCODE_URL}/session/list?project_id=${encodeURIComponent(projectId)}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const nextSessions = (result.sessions ?? []).map((session) => ({
        id: `${session.session_id}`,
        title: session.title?.trim() || '(untitled)',
      }))

      if (shouldAbort?.()) {
        return
      }

      setSessions(nextSessions)
      setSelectedSessionId((currentSelectedSessionId) => {
        if (
          currentSelectedSessionId &&
          nextSessions.some((session) => session.id === currentSelectedSessionId)
        ) {
          return currentSelectedSessionId
        }

        return nextSessions[0]?.id ?? null
      })
    } catch (fetchError) {
      if (shouldAbort?.()) {
        return
      }

      console.error('Failed to load sessions:', fetchError)
      setSessions([])
      setSelectedSessionId(null)
      setError('Failed to load sessions')
    } finally {
      if (!shouldAbort?.()) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    const projectId = selectedProject?.id

    if (!projectId) {
      setSessions([])
      setSelectedSessionId(null)
      setIsLoading(false)
      setError('')
      return
    }

    let isCancelled = false
    void loadSessions(projectId, { shouldAbort: () => isCancelled })

    return () => {
      isCancelled = true
    }
  }, [selectedProject])

  const handleOpenCreateDialog = () => {
    if (hasReachedSessionLimit) {
      return
    }

    setDraftTitle('')
    setIsCreateDialogOpen(true)
  }

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false)
  }

  const handleBeginSession = async (event) => {
    event.preventDefault()

    const projectId = selectedProject?.id

    if (!projectId || hasReachedSessionLimit) {
      return
    }

    try {
      const response = await authFetch(
        `${AGCODE_URL}/session/new?project_id=${encodeURIComponent(projectId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_id: projectId,
            title: draftTitle.trim(),
            instruction: '',
            agent_deployments: [],
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Created session:', result)
      setIsCreateDialogOpen(false)
      await loadSessions(projectId)
    } catch (createError) {
      console.error('Failed to create session:', createError)
      setError('Failed to create session')
    }
  }

  const extractTunnelName = (payload) => {
    if (!payload || typeof payload !== 'object') {
      return ''
    }

    const directCandidates = [
      payload.tunnel_name,
      payload.tunnelName,
      payload.name,
      payload.tunnel,
      payload.id,
    ]
    const directMatch = directCandidates.find(
      (value) => typeof value === 'string' && value.trim()
    )

    if (directMatch) {
      return directMatch.trim()
    }

    if (payload.data && typeof payload.data === 'object') {
      const nestedCandidates = [
        payload.data.tunnel_name,
        payload.data.tunnelName,
        payload.data.name,
      ]
      const nestedMatch = nestedCandidates.find(
        (value) => typeof value === 'string' && value.trim()
      )
      if (nestedMatch) {
        return nestedMatch.trim()
      }
    }

    return ''
  }

  const handleSetupTunnel = async (event) => {
    event.preventDefault()

    const trimmedToken = hostToken.trim()

    if (!trimmedToken) {
      setTunnelStatus('Host token is required.')
      return
    }

    setIsSubmittingTunnelSetup(true)
    setTunnelStatus('')
    setTunnelName('')

    try {
      const tunnelResponse = await fetch(`${AGCODE_SIDE_URL}/start-tunnel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tunnel_name: 'test',
          host_token: trimmedToken,
        }),
      })

      if (!tunnelResponse.ok) {
        throw new Error(`start-tunnel failed: ${tunnelResponse.status}`)
      }

      const tunnelPayload = await tunnelResponse.json().catch(() => null)
      const nextTunnelName = extractTunnelName(tunnelPayload)

      setTunnelName(nextTunnelName || 'test')
      setTunnelStatus('Tunnel started.')
    } catch (setupError) {
      console.error('Failed to start tunnel:', setupError)
      setTunnelStatus('Failed to start tunnel.')
    } finally {
      setIsSubmittingTunnelSetup(false)
    }
  }

  return (
    <>
      <div className="agcore-dashboard">
        <aside className="agcore-dashboard__sidebar">
          <div className="agcore-dashboard__header">
            <div>
              <h1 className="agcore-dashboard__title">Session List</h1>
              <p className="agcore-dashboard__subtitle">AGCode sessions</p>
            </div>
            <button
              type="button"
              className="agcore-dashboard__add-button"
              disabled={!selectedProject || hasReachedSessionLimit}
              onClick={handleOpenCreateDialog}
            >
              + New Session
            </button>
          </div>

          <div className="agcore-dashboard__project-list">
            {!selectedProject ? (
              <p className="agcore-dashboard__subtitle">Select a project</p>
            ) : null}
            {isLoading ? (
              <p className="agcore-dashboard__subtitle">Loading sessions...</p>
            ) : null}
            {error ? (
              <p className="agcore-dashboard__subtitle">{error}</p>
            ) : null}
            {!isLoading && !error && selectedProject && sessions.length === 0 ? (
              <p className="agcore-dashboard__subtitle">No sessions</p>
            ) : null}
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className="agcore-dashboard__project"
                onClick={() => setSelectedSessionId(session.id)}
                aria-pressed={selectedSessionId === session.id}
              >
                <span className="agcore-dashboard__project-title">
                  {session.title}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section
          className={`agcore-dashboard__main${selectedSession ? ' agcore-dashboard__main--chat' : ''}`}
        >
          <form className="agcode-tunnel-bar" onSubmit={handleSetupTunnel}>
            <label className="agcode-tunnel-bar__label" htmlFor="host-token">
              Host token
            </label>
            <input
              id="host-token"
              className="agcode-tunnel-bar__input"
              type="password"
              value={hostToken}
              onChange={(event) => setHostToken(event.target.value)}
              placeholder="Paste token"
              autoComplete="off"
            />
            <button
              type="submit"
              className="agcode-tunnel-bar__button"
              disabled={isSubmittingTunnelSetup}
            >
              {isSubmittingTunnelSetup ? 'Sending...' : 'Send + Start Tunnel'}
            </button>
            <div className="agcode-tunnel-bar__result" title={tunnelName || '-'}>
              {tunnelName || '-'}
            </div>
            {tunnelStatus ? (
              <p className="agcode-tunnel-bar__status">{tunnelStatus}</p>
            ) : null}
          </form>

          {selectedSession ? (
            <ChatThread title={selectedSession.title} messages={previewMessages} />
          ) : (
            <p className="agcore-dashboard__subtitle">Select a session</p>
          )}
        </section>
      </div>

      {isCreateDialogOpen ? (
        <div
          className="agcode-session-dialog-backdrop"
          role="presentation"
          onClick={handleCloseCreateDialog}
        >
          <div
            className="agcode-session-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-session-title"
            onClick={(event) => event.stopPropagation()}
          >
            <form onSubmit={handleBeginSession}>
              <div className="agcode-session-dialog__header">
                <div>
                  <h2
                    id="create-session-title"
                    className="agcore-dashboard__settings-title"
                  >
                    Create Session
                  </h2>
                  <p className="agcore-dashboard__subtitle">
                    Set the initial title for the session.
                  </p>
                </div>
              </div>

              <div className="agcode-session-dialog__body">
                <div className="agcore-dashboard__field">
                  <label className="agcore-dashboard__label" htmlFor="session-title">
                    Title
                  </label>
                  <input
                    id="session-title"
                    className="agcore-dashboard__input"
                    type="text"
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    placeholder="Session title"
                  />
                </div>
              </div>

              <div className="agcore-dashboard__actions">
                <button
                  type="button"
                  className="agcore-dashboard__button agcore-dashboard__button--ghost"
                  onClick={handleCloseCreateDialog}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="agcore-dashboard__button agcore-dashboard__button--primary"
                >
                  Begin
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default AGCodeSessionPage
