import Image from 'next/image'
import Link from 'next/link'
import { memo } from 'react'

const Logo = memo(() => {
  return (
    <Link
      href="/"
      className="flex items-center select-none hover:opacity-80 transition-opacity duration-200"
      prefetch={false}
    >
      <Image
        src="/logo.png"
        alt="nova-tv Logo"
        width={32}
        height={32}
        className="h-9 w-auto"
        priority
        style={{
          imageRendering: '-webkit-optimize-contrast',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      />
    </Link>
  )
})

Logo.displayName = 'Logo'

export default Logo
