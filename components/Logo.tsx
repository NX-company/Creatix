interface LogoProps {
  className?: string
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Logo({ className = '', style = {}, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-10',
    xl: 'h-12'
  }

  return (
    <svg 
      width="120" 
      height="36" 
      viewBox="0 0 120 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses[size]} w-auto ${className}`}
      style={{
        filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15))',
        ...style
      }}
    >
      <defs>
        <linearGradient id={`logo-gradient-${size}-1`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B9D" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`logo-gradient-${size}-2`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8A5B" />
          <stop offset="100%" stopColor="#FF6B9D" />
        </linearGradient>
      </defs>
      
      <rect x="6" y="4" width="8" height="28" rx="4" fill={`url(#logo-gradient-${size}-1)`} />
      <rect x="6" y="4" width="20" height="8" rx="4" fill={`url(#logo-gradient-${size}-2)`} />
      <text x="36" y="22" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="white">Creatix</text>
    </svg>
  )
}
