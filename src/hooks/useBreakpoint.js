import { useState, useEffect } from 'react'

// Breakpoints
// mobile:         < 640px
// tablet-portrait: 640px – 899px  → bottom nav
// tablet-landscape + desktop: ≥ 900px → top header
const MOBILE_MAX  = 639
const TABLET_MAX  = 899

function getBreakpoint(w) {
  if (w <= MOBILE_MAX)  return 'mobile'
  if (w <= TABLET_MAX)  return 'tablet'
  return 'desktop'
}

export function useBreakpoint() {
  const [bp, setBp] = useState(() => getBreakpoint(window.innerWidth))
  const [w,  setW]  = useState(() => window.innerWidth)

  useEffect(() => {
    const handler = () => {
      const width = window.innerWidth
      setW(width)
      setBp(getBreakpoint(width))
    }
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])

  return {
    bp,
    width: w,
    isMobile:  bp === 'mobile',
    isTablet:  bp === 'tablet',
    isDesktop: bp === 'desktop',
    // true when bottom nav should be shown
    useBottomNav: bp === 'mobile' || bp === 'tablet',
  }
}
