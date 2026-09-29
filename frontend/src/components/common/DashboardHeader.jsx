import { Bell, Menu, MessagesSquare, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import NotificationBell from '@/components/NotificationBell'
import { Link } from 'react-router-dom'
import { URLS } from '@/config/urls'

export function DashboardHeader({
  title,
  userInitials = '',
  userImage,
  userName,
  userEmail,
  onLogoutClick,
  onMenuClick,
}) {
  return (
    <header className='flex items-center justify-between px-4 lg:px-6 py-4 bg-white border-b border-gray-200 shadow-md'>
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          className='lg:hidden'
          onClick={onMenuClick}
        >
          <Menu className='h-5 w-5 text-gray-600' />
        </Button>

        <h1 className='text-sm lg:text-lg font-semibold text-gray-900 tracking-wide'>
          {title}
        </h1>
      </div>

      <div className='flex items-center gap-2 lg:gap-3'>
        {/* <Button variant='ghost' size='icon'> */}
        <Link to={URLS.chat} className='relative'>
          <MessagesSquare className='h-6 w-6 fill-black stroke-[#F6B72D]' />
        </Link>
        {/* </Button> */}

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild className='bg-white'>
            <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
              <Avatar className='h-8 w-8'>
                <AvatarImage
                  src={userImage || '/placeholder.svg'}
                  alt={userName || 'User'}
                />
                <AvatarFallback className='bg-gray-100 text-gray-600'>
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {/* <ChevronDown className='h-4 w-4' /> */}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-56 z-10 bg-white border border-gray-200 rounded-md shadow-md font-exo'
            align='end'
            forceMount
          >
            <DropdownMenuLabel className='font-exo'>
              <div className='flex flex-col space-y-1'>
                {userName && (
                  <p className='text-sm font-medium leading-none text-gray-900'>
                    {userName}
                  </p>
                )}
                <p className='text-xs leading-none text-muted-foreground'>
                  {userEmail || 'user@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogoutClick}>
              <LogOut className='mr-2 h-4 w-4' />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
