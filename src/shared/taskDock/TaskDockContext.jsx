import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authFetch, getAccessToken } from '../../api/authFetch'
import { useTaskDockEvents } from './useTaskDockEvents'

const DEFAULT_DONE_TTL_SECONDS = 30
const AGCORE_URL = import.meta.env.VITE_AGCORE_API_URL || 'http://localhost:8000'
const LABOR_ADD_URL = `${AGCORE_URL}/user/labor/add`
const LABOR_LIST_URL = `${AGCORE_URL}/user/labor/list`
const TaskDockContext = createContext(null)

const toIsoNow = () => new Date().toISOString()

const createTaskId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const normalizeTaskInput = (taskInput, doneTtlSeconds) => {
  const nowIso = toIsoNow()
  const status = taskInput.status === 'done' ? 'done' : 'todo'
  const displayStatus =
    typeof taskInput.displayStatus === 'string' && taskInput.displayStatus.length > 0
      ? taskInput.displayStatus
      : status
  const doneAt = status === 'done' ? taskInput.doneAt ?? nowIso : undefined
  const expiresAt =
    status === 'done'
      ? taskInput.expiresAt ??
        (doneTtlSeconds > 0
          ? new Date(Date.now() + doneTtlSeconds * 1000).toISOString()
          : undefined)
      : undefined

  return {
    id: taskInput.id ?? createTaskId(),
    title: taskInput.title ?? 'Untitled task',
    summary: taskInput.summary ?? '',
    hints: taskInput.hints && typeof taskInput.hints === 'object' ? taskInput.hints : {},
    status,
    displayStatus,
    route: taskInput.route,
    redirectUrl: taskInput.redirectUrl,
    source: taskInput.source === 'backend' ? 'backend' : 'user',
    dedupeKey: taskInput.dedupeKey,
    createdAt: taskInput.createdAt ?? nowIso,
    updatedAt: nowIso,
    doneAt,
    expiresAt,
  }
}

