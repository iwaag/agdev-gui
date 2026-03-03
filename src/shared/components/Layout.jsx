import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import AccountMenu from './AccountMenu'
import ProjectSelectorMenu from './ProjectSelectorMenu'
import { useBackground } from '../contexts/BackgroundContext'

function Layout() {
  const { backgroundUrl } = useBackground()
  const [selectedProject, setSelectedProject] = useState(null)

  return (
    <div
      className={`app-layout${backgroundUrl ? ' has-bg' : ''}`}
      style={
        backgroundUrl
          ? {
              backgroundImage: `url("${backgroundUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
    >
      <Sidebar />
      <div className="main-area">
        <header className="main-header">
          <div className="main-header__left">
            <ProjectSelectorMenu
              className="main-header__project-selector"
              onProjectChange={setSelectedProject}
            />
          </div>
          <div className="main-header__right">
            <AccountMenu />
          </div>
        </header>
        <main className="main-content">
          <Outlet context={{ selectedProject }} />
        </main>
      </div>
    </div>
  )
}

export default Layout
