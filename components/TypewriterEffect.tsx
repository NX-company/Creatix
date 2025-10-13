'use client'

import { useState, useEffect } from 'react'

interface TypewriterEffectProps {
  texts: string[]
  speed?: number
  deleteSpeed?: number
  pauseTime?: number
}

export default function TypewriterEffect({ 
  texts, 
  speed = 80, 
  deleteSpeed = 50, 
  pauseTime = 2000 
}: TypewriterEffectProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (texts.length === 0) return

    const currentText = texts[currentIndex]

    if (isPaused) {
      const pauseTimeout = setTimeout(() => {
        setIsPaused(false)
        setIsDeleting(true)
      }, pauseTime)
      return () => clearTimeout(pauseTimeout)
    }

    if (!isDeleting && displayText === currentText) {
      setIsPaused(true)
      return
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false)
      setCurrentIndex((prev) => (prev + 1) % texts.length)
      return
    }

    const timeout = setTimeout(() => {
      if (isDeleting) {
        setDisplayText(currentText.substring(0, displayText.length - 1))
      } else {
        setDisplayText(currentText.substring(0, displayText.length + 1))
      }
    }, isDeleting ? deleteSpeed : speed)

    return () => clearTimeout(timeout)
  }, [displayText, currentIndex, isDeleting, isPaused, texts, speed, deleteSpeed, pauseTime])

  return (
    <span className="font-medium">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

