import { useState, useEffect } from 'react'
import { useBackground } from '../../../shared/contexts/BackgroundContext'
import { authFetch } from "../../../api/authFetch";
import { useTaskDock } from '../../../shared/taskDock'

const AGCORE_URL = import.meta.env.VITE_AGCORE_API_URL || "http://localhost:8000";
const BACKGROUND_UPLOAD_URL = `${AGCORE_URL}/project/default_bg/set`
const BACKGROUND_DOWNLOAD_URL = `${AGCORE_URL}/project/default_bg/get`
const initialProjects = [
]

function DashboardPage() {
  const { setBackgroundFromBlob, clearBackground } = useBackground()
  const { enqueueTask, openDock } = useTaskDock()
  const [projects, setProjects] = useState(initialProjects)
  const [projectTitle, setProjectTitle] = useState('Untitled project')
  const [backgroundFile, setBackgroundFile] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await authFetch(`${AGCORE_URL}/project/list`)
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        const response = await res.json()
        const nextProjects = (response.projects ?? []).map((element) => ({
          id: `${element.id}`,
          title: element.title,
        }))
        setProjects(nextProjects)
      } catch (e) {
        console.error("Failed to load projects:", e)
      }
    }
    fetchProjects()
  }, [])
  const handleAddProject = async () => {
    const nextIndex = projects.length + 1
    try {
      const response = await authFetch(`${AGCORE_URL}/project/new`, {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setProjects((prevProjects) => [
        ...prevProjects,
        {
          id: `${result.project_id}`,
          title: `Untitled project ${nextIndex}`,
        },
      ])
      enqueueTask({
        title: 'New project created',
        summary: `Project ${result.project_id} is ready for setup.`,
        route: '/agcore',
        source: 'user',
        dedupeKey: `project-created-${result.project_id}`,
      })
      openDock()
    } catch (error) {
      console.error("Failed to create project:", error);
      alert(`Error: ${error.message}`);
    } finally {
    }
    
  }

  const uploadBackgroundImage = async (file) => {
    if (!selectedProjectId) {
      throw new Error('No project selected')
    }
    console.log('Upload background image (stub)', {
      uploadUrl: BACKGROUND_UPLOAD_URL,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    })
    const response = await authFetch(`${BACKGROUND_UPLOAD_URL}?project_id=${selectedProjectId}`, {
      method: "POST"
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch upload URL: ${response.status}`)
    }

    const uploadPresignedUrl = (await response.text()).trim()
    const uploadResponse = await fetch(uploadPresignedUrl, {
      method: "PUT",
      body: file,
    })
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload background image: ${uploadResponse.status}`)
    }
  }
  const downloadBackgroundImage = async (projectId) => {
    if (!projectId) {
      return null
    }
    const response = await authFetch(`${BACKGROUND_DOWNLOAD_URL}?project_id=${projectId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch download URL: ${response.status}`)
    }
    const downloadPresignedUrl = (await response.text()).trim()
    if (!downloadPresignedUrl) {
      return null
    }
    const downloadResponse = await fetch(downloadPresignedUrl)
    
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download background image: ${downloadResponse.status}`)
    }
    return downloadResponse.blob()
  }

  const applyProjectBackground = async (projectId) => {
    try {
      const blob = await downloadBackgroundImage(projectId)
      if (!blob) {
        throw new Error('downloaded background image is empty')
        clearBackground()
        return
      }
      setBackgroundFromBlob(blob)
    } catch (error) {
      console.error('Failed to apply project background:', error)
      clearBackground()
    }
  }

  const handleSaveSettings = async () => {
    try {
      if (backgroundFile) {
        await uploadBackgroundImage(backgroundFile)
        setBackgroundFromBlob(backgroundFile)
      }

      console.log('Save project settings (stub)', {
        projectTitle,
        hasBackgroundFile: !!backgroundFile,
        projectId: selectedProjectId,
      })
      enqueueTask({
        title: 'Project settings saved',
        summary: projectTitle,
        route: '/agcore',
        source: 'user',
        status: 'done',
        dedupeKey: selectedProjectId ? `project-settings-${selectedProjectId}` : undefined,
      })
    } catch (error) {
      console.error('Failed to save project settings:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const handleActivateProject = async () => {
    await applyProjectBackground(selectedProjectId)
    console.log('Activate project (stub)', { projectId: selectedProjectId })
    enqueueTask({
      title: 'Project activated',
      summary: selectedProjectId ? `Project ${selectedProjectId}` : 'No project selected',
      route: '/agcore/brain-mining',
      source: 'user',
      dedupeKey: selectedProjectId ? `project-activate-${selectedProjectId}` : undefined,
    })
    openDock()
  }

  const handleSelectProject = (project) => {
    setSelectedProjectId(project.id)
    setProjectTitle(project.title || 'Untitled project')
    void applyProjectBackground(project.id)
  }

  return (
    <div className="agcore-dashboard">
      <aside className="agcore-dashboard__sidebar">
        <div className="agcore-dashboard__header">
          <div>
            <h1 className="agcore-dashboard__title">Projects</h1>
            <p className="agcore-dashboard__subtitle">
              Recent Projects（placeholder）
            </p>
          </div>
          <button
            type="button"
            className="agcore-dashboard__add-button"
            onClick={handleAddProject}
          >
            + Add
          </button>
        </div>
        <div className="agcore-dashboard__project-list">
          {projects.map((project) => (
            <button
              type="button"
              key={project.id}
              className="agcore-dashboard__project"
              onClick={() => handleSelectProject(project)}
            >
              <span className="agcore-dashboard__project-title">
                {project.title} {project.id}
              </span>
            </button>
          ))}
        </div>
      </aside>
      <section className="agcore-dashboard__main">
        <div className="agcore-dashboard__settings">
          <div>
            <h2 className="agcore-dashboard__settings-title">
              Project Settings
            </h2>
          </div>
          <div className="agcore-dashboard__field">
            <label
              className="agcore-dashboard__label"
              htmlFor="project-title"
            >
              Title
            </label>
            <input
              id="project-title"
              className="agcore-dashboard__input"
              type="text"
              value={projectTitle}
              onChange={(event) => setProjectTitle(event.target.value)}
            />
          </div>
          <div className="agcore-dashboard__field">
            <label
              className="agcore-dashboard__label"
              htmlFor="project-background"
            >
              Background image
            </label>
            <input
              id="project-background"
              className="agcore-dashboard__input"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setBackgroundFile(file)
              }}
            />
            {backgroundFile && <p>{backgroundFile.name}</p>}
          </div>
          <div className="agcore-dashboard__actions">
            <button
              type="button"
              className="agcore-dashboard__button agcore-dashboard__button--ghost"
              onClick={handleSaveSettings}
            >
              Save settings
            </button>
            <button
              type="button"
              className="agcore-dashboard__button agcore-dashboard__button--primary"
              onClick={handleActivateProject}
            >
              Activate
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
