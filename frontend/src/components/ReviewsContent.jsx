export default function ReviewsContent({ reviews }) {
  return (
    <div>
      <h3 className='text-xl font-bold mb-6'>REVIEWS</h3>
      {reviews.length > 0 ? (
        <div className='space-y-6 font-exo'>
          {reviews.map((review, index) => (
            <div key={index} className='border border-gray-200 rounded-lg p-4'>
              <div className='flex items-center justify-between mb-3'>
                <div>
                  <h4 className='font-semibold'>{review.clientName}</h4>
                  <p className='text-gray-600 text-md'>{review.company}</p>
                </div>
                <div className='flex items-center gap-1'>
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${
                        i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className='text-gray-700 text-md mb-2'>{review.comment}</p>
              <p className='text-gray-500 text-sm'>{review.date}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className='text-gray-600'>Reviews content will be displayed here.</p>
      )}
    </div>
  )
}