export function TaskDockProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [tasks, setTasks] = useState([])

  const rawDoneTtlSeconds = Number(import.meta.env.VITE_TASK_DOCK_DONE_TTL_SECONDS)
  const doneTtlSeconds = Number.isFinite(rawDoneTtlSeconds)
    ? rawDoneTtlSeconds
    : DEFAULT_DONE_TTL_SECONDS

  const openDock = useCallback(() => setIsOpen(true), [])
  const closeDock = useCallback(() => setIsOpen(false), [])
  const toggleDock = useCallback(() => setIsOpen((prev) => !prev), [])

  const enqueueTask = useCallback(
    (taskInput) => {
      const nextTask = normalizeTaskInput(taskInput, doneTtlSeconds)
      setTasks((prev) => [nextTask, ...prev])
      return nextTask.id
    },
    [doneTtlSeconds]
  )

  const upsertByDedupeKey = useCallback(
    (taskInput) => {
      const hasDedupeKey = typeof taskInput.dedupeKey === 'string' && taskInput.dedupeKey.length > 0
      if (!hasDedupeKey) {
        return enqueueTask(taskInput)
      }

      const nextTask = normalizeTaskInput(taskInput, doneTtlSeconds)
      setTasks((prev) => {
        const existingIndex = prev.findIndex((task) => task.dedupeKey === taskInput.dedupeKey)
        if (existingIndex < 0) {
          return [nextTask, ...prev]
        }

        const existingTask = prev[existingIndex]
        const mergedTask = {
          ...existingTask,
          ...nextTask,
          id: existingTask.id,
          createdAt: existingTask.createdAt,
          updatedAt: toIsoNow(),
        }

        const next = [...prev]
        next.splice(existingIndex, 1)
        return [mergedTask, ...next]
      })

      return nextTask.id
    },
    [doneTtlSeconds, enqueueTask]
  )

  const markDone = useCallback(
    (taskId) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) {
            return task
          }

          const nowIso = toIsoNow()
          return {
            ...task,
            status: 'done',
            doneAt: nowIso,
            updatedAt: nowIso,
            expiresAt:
              doneTtlSeconds > 0
                ? new Date(Date.now() + doneTtlSeconds * 1000).toISOString()
                : undefined,
          }
        })
      )
    },
    [doneTtlSeconds]
  )

  const dismissTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }, [])

  const addDummyLabor = useCallback(async () => {
    const nonce = Math.random().toString(36).slice(2, 8)
    const payload = {
      title: `Dummy labor ${nonce}`,
      description: `TaskDock generated sample payload ${new Date().toISOString()}`,
      redirect_url: `https://example.com/labor/${nonce}`,
    }

    const response = await authFetch(LABOR_ADD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Failed to add labor: ${response.status}`)
    }

    return payload
  }, [])

  const replaceTasks = useCallback(
    (taskInputs) => {
      setTasks((taskInputs ?? []).map((taskInput) => normalizeTaskInput(taskInput, doneTtlSeconds)))
    },
    [doneTtlSeconds]
  )

  const dismissExpiredDoneTasks = useCallback((now = new Date()) => {
    const nowMs = now.valueOf()
    setTasks((prev) =>
      prev.filter((task) => {
        if (task.status !== 'done' || !task.expiresAt) {
          return true
        }
        return new Date(task.expiresAt).valueOf() > nowMs
      })
    )
  }, [])

  useEffect(() => {
    if (doneTtlSeconds <= 0) {
      return undefined
    }

    const timer = setInterval(() => {
      dismissExpiredDoneTasks(new Date())
    }, 5000)

    return () => clearInterval(timer)
  }, [dismissExpiredDoneTasks, doneTtlSeconds])

  useEffect(() => {
    let isCancelled = false
    let abortController = new AbortController()

    const wait = (ms) =>
      new Promise((resolve) => {
        window.setTimeout(resolve, ms)
      })

    const mapLaborToTask = (labor) => {
      const isDone = labor?.status === 'COMPLETED' || labor?.status === 'FAILED'

      return {
        id: labor?.task_id ?? labor?.workflow_run_id,
        title: labor?.workflow_run_id || labor?.task_id || 'Labor task',
        summary: labor?.task_id ? `Task ${labor.task_id}` : '',
        hints: labor?.hints && typeof labor.hints === 'object' ? labor.hints : {},
        status: isDone ? 'done' : 'todo',
        displayStatus: labor?.status ?? (isDone ? 'done' : 'todo'),
        redirectUrl: labor?.redirect_url,
        source: 'backend',
        createdAt: labor?.created_at,
        doneAt: labor?.finished_at ?? undefined,
      }
    }

    const consumeEventStream = async () => {
      while (!isCancelled) {
        const token = await getAccessToken()
        if (!token) {
          replaceTasks([])
          await wait(5000)
          continue
        }

        abortController = new AbortController()

        try {
          const response = await fetch(LABOR_LIST_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'text/event-stream',
            },
            signal: abortController.signal,
          })

          if (!response.ok) {
            throw new Error(`Labor stream request failed: ${response.status}`)
          }

          if (!response.body) {
            throw new Error('Labor stream body is not readable')
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (!isCancelled) {
            const { value, done } = await reader.read()
            if (done) {
              break
            }
            
            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
            console.info('buffer:', buffer)
            let delimiterIndex = buffer.indexOf('\n\n')
            while (delimiterIndex >= 0) {
              const rawEvent = buffer.slice(0, delimiterIndex)
              buffer = buffer.slice(delimiterIndex + 2)

              const eventLines = rawEvent.split('\n').filter(Boolean)
              const eventName = eventLines
                .filter((line) => line.startsWith('event:'))
                .map((line) => line.slice(6).trim())
                .at(-1)
              const data = eventLines
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.slice(5).trim())
                .join('\n')

              if (eventName === 'labors' && data) {
                const payload = JSON.parse(data)
                const nextTasks = Array.isArray(payload?.items)
                  ? payload.items.map(mapLaborToTask)
                  : []

                replaceTasks(nextTasks)
              }

              delimiterIndex = buffer.indexOf('\n\n')
            }
          }
        } catch (error) {
          if (error?.name !== 'AbortError') {
            console.error('Failed to consume labor stream:', error)
            replaceTasks([])
            await wait(5000)
          }
        }
      }
    }

    void consumeEventStream()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [replaceTasks])

  const todoCount = tasks.filter((task) => task.status === 'todo').length

  useTaskDockEvents({
    enqueueTask,
    upsertByDedupeKey,
    markDone,
    dismissTask,
    openDock,
  })

  const value = useMemo(
    () => ({
      isOpen,
      tasks,
      todoCount,
      doneTtlSeconds,
      openDock,
      closeDock,
      toggleDock,
      enqueueTask,
      upsertByDedupeKey,
      addDummyLabor,
      replaceTasks,
      markDone,
      dismissTask,
      dismissExpiredDoneTasks,
    }),
    [
      closeDock,
      dismissExpiredDoneTasks,
      dismissTask,
      doneTtlSeconds,
      enqueueTask,
      isOpen,
      markDone,
      openDock,
      addDummyLabor,
      replaceTasks,
      tasks,
      todoCount,
      toggleDock,
      upsertByDedupeKey,
    ]
  )

  return <TaskDockContext.Provider value={value}>{children}</TaskDockContext.Provider>
}

export function useTaskDockContext() {
  const context = useContext(TaskDockContext)
  if (!context) {
    throw new Error('useTaskDockContext must be used within a TaskDockProvider')
  }
  return context
}
