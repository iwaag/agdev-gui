import { useState } from 'react'

const initialTasks = [
  {
    id: 'TASK-128',
    title: 'Auth token refresh flow',
    status: 'In Progress',
    summary: 'Implement refresh retry handling for long-running code generation jobs.',
    nextAction: 'Add retry with backoff and session-expired UI state.',
  },
  {
    id: 'TASK-214',
    title: 'Sandbox execution timeout handling',
    status: 'Todo',
    summary: 'Normalize timeout error responses and show actionable messages.',
    nextAction: 'Map backend timeout codes to UI retry guidance.',
  },
  {
    id: 'TASK-301',
    title: 'Code diff rendering performance',
    status: 'Todo',
    summary: 'Improve rendering responsiveness for large patch previews.',
    nextAction: 'Virtualize long diffs and defer syntax highlighting.',
  },
  {
    id: 'TASK-356',
    title: 'Prompt preset versioning',
    status: 'Done',
    summary: 'Add versioning support for saved prompt presets.',
    nextAction: 'Add schema migration on load for legacy presets.',
  },
]

function AGCodeDashboardPage() {
  const [selectedTaskId, setSelectedTaskId] = useState(initialTasks[0]?.id ?? null)

  const selectedTask =
    initialTasks.find((task) => task.id === selectedTaskId) ?? initialTasks[0]

  return (
    <div className="agcore-dashboard">
      <aside className="agcore-dashboard__sidebar">
        <div className="agcore-dashboard__header">
          <div>
            <h1 className="agcore-dashboard__title">Task List</h1>
            <p className="agcore-dashboard__subtitle">
              AGCode work items
            </p>
          </div>
        </div>

        <div className="agcore-dashboard__project-list">
          {initialTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              className="agcore-dashboard__project"
              onClick={() => setSelectedTaskId(task.id)}
              aria-pressed={selectedTaskId === task.id}
            >
              <span className="agcore-dashboard__project-title">
                {task.title}
              </span>
              <span className="agcore-dashboard__project-id">
                {task.id} / Status: {task.status}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="agcore-dashboard__main">
        <div className="agcore-dashboard__settings">
          <div>
            <h2 className="agcore-dashboard__settings-title">
              {selectedTask?.title ?? 'Task'}
            </h2>
            <p className="agcore-dashboard__settings-subtitle">
              {selectedTask?.id} / Status: {selectedTask?.status}
            </p>
          </div>

          <div className="agcore-dashboard__field">
            <span className="agcore-dashboard__label">Summary</span>
            <div className="agcore-dashboard__input">
              {selectedTask?.summary}
            </div>
          </div>

          <div className="agcore-dashboard__field">
            <span className="agcore-dashboard__label">Next action</span>
            <div className="agcore-dashboard__input">
              {selectedTask?.nextAction}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AGCodeDashboardPage
