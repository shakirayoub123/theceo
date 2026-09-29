import { Helmet } from 'react-helmet-async'

export default function UnderConstruction() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col items-center justify-center px-6 py-12'>
      <Helmet>
        <title>We&apos;ll Be Back Soon</title>
      </Helmet>

      <div className='w-full max-w-3xl text-center space-y-8'>
        <div className='inline-flex items-center gap-3 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-semibold tracking-wide'>
          <span className='h-2 w-2 rounded-full bg-amber-400 animate-pulse' />
          Scheduled maintenance in progress
        </div>

        <div className='space-y-4'>
          <h1 className='text-4xl md:text-5xl font-bold tracking-tight'>
            We&apos;re polishing the experience
          </h1>
          <p className='text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed'>
            The site is temporarily unavailable while we finish some upgrades.
            Please check back shortly. We appreciate your patience and
            can&apos;t wait to show you what we&apos;ve been building.
          </p>
        </div>

        <div className='flex items-center justify-center gap-4 text-sm text-slate-200/80'>
          <div className='h-10 w-10 rounded-full border border-white/20 bg-white/5 backdrop-blur flex items-center justify-center'>
            🚧
          </div>
          <div className='text-left'>
            <p className='font-semibold text-white'>Site Under Construction</p>
            <p>All routes are temporarily paused</p>
          </div>
        </div>
      </div>
    </div>
  )
}
