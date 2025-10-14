'use client'

interface SimpleLogoProps {
  className?: string
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function SimpleLogo({ className = '', style = {}, size = 'md' }: SimpleLogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-10',
    xl: 'h-12'
  }

  return (
    <div className={`${sizeClasses[size]} w-auto flex items-center ${className}`} style={style}>
      <div className="flex items-center gap-2">
        {/* Буква C */}
        <div className="relative">
          <div className="w-6 h-8 bg-gradient-to-b from-pink-500 to-purple-600 rounded-l-lg"></div>
          <div className="absolute top-0 left-0 w-8 h-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-t-lg"></div>
        </div>
        
        {/* Текст */}
        <span className="text-white font-bold text-lg">Creatix</span>
      </div>
    </div>
  )
}
