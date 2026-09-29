import { useEffect, useState } from 'react'
import CartItem from './CartItem'

export default function CartTable({
  products: initialProducts,
  onRemove,
  onUpdateQuantity,
}) {
  const [products, setProducts] = useState(initialProducts)

  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  const handleRemove = (id) => {
    setProducts(products.filter((product) => product.id !== id))
    onRemove?.(id)
  }

  const handleQuantityChange = (id, quantity) => {
    setProducts(
      products.map((product) =>
        product.id === id ? { ...product, quantity } : product,
      ),
    )
    onUpdateQuantity?.(id, quantity)
  }

  return (
    <div className='rounded-[14px] border border-[#CACACA] bg-white shadow-sm overflow-hidden font-jakarta'>
      {/* Table Header */}
      <div className='hidden sm:block border-b border-[#CACACA] bg-[#F8F8F8] py-5 px-6 md:px-10'>
        <div className='flex items-center text-[#797979] text-sm font-semibold uppercase tracking-wider'>
          <div className='flex-1'>Product</div>
          <div className='w-[100px] text-right'>Price</div>
        </div>
      </div>

      {/* Table Body */}
      <div>
        <div className='px-4 py-2 sm:px-6 md:px-10 sm:py-0'>
          {products.map((product) => (
            <CartItem
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
              quantity={product.quantity}
              onRemove={handleRemove}
              onQuantityChange={handleQuantityChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
