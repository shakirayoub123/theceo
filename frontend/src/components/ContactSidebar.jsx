import { Mail, Linkedin } from 'lucide-react'

export default function ContactSidebar({ contactInfo, title }) {
  const socialTarget =
    typeof navigator !== 'undefined' &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent)
      ? '_self'
      : '_blank'

  return (
    <div className='bg-[#F8F8F8] rounded-lg p-6 border-2 border-[#F6B72D]'>
      <h3 className='text-xl font-bold mb-6 font-sans'>
        {title ? title : 'CONTACT'}
      </h3>
      <div className='space-y-4 font-exo'>
        {contactInfo.email ? (
            <div className='flex items-center gap-3'>
              <Mail className='h-5 w-5 text-gray-600' />
              <span className='text-sm'>{contactInfo.email}</span>
            </div>
        ) : null}
        <div className='flex items-center gap-4'>
          {contactInfo.socialMedia.linkedin && (
            <a
              href={contactInfo.socialMedia.linkedin}
              target={socialTarget}
              rel='noopener noreferrer'
              className='text-gray-600 hover:text-[#F6B72D]'
            >
              <Linkedin className='h-5 w-5' />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
