import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Collapsible dashboard sidebar.
 * Shows icons-only when collapsed, expands to show labels on hover.
 */
export function DashboardSidebar({
  items,
  onItemClick,
  className,
  expanded = true,
  isMobile = false,
}) {
  const location = useLocation()
  const navigate = useNavigate()

  const widthClass = expanded || isMobile ? 'w-64 lg:w-64' : 'w-16 lg:w-16'

  return (
    <aside
      className={cn(
        'h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out',
        widthClass,
        className,
      )}
    >
      {/* Logo Section */}
      <div className='pt-12 flex items-center justify-center'>
        {expanded || isMobile ? (
          <img src='/images/logo.svg' alt='Logo' className='h-10 w-auto' />
        ) : (
          <div className='h-10 w-10 rounded-full bg-[#F6B72D] text-black font-bold flex items-center justify-center text-sm'>
            TCI
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          'flex-1 py-6 space-y-3 font-exo transition-all duration-300',
          expanded || isMobile ? 'px-4' : 'px-2',
        )}
      >
        {items?.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href

          return (
            <Button
              key={item.label}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full gap-3 h-10 px-3 transition-all duration-200',
                expanded || isMobile ? 'justify-start' : 'justify-center',
                isActive
                  ? 'bg-[#F6B72D] hover:bg-yellow-500 font-bold'
                  : 'hover:bg-gray-100',
              )}
              onClick={() => {
                navigate(item.href)
                if (onItemClick) onItemClick(item)
              }}
            >
              <Icon className='h-4 w-4 shrink-0' />
              {(expanded || isMobile) && (
                <span className='text-sm'>{item.label}</span>
              )}
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}
