import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const isCore = location.pathname.startsWith('/agcore')
  const currentProduct = isCore ? 'AGCore' : 'AGVideo'
  const navItems = isCore
    ? [
        { to: '/agcore', label: 'Dashboard', icon: '▦', end: true },
        { to: '/agcore/brain-mining', label: 'Brain Mining', icon: '💎' },
      ]
    : [
        { to: '/agvideo', label: 'Dashboard', icon: '▦', end: true },
        { to: '/agvideo/gallery', label: 'Gallery', icon: '◫' },
        { to: '/agvideo/clip-assets', label: 'Clip Assets', icon: '📁' },
        { to: '/agvideo/settings', label: 'Settings', icon: '⚙' },
      ]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (target) => {
    setIsMenuOpen(false)
    if (target === 'agvideo') {
      navigate('/agvideo')
      return
    }
    navigate('/agcore')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" ref={menuRef}>
        <span className="logo-icon">✦</span>
        <button
          className="product-switcher"
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
        >
          <span className="logo-text">{currentProduct}</span>
          <span className="product-caret">▾</span>
        </button>
        {isMenuOpen ? (
          <div className="product-menu" role="menu">
            <button className="product-item" type="button" role="menuitem" onClick={() => handleSelect('agcore')}>
              <span className="product-name">AGCore</span>
              <span className="product-desc">Core operations</span>
            </button>
            <button className="product-item" type="button" role="menuitem" onClick={() => handleSelect('agvideo')}>
              <span className="product-name">AGVideo</span>
              <span className="product-desc">Video creation suite</span>
            </button>
            
          </div>
        ) : null}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
