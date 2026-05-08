import { useState, useEffect, memo } from 'react'

/**
 * OptimizedInput
 * Uses local state for immediate feedback and debounces the global update.
 * This prevents the entire app from re-rendering on every single keystroke.
 */
const OptimizedInput = memo(function OptimizedInput({ 
  value, 
  onChange, 
  className, 
  type = 'text', 
  placeholder,
  debounceMs = 300,
  isTextArea = false,
  ...props 
}) {
  const [localValue, setLocalValue] = useState(value)

  // Update local value if prop changes (e.g. from a reset or external load)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (localValue === value) return

    const timer = setTimeout(() => {
      onChange(localValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, onChange, value, debounceMs])

  const Component = isTextArea ? 'textarea' : 'input'

  return (
    <Component
      {...props}
      type={type}
      className={className}
      placeholder={placeholder}
      value={localValue || ''}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={() => {
        if (localValue !== value) {
          onChange(localValue)
        }
      }}
    />
  )
})

export default OptimizedInput
