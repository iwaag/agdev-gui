import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { authFetch } from '../../../api/authFetch'

const AGCODE_URL = import.meta.env.VITE_AGCODE_API_URL || 'http://localhost:8000'

function AGCodeSessionPage() {
  const maxSessionCount = 1

  const { selectedProject } = useOutletContext()
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
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

        <section className="agcore-dashboard__main">
          {selectedSession ? (
            <div className="agcore-dashboard__settings">
              <div>
                <h2 className="agcore-dashboard__settings-title">
                  {selectedSession.title}
                </h2>
                <p className="agcore-dashboard__settings-subtitle">
                  {selectedSession.id}
                </p>
              </div>
            </div>
          ) : null}
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
