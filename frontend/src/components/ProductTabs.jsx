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
      <div className='p-8 md:p-12'>
        {activeTabData && (
          <div className='max-w-5xl mx-auto'>
            {activeTabData.content.map((paragraph, index) => (
              <p
                key={index}
                className='text-[14px] md:text-[15px] text-[#475569] leading-relaxed mb-6 font-medium text-center'
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
