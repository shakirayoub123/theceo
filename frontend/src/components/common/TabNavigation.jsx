import clsx from 'clsx'

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className,
}) {
  return (
    <div className={clsx('mb-8', className)}>
      <nav className='flex space-x-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
