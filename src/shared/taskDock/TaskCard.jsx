import { useNavigate } from 'react-router-dom'

function TaskCard({ task, onMarkDone, onDismiss }) {
  const navigate = useNavigate()
  const isTodo = task.status === 'todo'
  const statusLabel = task.displayStatus ?? task.status
  const isClickable = Boolean(task.redirectUrl || task.route)
  const hintEntries = Object.entries(task.hints ?? {}).filter(
    ([key, value]) => key && typeof value === 'string' && value.length > 0
  )

  const handleCardClick = () => {
    if (task.redirectUrl) {
      window.open(task.redirectUrl, '_blank', 'noopener,noreferrer')
      return
    }

    if (task.route) {
      navigate(task.route)
    }
  }

  const handleCardKeyDown = (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && isClickable) {
      event.preventDefault()
      handleCardClick()
    }
  }

  return (
    <article
      className={`task-dock-card${isClickable ? ' is-clickable' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div className="task-dock-card__header">
        <h4 className="task-dock-card__title">{task.title}</h4>
        <span className={`task-dock-card__status task-dock-card__status--${task.status}`}>
          {statusLabel}
        </span>
      </div>
      {task.summary ? <p className="task-dock-card__summary">{task.summary}</p> : null}
      {hintEntries.length > 0 ? (
        <dl className="task-dock-card__hints">
          {hintEntries.map(([label, value]) => (
            <div key={label} className="task-dock-card__hint">
              <dt className="task-dock-card__hint-label">{label}</dt>
              <dd className="task-dock-card__hint-value">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {task.redirectUrl ? (
        <div className="task-dock-card__url-block">
          <span className="task-dock-card__url-label">Redirect URL</span>
          <a
            className="task-dock-card__url"
            href={task.redirectUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            {task.redirectUrl}
          </a>
        </div>
      ) : null}
      <div className="task-dock-card__meta">
        <span className="task-dock-card__source">{task.source}</span>
        {isClickable ? <span className="task-dock-card__route">open</span> : null}
      </div>
      <div className="task-dock-card__actions">
        {isTodo ? (
          <button
            type="button"
            className="task-dock-card__action task-dock-card__action--done"
            onClick={(event) => {
              event.stopPropagation()
              onMarkDone(task.id)
            }}
          >
            Mark done
          </button>
        ) : null}
        <button
          type="button"
          className="task-dock-card__action task-dock-card__action--dismiss"
          onClick={(event) => {
            event.stopPropagation()
            onDismiss(task.id)
          }}
        >
          Dismiss
        </button>
      </div>
    </article>
  )
}

export default TaskCard
