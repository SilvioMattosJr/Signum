import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeCtx = createContext()
const KEY = 'signum_theme'
const COLOR_KEY = 'signum_primary_color'
const DEFAULT_COLOR = '#00d4ff'

function hexToRgba(hex, alpha) {
  if (!hex) return 'transparent'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(KEY) || 'dark'
    } catch (e) {
      return 'dark'
    }
  })

  const [primaryColor, setPrimaryColorState] = useState(() => {
    try {
      return localStorage.getItem(COLOR_KEY) || DEFAULT_COLOR
    } catch (e) {
      return DEFAULT_COLOR
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(KEY, theme)
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    const color = primaryColor
    
    // Update base color
    root.style.setProperty('--cyan', color)
    
    // Update derived variants
    root.style.setProperty('--cyan-dim', hexToRgba(color, 0.16))
    root.style.setProperty('--cyan-glow', hexToRgba(color, 0.35))
    root.style.setProperty('--cyan-border', hexToRgba(color, 0.28))
    root.style.setProperty('--cyan-border-strong', hexToRgba(color, 0.55))
    
    // Update shadows (complex variables)
    root.style.setProperty('--shadow-cyan', `0 6px 30px ${hexToRgba(color, 0.14)}, 0 0 0 1px ${hexToRgba(color, 0.18)}, inset 0 1px 0 ${hexToRgba(color, 0.08)}`)
    root.style.setProperty('--shadow-cyan-hover', `0 10px 40px ${hexToRgba(color, 0.25)}, 0 0 0 1px ${hexToRgba(color, 0.32)}`)
    
    // Update other specific components
    root.style.setProperty('--header-border', hexToRgba(color, 0.10))
    root.style.setProperty('--dropdown-border', hexToRgba(color, 0.22))
    root.style.setProperty('--dropdown-hover', hexToRgba(color, 0.08))
    root.style.setProperty('--input-focus', hexToRgba(color, 0.05))

    // Gradients and Backgrounds
    root.style.setProperty('--bg-grad-1', hexToRgba(color, 0.10))
    root.style.setProperty('--bg-grad-2', hexToRgba(color, 0.07)) // Could be a complementary color, but let's stick to chosen for simplicity
    root.style.setProperty('--bg-grad-3', hexToRgba(color, 0.05))
    root.style.setProperty('--bg-grid', hexToRgba(color, 0.018))
    root.style.setProperty('--glass-3', hexToRgba(color, 0.07))
    
    // Update select arrow color
    const encodedColor = color.replace('#', '%23')
    const selectSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodedColor}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`
    root.style.setProperty('--select-arrow', selectSvg)

    // Generate Button
    root.style.setProperty('--gen-btn-valid-bg', `linear-gradient(135deg, ${hexToRgba(color, 0.26)}, ${hexToRgba(color, 0.20)})`)
    root.style.setProperty('--gen-btn-valid-border', hexToRgba(color, 0.52))
    root.style.setProperty('--gen-btn-valid-shadow', `0 6px 30px ${hexToRgba(color, 0.22)}, inset 0 1px 0 rgba(255, 255, 255, .1)`)
    
    // Update browser favicon
    const updateFavicon = (newColor) => {
      const favicon = document.querySelector('link[rel="icon"]')
      if (favicon) {
        // Encode color (replace # with %23)
        const encodedColor = newColor.replace('#', '%23')
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodedColor}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='8' y='2' width='8' height='4' rx='1'/><path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/><path d='M12 11h4'/><path d='M12 16h4'/><path d='M8 11h.01'/><path d='M8 16h.01'/></svg>`
        favicon.href = `data:image/svg+xml,${svg}`
      }
    }
    updateFavicon(color)
    
    localStorage.setItem(COLOR_KEY, color)
  }, [primaryColor])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  const updatePrimaryColor = useCallback((color) => {
    setPrimaryColorState(color)
  }, [])

  const resetPrimaryColor = useCallback(() => {
    setPrimaryColorState(DEFAULT_COLOR)
  }, [])

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    primaryColor,
    updatePrimaryColor,
    resetPrimaryColor,
    DEFAULT_COLOR
  }
}

export function ThemeProvider({ children }) {
  const theme = useTheme()
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>
}

export const useThemeCtx = () => {
  const c = useContext(ThemeCtx)
  if (!c) throw new Error('useThemeCtx outside ThemeProvider')
  return c
}
