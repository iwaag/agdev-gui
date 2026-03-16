import { useNavigate } from 'react-router-dom'

function TaskCard({ task, onMarkDone, onDismiss }) {
  const navigate = useNavigate()
  const isTodo = task.status === 'todo'
  const statusLabel = task.displayStatus ?? task.status

  const handleCardClick = () => {
    if (task.route) {
      navigate(task.route)
    }
  }

  const handleCardKeyDown = (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && task.route) {
      event.preventDefault()
      navigate(task.route)
    }
  }

  return (
    <article
      className={`task-dock-card${task.route ? ' is-clickable' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={task.route ? 'button' : undefined}
      tabIndex={task.route ? 0 : undefined}
    >
      <div className="task-dock-card__header">
        <h4 className="task-dock-card__title">{task.title}</h4>
        <span className={`task-dock-card__status task-dock-card__status--${task.status}`}>
          {statusLabel}
        </span>
      </div>
      {task.summary ? <p className="task-dock-card__summary">{task.summary}</p> : null}
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
        {task.route ? <span className="task-dock-card__route">open</span> : null}
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
