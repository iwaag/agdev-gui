import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const BackgroundContext = createContext(null)

function BackgroundProvider({ children }) {
  const [backgroundUrl, setBackgroundUrl] = useState(null)
  const objectUrlRef = useRef(null)

  const replaceBackgroundUrl = useCallback((nextUrl) => {
    const previousObjectUrl = objectUrlRef.current
    objectUrlRef.current = nextUrl
    setBackgroundUrl(nextUrl)
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl)
    }
  }, [])

  const clearBackground = useCallback(() => {
    replaceBackgroundUrl(null)
  }, [replaceBackgroundUrl])

  const setBackgroundFromBlob = useCallback(
    (blob) => {
      if (!(blob instanceof Blob)) {
        throw new Error('setBackgroundFromBlob expects a Blob or File')
      }
      const objectUrl = URL.createObjectURL(blob)
      replaceBackgroundUrl(objectUrl)
      return objectUrl
    },
    [replaceBackgroundUrl]
  )

  const setBackgroundFromUrl = useCallback(
    async (url) => {
      const trimmed = typeof url === 'string' ? url.trim() : ''
      if (trimmed.length === 0) {
        clearBackground()
        return null
      }

      const response = await fetch(trimmed)
      if (!response.ok) {
        throw new Error(`Failed to download background image: ${response.status}`)
      }
      const blob = await response.blob()
      return setBackgroundFromBlob(blob)
    },
    [clearBackground, setBackgroundFromBlob]
  )

  const setBackground = useCallback(
    async (source) => {
      if (!source) {
        clearBackground()
        return null
      }
      if (source instanceof Blob) {
        return setBackgroundFromBlob(source)
      }
      if (typeof source === 'string') {
        return setBackgroundFromUrl(source)
      }
      throw new Error('setBackground expects a URL string, Blob, File, or null')
    },
    [clearBackground, setBackgroundFromBlob, setBackgroundFromUrl]
  )

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const value = useMemo(
    () => ({
      backgroundUrl,
      setBackground,
      setBackgroundFromBlob,
      setBackgroundFromUrl,
      clearBackground,
      // Backward compatibility for existing callers.
      setBackgroundUrl: setBackground,
    }),
    [backgroundUrl, clearBackground, setBackground, setBackgroundFromBlob, setBackgroundFromUrl]
  )

  return <BackgroundContext.Provider value={value}>{children}</BackgroundContext.Provider>
}

function useBackground() {
  const context = useContext(BackgroundContext)
  if (!context) {
    throw new Error('useBackground must be used within BackgroundProvider')
  }
  return context
}

export { BackgroundProvider, useBackground }
