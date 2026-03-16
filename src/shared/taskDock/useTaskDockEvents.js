import { useEffect } from 'react'

export const TASK_DOCK_EVENT_NAME = 'task-dock:event'

export function useTaskDockEvents(handlers) {
  const {
    enqueueTask,
    upsertByDedupeKey,
    markDone,
    dismissTask,
    openDock,
  } = handlers

  useEffect(() => {
    const onTaskDockEvent = (event) => {
      const payload = event?.detail
      if (!payload || typeof payload !== 'object') {
        return
      }

      switch (payload.type) {
        case 'enqueue':
          enqueueTask(payload.task ?? {})
          break
        case 'upsert':
          upsertByDedupeKey(payload.task ?? {})
          break
        case 'markDone':
          if (payload.taskId) {
            markDone(payload.taskId)
          }
          break
        case 'dismiss':
          if (payload.taskId) {
            dismissTask(payload.taskId)
          }
          break
        case 'openDock':
          openDock()
          break
        default:
          break
      }
    }

    window.addEventListener(TASK_DOCK_EVENT_NAME, onTaskDockEvent)
    return () => {
      window.removeEventListener(TASK_DOCK_EVENT_NAME, onTaskDockEvent)
    }
  }, [dismissTask, enqueueTask, markDone, openDock, upsertByDedupeKey])
}

export function emitTaskDockEvent(detail) {
  window.dispatchEvent(new CustomEvent(TASK_DOCK_EVENT_NAME, { detail }))
}
