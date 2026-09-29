import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ProfileSettings = () => {
  const [form, setForm] = useState({
    name: 'John Doe',
    email: 'email@example.com',
    password: '*******',
    referral: 'https://theceoinfluencers.com/referral/FSHH1H3212',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(form.referral)
    alert('Referral link copied!')
  }

  return (
    <div>
      <h2 className='text-xl font-semibold uppercase text-gray-900 mb-8 tracking-wide'>
        Profile Settings
      </h2>

      <form className='space-y-6 font-exo'>
        <div>
          <Label className='text-sm font-medium  mb-1'>Name</Label>
          <Input
            type='text'
            name='name'
            value={form.name}
            onChange={handleChange}
            className='input-field '
          />
        </div>

        {/* Email */}
        <div>
          <Label className='text-sm font-medium  mb-1'>Email Address</Label>
          <Input
            type='email'
            name='email'
            value={form.email}
            onChange={handleChange}
            className='input-field'
          />
        </div>

        {/* Password */}
        <div>
          <div className='flex justify-between items-center mb-1'>
            <Label className='text-sm font-medium '>Password</Label>
            <button
              type='button'
              className='text-sm font-semibold text-gray-800 hover:underline'
            >
              Change password
            </button>
          </div>
          <Input
            type='password'
            name='password'
            value={form.password}
            onChange={handleChange}
            className='input-field'
          />
        </div>

        {/* Referral Link */}
        <div>
          <Label className='text-sm font-medium  mb-1'>Referral Link</Label>
          <div className='relative'>
            <Input
              type='text'
              name='referral'
              value={form.referral}
              readOnly
              className='input-field'
            />
            <button
              type='button'
              onClick={handleCopy}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black'
            >
              <Copy size={18} />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className='flex inline-flex gap-4 pt-6 font-sans'>
          <Button
            type='reset'
            className='flex-1 bg-black text-white hover:bg-gray-800 border-black px-16'
          >
            RESET
          </Button>
          <Button
            type='submit'
            className='flex-1 bg-[#F6B72D] hover:bg-yello-500 px-16'
          >
            SUBMIT
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ProfileSettings
