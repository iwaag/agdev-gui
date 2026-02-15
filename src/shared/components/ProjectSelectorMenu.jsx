import { useCallback, useEffect, useState } from 'react'
import { authFetch } from '../../api/authFetch'
import { useBackground } from '../contexts/BackgroundContext'

const AGCORE_URL = import.meta.env.VITE_AGCORE_API_URL || 'http://localhost:8000'
const USER_CONFIG_GET_URL = `${AGCORE_URL}/user/config/get`
const USER_CONFIG_SET_URL = `${AGCORE_URL}/user/config/set`
const BACKGROUND_DOWNLOAD_URL = `${AGCORE_URL}/project/default_bg/get`

function ProjectSelectorMenu({ className = '', onProjectChange, initialProjectId = '' }) {
  const { setBackgroundFromBlob, clearBackground } = useBackground()
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const applyProjectBackground = useCallback(async (projectId) => {
    if (!projectId) {
      clearBackground()
      return
    }

    try {
      const response = await authFetch(`${BACKGROUND_DOWNLOAD_URL}?project_id=${projectId}`)
      if (!response.ok) {
        clearBackground()
        return
      }

      const downloadPresignedUrl = (await response.text()).trim()
      if (!downloadPresignedUrl) {
        clearBackground()
        return
      }

      const downloadResponse = await fetch(downloadPresignedUrl)
      if (!downloadResponse.ok) {
        throw new Error(`Failed to download background image: ${downloadResponse.status}`)
      }
      const blob = await downloadResponse.blob()
      setBackgroundFromBlob(blob)
    } catch (e) {
      console.error('Failed to apply project background:', e)
      clearBackground()
    }
  }, [clearBackground, setBackgroundFromBlob])

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [projectRes, configRes] = await Promise.all([
          authFetch(`${AGCORE_URL}/project/list`),
          authFetch(USER_CONFIG_GET_URL),
        ])
        if (!projectRes.ok) throw new Error(`HTTP error! status: ${projectRes.status}`)
        const response = await projectRes.json()
        const configResponse = configRes.ok ? await configRes.json() : {}
        const defaultProjectId = `${configResponse?.default_project_id ?? ''}`
        const nextProjects = (response.projects ?? []).map((element) => ({
          id: `${element.id}`,
          title: element.title || 'Untitled project',
        }))
        setProjects(nextProjects)

        if (nextProjects.length === 0) {
          setSelectedProjectId('')
          clearBackground()
          return
        }

        if (nextProjects.some((project) => project.id === initialProjectId)) {
          setSelectedProjectId(initialProjectId)
          onProjectChange?.(nextProjects.find((project) => project.id === initialProjectId))
          void applyProjectBackground(initialProjectId)
          return
        }

        const hasDefault = nextProjects.some((project) => project.id === defaultProjectId)
        if (hasDefault) {
          setSelectedProjectId(defaultProjectId)
          onProjectChange?.(nextProjects.find((project) => project.id === defaultProjectId))
          void applyProjectBackground(defaultProjectId)
          return
        }

        const nextSelectedId = nextProjects[0].id
        setSelectedProjectId(nextSelectedId)
        onProjectChange?.(nextProjects.find((project) => project.id === nextSelectedId))
        void applyProjectBackground(nextSelectedId)
      } catch (e) {
        console.error('Failed to load projects:', e)
        setError('Failed to load projects')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [applyProjectBackground, clearBackground, initialProjectId, onProjectChange])

  const persistDefaultProjectId = async (projectId) => {
    try {
      const response = await authFetch(USER_CONFIG_SET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          default_project_id: projectId || null,
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (e) {
      console.error('Failed to save user config:', e)
    }
  }

  const handleProjectChange = (event) => {
    const nextId = event.target.value
    setSelectedProjectId(nextId)
    const selectedProject = projects.find((project) => project.id === nextId) || null
    onProjectChange?.(selectedProject)
    void persistDefaultProjectId(nextId)
    void applyProjectBackground(nextId)
  }

  return (
    <div className={`project-selector-menu ${className}`.trim()}>
      <label className="project-selector-menu__label" htmlFor="project-selector">
        Project
      </label>
      <select
        id="project-selector"
        className="project-selector-menu__select"
        value={selectedProjectId}
        onChange={handleProjectChange}
        disabled={isLoading || projects.length === 0}
      >
        {projects.length === 0 ? (
          <option value="">
            {isLoading ? 'Loading projects...' : 'No projects'}
          </option>
        ) : (
          projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title} ({project.id})
            </option>
          ))
        )}
      </select>
      {error ? <p className="project-selector-menu__error">{error}</p> : null}
    </div>
  )
}

export default ProjectSelectorMenu
