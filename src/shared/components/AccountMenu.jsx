import { useEffect, useRef, useState } from 'react'
import { useKeycloak } from '@react-keycloak/web'

function AccountMenu() {
  const { keycloak } = useKeycloak()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current || containerRef.current.contains(event.target)) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    const redirectUri = `${window.location.origin}/login`
    keycloak.logout({ redirectUri })
  }

  return (
    <div className="account-menu" ref={containerRef}>
      <button
        className="account-button"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Account
        <span className="account-caret" aria-hidden="true">
          v
        </span>
      </button>
      {open && (
        <div className="account-dropdown" role="menu">
          <button className="account-item" type="button" onClick={handleLogout} role="menuitem">
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default AccountMenu
