'use client'

import { useState, useEffect } from 'react'

interface LogoProps {
  className?: string
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Logo({ className = '', style = {}, size = 'md' }: LogoProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-10',
    xl: 'h-12'
  }

  const handleError = () => {
    console.log('❌ Logo image failed to load, using fallback')
    setImageError(true)
    setIsLoading(false)
  }

  const handleLoad = () => {
    console.log('✅ Logo image loaded successfully')
    setImageError(false)
    setIsLoading(false)
  }

  // Встроенный SVG логотип как fallback
  const InlineLogo = () => (
    <svg 
      width="120" 
      height="36" 
      viewBox="0 0 120 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses[size]} w-auto ${className}`}
      style={style}
    >
      <defs>
        <linearGradient id="cGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B9D" stopOpacity="1" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="cGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8A5B" stopOpacity="1" />
          <stop offset="100%" stopColor="#FF6B9D" stopOpacity="1" />
        </linearGradient>
      </defs>
      
      {/* Буква C - вертикальная часть */}
      <rect x="6" y="4" width="8" height="28" rx="4" fill="url(#cGradient)" />
      
      {/* Буква C - горизонтальная часть */}
      <rect x="6" y="4" width="20" height="8" rx="4" fill="url(#cGradient2)" />
      
      {/* Текст Creatix */}
      <text x="36" y="22" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="white">Creatix</text>
    </svg>
  )

  // Если ошибка загрузки, показываем встроенный логотип
  if (imageError) {
    return <InlineLogo />
  }

  return (
    <>
      <img 
        src="/creatix-logo.svg" 
        alt="Creatix" 
        className={`${sizeClasses[size]} w-auto brightness-110 ${className}`}
        style={{ 
          filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15))',
          ...style 
        }}
        onError={handleError}
        onLoad={handleLoad}
      />
      {isLoading && (
        <div className={`${sizeClasses[size]} w-auto flex items-center justify-center ${className}`} style={style}>
          <div className="animate-pulse bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg px-4 py-2">
            <span className="text-white font-bold text-sm">Creatix</span>
          </div>
        </div>
      )}
    </>
  )
}
