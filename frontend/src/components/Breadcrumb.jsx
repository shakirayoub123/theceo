import { ChevronRight } from 'lucide-react'

export default function Breadcrumb({ items, bg }) {
  return (
    <nav className='py-4' style={{ backgroundColor: bg || '#ffff' }}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center text-sm text-gray-600 font-exo'>
          {items.map((item, index) => (
            <div key={index} className='flex items-center'>
              {item.href ? (
                <a
                  href={item.href}
                  className='hover:text-gray-800 transition-colors'
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={
                    index === items.length - 1 ? 'text-black font-medium' : ''
                  }
                >
                  {item.label}
                </span>
              )}
              {index < items.length - 1 && (
                <ChevronRight className='h-4 w-4 mx-2 text-gray-400' />
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}

