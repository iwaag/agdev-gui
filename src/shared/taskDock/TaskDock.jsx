import { useState } from 'react'
import TaskCard from './TaskCard'
import { useTaskDock } from './useTaskDock'

function TaskDock() {
  const {
    isOpen,
    tasks,
    todoCount,
    doneTtlSeconds,
    toggleDock,
    closeDock,
    markDone,
    dismissTask,
    addDummyLabor,
  } = useTaskDock()
  const [isSubmittingLabor, setIsSubmittingLabor] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleAddDummyLabor = async () => {
    if (isSubmittingLabor) {
      return
    }

    setIsSubmittingLabor(true)
    setSubmitError('')

    try {
      await addDummyLabor()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add labor')
    } finally {
      setIsSubmittingLabor(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="task-dock-launcher"
        onClick={toggleDock}
        aria-expanded={isOpen}
        aria-controls="task-dock-panel"
      >
        Tasks
        <span className="task-dock-launcher__count">{todoCount}</span>
      </button>

      {isOpen ? (
        <section className="task-dock-panel" id="task-dock-panel" aria-label="Task dock">
          <header className="task-dock-panel__header">
            <div>
              <h3 className="task-dock-panel__title">Task queue</h3>
              <p className="task-dock-panel__subtitle">
                {tasks.length} items / done TTL {doneTtlSeconds > 0 ? `${doneTtlSeconds}s` : 'off'}
              </p>
            </div>
            <div className="task-dock-panel__header-actions">
              <button
                type="button"
                className="task-dock-panel__add"
                onClick={handleAddDummyLabor}
                disabled={isSubmittingLabor}
              >
                {isSubmittingLabor ? 'Sending...' : 'Add dummy labor'}
              </button>
              <button
                type="button"
                className="task-dock-panel__close"
                onClick={closeDock}
                aria-label="Close task dock"
              >
                Close
              </button>
            </div>
          </header>

          {submitError ? <p className="task-dock-panel__error">{submitError}</p> : null}

          <div className="task-dock-panel__list">
            {tasks.length === 0 ? (
              <p className="task-dock-panel__empty">No tasks in queue.</p>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} onMarkDone={markDone} onDismiss={dismissTask} />
              ))
            )}
          </div>
        </section>
      ) : null}
    </>
  )
}

export default TaskDock
