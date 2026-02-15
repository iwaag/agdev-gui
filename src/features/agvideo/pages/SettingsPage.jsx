import { useMemo, useRef, useState } from 'react'
import { useBackground } from '../../../shared/contexts/BackgroundContext'

const WORKFLOW_TYPES = ['T2V', 'I2V', 'FLF2V']

const initialFiles = [
  { id: 'default-t2v', name: 'T2V_Default.json', type: 'T2V', source: 'default' },
  { id: 'default-i2v', name: 'I2V_Default.json', type: 'I2V', source: 'default' },
  { id: 'default-flf2v', name: 'FLF2V_Default.json', type: 'FLF2V', source: 'default' },
]

const initialDefaults = {
  T2V: 'default-t2v',
  I2V: 'default-i2v',
  FLF2V: 'default-flf2v',
}

const tabs = [
  { id: 'workflows', label: 'Workflows' },
  { id: 'account', label: 'Account' },
  { id: 'storage', label: 'Storage' },
  { id: 'notifications', label: 'Notifications' },
]

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const inferType = (name) => {
  const lowered = name.toLowerCase()
  if (lowered.includes('i2v')) {
    return 'I2V'
  }
  if (lowered.includes('flf2v')) {
    return 'FLF2V'
  }
  if (lowered.includes('t2v')) {
    return 'T2V'
  }
  return 'T2V'
}

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('workflows')
  const [files, setFiles] = useState(initialFiles)
  const [defaults, setDefaults] = useState(initialDefaults)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const { backgroundUrl, setBackgroundFromUrl, clearBackground } = useBackground()
  const [draftBackgroundUrl, setDraftBackgroundUrl] = useState('')

  const defaultFiles = useMemo(() => {
    return WORKFLOW_TYPES.map((type) => {
      const fileId = defaults[type]
      const file = files.find((entry) => entry.id === fileId)
      return { type, file }
    })
  }, [defaults, files])

  const handleFilesAdded = (fileList) => {
    const incoming = Array.from(fileList || [])
    if (incoming.length === 0) {
      return
    }
    const newFiles = incoming.map((file) => ({
      id: createId(),
      name: file.name,
      type: inferType(file.name),
      source: 'uploaded',
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    handleFilesAdded(event.dataTransfer.files)
  }

  const handlePickFiles = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (event) => {
    handleFilesAdded(event.target.files)
    event.target.value = ''
  }

  const handleTypeChange = (fileId, nextType) => {
    const current = files.find((file) => file.id === fileId)
    if (!current || current.type === nextType) {
      return
    }
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              type: nextType,
            }
          : file
      )
    )
    setDefaults((prev) => {
      if (prev[current.type] !== fileId) {
        return prev
      }
      return { ...prev, [current.type]: null }
    })
  }

  const handleSetDefault = (file) => {
    setDefaults((prev) => ({ ...prev, [file.type]: file.id }))
  }

  const applyBackgroundUrl = async () => {
    const nextUrl = draftBackgroundUrl.trim()
    if (nextUrl.length === 0) {
      clearBackground()
      return
    }

    try {
      await setBackgroundFromUrl(nextUrl)
    } catch (error) {
      console.error('Failed to apply background URL:', error)
      alert('Failed to download background image from URL.')
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage ComfyUI workflows and workspace configuration.</p>
      </div>
      <div className="settings-layout">
        <aside className="settings-tabs">
          <div className="settings-tabs-label">Configuration</div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span>{tab.label}</span>
              {tab.id === 'workflows' && <span className="tab-badge">Active</span>}
            </button>
          ))}
        </aside>
        <section className="settings-content">
          {activeTab === 'workflows' ? (
            <div className="workflow-settings">
              <div className="background-settings">
                <div className="section-title">Background Image</div>
                <div className="background-row">
                  <input
                    type="text"
                    value={draftBackgroundUrl}
                    onChange={(event) => setDraftBackgroundUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        void applyBackgroundUrl()
                      }
                    }}
                    className="background-url-input"
                    placeholder="https://example.com/background.jpg"
                  />
                  <button
                    type="button"
                    className="background-action"
                    onClick={() => {
                      void applyBackgroundUrl()
                    }}
                    disabled={draftBackgroundUrl.trim().length === 0}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    className="background-action"
                    onClick={() => {
                      setDraftBackgroundUrl('')
                      clearBackground()
                    }}
                    disabled={!backgroundUrl}
                  >
                    Clear
                  </button>
                </div>
                <p className="background-help">
                  Paste a public image URL to update the app background.
                </p>
              </div>
              <div className="workflow-upload">
                <div className="section-title">Workflow Upload</div>
                <div
                  className={`workflow-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={handlePickFiles}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      handlePickFiles()
                    }
                  }}
                >
                  <div className="dropzone-content">
                    <div className="dropzone-title">Drop your ComfyUI workflow files here</div>
                    <div className="dropzone-subtitle">
                      Drag and drop .json files or select them from your device.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="dropzone-button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handlePickFiles()
                    }}
                  >
                    Select files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    multiple
                    className="workflow-file-input"
                    onChange={handleFileInputChange}
                  />
                </div>
              </div>

              <div className="workflow-lists">
                <div className="section-title">Default Workflows</div>
                <div className="default-grid">
                  {defaultFiles.map(({ type, file }) => (
                    <div key={type} className="default-card">
                      <div className="default-card-header">
                        <span className="default-type">{type}</span>
                        <span className="default-badge">Default</span>
                      </div>
                      <div className="default-card-body">
                        {file ? (
                          <>
                            <div className="default-name">{file.name}</div>
                            <div className="default-meta">{file.source === 'default' ? 'System' : 'Uploaded'}</div>
                          </>
                        ) : (
                          <div className="default-empty">No default selected</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="section-title">All Workflows</div>
                <div className="workflow-table">
                  <div className="workflow-row workflow-header">
                    <div>Name</div>
                    <div>Type</div>
                    <div>Status</div>
                    <div>Action</div>
                  </div>
                  {files.map((file) => {
                    const isDefault = defaults[file.type] === file.id
                    return (
                      <div key={file.id} className="workflow-row">
                        <div className="workflow-name">{file.name}</div>
                        <div>
                          <select
                            className="workflow-type-select"
                            value={file.type}
                            onChange={(event) => handleTypeChange(file.id, event.target.value)}
                          >
                            {WORKFLOW_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={`workflow-status ${isDefault ? 'is-default' : ''}`}>
                          {isDefault ? 'Default' : file.source === 'default' ? 'System' : 'Custom'}
                        </div>
                        <div>
                          <button
                            type="button"
                            className="workflow-action"
                            onClick={() => handleSetDefault(file)}
                            disabled={isDefault}
                          >
                            {isDefault ? 'Selected' : 'Set default'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="settings-placeholder">
              <div className="section-title">{tabs.find((tab) => tab.id === activeTab)?.label}</div>
              <p>Coming soon...</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default SettingsPage
