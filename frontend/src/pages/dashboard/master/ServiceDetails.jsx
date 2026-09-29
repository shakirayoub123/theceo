import TabNavigation from '@/components/common/TabNavigation'
import { DataTable } from '@/components/DataTable'
import { Input } from '@/components/ui/input'
import {
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  ImageIcon,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import authService from '@/services/authService'
import { getAssetUrl } from '@/lib/utils'

const ServiceDetails = () => {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [openIndex, setOpenIndex] = useState(null)
  const [search, setSearch] = useState('')
  const [serviceData, setServiceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trainers, setTrainers] = useState([])
  const [enrollments, setEnrollments] = useState([])

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'enrollments', label: 'Enrollments' },
  ]

  // Fetch service data and trainers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch trainers
        const trainersData = await authService.getTrainers()
        setTrainers(trainersData || [])

        // Fetch service data
        const data = await authService.getServiceDetails(id)
        setServiceData(data)
        // Format enrollments data
        const formattedEnrollments = (data.enrollments || []).map(
          (enrollment) => ({
            ...enrollment,
            joinedOn: new Date(enrollment.joinedOn).toLocaleDateString(),
          }),
        )
        setEnrollments(formattedEnrollments)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  const enrollmentColumns = [
    { key: 'name', label: 'Client Name' },
    { key: 'joinedOn', label: 'Joined On' },
    { key: 'status', label: 'Status' },
  ]

  const enrollmentActions = [
    {
      label: 'View',
      onClick: (row) => console.log('View enrollment:', row),
    },
  ]
  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-8 tracking-wide'>
        Service details
      </h2>
      {loading ? (
        <div className='flex justify-center items-center min-h-[400px]'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900'></div>
        </div>
      ) : serviceData ? (
        <div className='font-exo'>
          <div className='flex justify-between items-center mb-8'>
            <h2 className='text-xl '>{serviceData.title}</h2>
            <span
              className={`text-xs px-3 py-1 rounded-md mt-4 md:mt-0 md:mr-4 ${
                serviceData.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              {serviceData.status}
            </span>
          </div>

          <div className='flex items-center mb-4'>
            {serviceData.assignedAdvisors &&
            serviceData.assignedAdvisors.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {serviceData.assignedAdvisors.map((advisorId) => {
                  const advisor = trainers.find(
                    (t) => t.id.toString() === advisorId.toString(),
                  )
                  return advisor ? (
                    <div key={advisorId} className='flex items-center'>
                      <div className='w-8 h-8 bg-[#F6B72D] rounded-full flex items-center justify-center text-white font-semibold text-sm'>
                        {advisor.name.charAt(0).toUpperCase()}
                      </div>
                      <span className='ml-2 text-sm text-gray-600'>
                        {advisor.name}
                      </span>
                    </div>
                  ) : null
                })}
              </div>
            ) : (
              <span className='text-sm text-gray-500'>
                No advisors assigned
              </span>
            )}
          </div>
        </div>
      ) : null}

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'overview' && serviceData && (
        <div>
          {/* Featured Image */}
          {serviceData.featuredImage && (
            <div className='border-2 border-[#F6B72D] p-6 rounded-lg my-4 bg-white'>
              <h3 className='text-lg font-semibold mb-3'>Featured Image</h3>
              <div className='w-32 h-32 border border-gray-300 rounded overflow-hidden'>
                <img
                  src={getAssetUrl(serviceData.featuredImage)}
                  alt='Featured image'
                  className='w-full h-full object-cover'
                />
              </div>
            </div>
          )}

          {/* Intro Video */}
          {serviceData.introVideo && (
            <div className='border-2 border-[#F6B72D] p-6 rounded-lg my-4 bg-white'>
              <h3 className='text-lg font-semibold mb-3'>Intro Video</h3>
              <video
                controls
                src={getAssetUrl(serviceData.introVideo)}
                className='w-full max-w-3xl rounded-lg bg-black'
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Description */}
          <div className='border-2 border-[#F6B72D] p-6 rounded-lg my-4 bg-white'>
            <h3 className='text-lg font-semibold mb-3'>Description</h3>
            <p className='text-lg font-exo'>
              {serviceData.description || 'No description available.'}
            </p>
            {serviceData.shortDescription && (
              <p className='text-sm text-gray-600 mt-2'>
                <strong>Short Description:</strong>{' '}
                {serviceData.shortDescription}
              </p>
            )}
          </div>

          {/* Course Curriculum */}
          <div className='border-2 border-[#F6B72D] p-4 rounded-lg bg-white'>
            <h3 className='text-lg font-semibold mb-3'>Course Curriculum</h3>
            {serviceData.chapters && serviceData.chapters.length > 0 ? (
              serviceData.chapters.map((chapter, i) => (
                <div key={chapter.id} className='py-3 font-exo'>
                  <div className='flex justify-between items-start'>
                    <div className='flex items-start'>
                      <p className='text-md font-bold'>Week {chapter.week}</p>
                      <div className='ml-2'>
                        <p className='text-lg font-bold'>{chapter.title}</p>
                        {openIndex === i && chapter.description && (
                          <p className='text-sm mt-1'>{chapter.description}</p>
                        )}
                        {chapter.files && chapter.files.length > 0 && (
                          <div className='mt-2'>
                            <span className='text-sm font-medium text-gray-700'>
                              Files:
                            </span>
                            {chapter.files.map((file) => (
                              <div
                                key={file.id}
                                className='flex items-center gap-2 mt-1'
                              >
                                <FileText className='w-4 h-4 text-red-500' />
                                <span className='text-sm text-gray-700'>
                                  {file.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setOpenIndex(openIndex === i ? null : i)}
                      className='text-xs flex items-center'
                    >
                      <span className='text-black opacity-60'>
                        Uploaded on {chapter.uploadDate}
                      </span>
                      {openIndex === i ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-gray-500'>No chapters available.</p>
            )}
          </div>

          {/* Files */}
          {serviceData.files && serviceData.files.length > 0 && (
            <div className='border-2 border-[#F6B72D] p-4 rounded-lg bg-white mt-4'>
              <h3 className='text-lg font-semibold mb-3'>Service Files</h3>
              <div className='space-y-2'>
                {serviceData.files.map((file) => (
                  <div
                    key={file.id}
                    className='flex items-center justify-between p-2 bg-gray-50 rounded border'
                  >
                    <div className='flex items-center gap-2'>
                      <FileText className='w-4 h-4 text-gray-500' />
                      <div>
                        <span className='text-sm font-medium text-gray-700'>
                          {file.title}
                        </span>
                        <span className='text-xs text-gray-500 ml-2'>
                          ({(file.fileSize / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <a
                        href={getAssetUrl(file.fileUrl)}
                        download={file.title}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-500 hover:text-blue-700 text-sm'
                      >
                        Download
                      </a>
                      {file.isDownloadable && (
                        <a
                          href={getAssetUrl(file.fileUrl)}
                          download
                          className='text-green-500 hover:text-green-700 text-sm'
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'enrollments' && (
        <div>
          <div className='relative max-w-full lg:max-w-[40%] mt-2 bg-white mb-3'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5' />
            <Input
              placeholder='Search'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 border-2 border-[#F6B72D] rounded-lg shadow-sm w-full font-exo'
            />
          </div>
          <DataTable
            title='Enrollments'
            data={enrollments}
            columns={enrollmentColumns}
            actions={enrollmentActions}
            search={search}
          />
        </div>
      )}
    </div>
  )
}

export default ServiceDetails
