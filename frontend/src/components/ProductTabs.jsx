import { useState } from 'react'

export default function ProductTabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')

  const activeTabData = tabs.find((tab) => tab.id === activeTab)

  return (
    <div className='w-full mt-6 bg-[#F8F8F8] border border-[#CACACA] rounded-[14px] font-jakarta overflow-hidden'>
      {/* Tab Navigation */}
      <nav className='flex space-x-8 md:space-x-12 justify-center border-b border-[#CACACA] px-4'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-5 font-semibold text-[15px] transition-colors relative ${activeTab === tab.id
                ? 'text-[#000000]'
                : 'text-[#797979] hover:text-[#000000]'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className='absolute bottom-0 left-0 w-full h-[3px] bg-[#F6B72D] rounded-t-sm'></div>
            )}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className='p-4 sm:p-6 md:p-8'>
        {activeTabData && (
          <div className='max-w-5xl mx-auto rounded-xl border border-[#E5E7EB] bg-white p-5 md:p-7'>
            <h2 className='text-sm md:text-base font-bold text-[#111827] mb-4 pb-3 border-b border-gray-100'>
              {activeTabData.label}
            </h2>
            {activeTabData.content.every((item) => item && typeof item === 'object' && 'label' in item) ? (
              <div className='grid sm:grid-cols-2 gap-3'>
                {activeTabData.content.map((item) => (
                  <div key={item.label} className='rounded-lg border border-gray-100 bg-[#FAFAF9] p-4'>
                    <p className='text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1'>{item.label}</p>
                    <p className='text-sm text-[#475569] leading-relaxed break-words text-justify'>{item.value ?? 'N/A'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className='space-y-4'>
                {activeTabData.content.map((paragraph, index) => (
                  <p
                    key={index}
                    className='text-[14px] md:text-[15px] text-[#475569] leading-7 font-medium text-justify'
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
