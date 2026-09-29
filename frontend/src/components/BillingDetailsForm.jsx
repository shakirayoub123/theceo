import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function BillingDetailsForm({
  cartItems,
  total,
  onSubmitDetails,
}) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    country: '',
  })
  const [isValid, setIsValid] = useState(false)

  const handleInputChange = (e) => {
    const { id, value } = e.target
    const updatedData = {
      ...formData,
      [id]: value,
    }
    setFormData(updatedData)

    // Check if all required fields are filled
    const allFilled =
      updatedData.customerName &&
      updatedData.customerEmail &&
      updatedData.customerPhone
    setIsValid(allFilled)
  }

  const handleValidateDetails = (e) => {
    e.preventDefault()

    if (
      !formData.customerName ||
      !formData.customerEmail ||
      !formData.customerPhone
    ) {
      toast.error('Please fill in all required fields')
      return
    }

    // Pass billing details to parent component
    if (onSubmitDetails) {
      onSubmitDetails({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        country: formData.country,
        ebooks: cartItems.map((item) => parseInt(item.id)),
      })
    }

    toast.success('Billing details saved. Proceed to payment.')
  }

  return (
    <div className='font-jakarta bg-[#FFFFFF] border border-[#CACACA] rounded-[14px] p-8 md:p-10 shadow-sm'>
      <h2 className='text-[20px] font-bold text-[#000000] mb-8 border-b border-[#CACACA] pb-4'>Billing Details</h2>

      <form onSubmit={handleValidateDetails} className='space-y-6 normal-case'>
        {/* Name Fields */}
        <div>
          <label
            htmlFor='customerName'
            className='block text-[14px] font-bold text-[#161616] mb-2'
          >
            Full Name <span className='text-red-500'>*</span>
          </label>
          <Input
            id='customerName'
            type='text'
            placeholder='e.g. John Doe'
            className='w-full border border-[#CACACA] rounded-[8px] bg-[#FCFCFC] h-12 px-4 shadow-none focus-visible:ring-1 focus-visible:ring-[#F6B72D] text-[15px]'
            value={formData.customerName}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor='customerPhone'
            className='block text-[14px] font-bold text-[#161616] mb-2'
          >
            Phone Number <span className='text-red-500'>*</span>
          </label>
          <Input
            id='customerPhone'
            type='tel'
            placeholder='e.g. +1 781 2344'
            className='w-full border border-[#CACACA] rounded-[8px] bg-[#FCFCFC] h-12 px-4 shadow-none focus-visible:ring-1 focus-visible:ring-[#F6B72D] text-[15px]'
            value={formData.customerPhone}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor='customerEmail'
            className='block text-[14px] font-bold text-[#161616] mb-2'
          >
            Email <span className='text-red-500'>*</span>
          </label>
          <Input
            id='customerEmail'
            type='email'
            placeholder='e.g. email@example.com'
            className='w-full border border-[#CACACA] rounded-[8px] bg-[#FCFCFC] h-12 px-4 shadow-none focus-visible:ring-1 focus-visible:ring-[#F6B72D] text-[15px]'
            value={formData.customerEmail}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Country */}
        <div>
          <label
            htmlFor='country'
            className='block text-[14px] font-bold text-[#161616] mb-2'
          >
            Country
          </label>
          <Input
            id='country'
            type='text'
            placeholder='e.g. US'
            className='w-full border border-[#CACACA] rounded-[8px] bg-[#FCFCFC] h-12 px-4 shadow-none focus-visible:ring-1 focus-visible:ring-[#F6B72D] text-[15px]'
            value={formData.country}
            onChange={handleInputChange}
          />
        </div>

        {/* Submit Button */}
        <div className='pt-6'>
          <Button
            type='submit'
            disabled={!isValid || cartItems.length === 0}
            className='w-full bg-[#F6B72D] hover:bg-[#e6b82a] text-white py-3 h-12 rounded-full font-bold text-[14px] tracking-wide'
          >
            Save Billing Details
          </Button>
        </div>

        <p className='text-[13px] text-[#797979] italic mt-2'>
          * Fill in all required fields to proceed to payment
        </p>
      </form>
    </div>
  )
}
