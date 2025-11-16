import { useEffect, useMemo, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function ProductCard({ product, onAddToCart, onToggleWishlist, wished }) {
  return (
    <div className="group rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-all">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 mb-3">
        {product.image ? (
          <img src={product.image} alt={product.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">No Image</div>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-800 line-clamp-2">{product.title}</h3>
          <p className="text-sm text-gray-500">{product.brand || product.category}</p>
        </div>
        <button onClick={() => onToggleWishlist(product)} className={`text-sm px-2 py-1 rounded ${wished ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-600'} hover:bg-rose-200`}>
          {wished ? '♥' : '♡'}
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-bold">${product.price?.toFixed?.(2) ?? product.price}</span>
        <button onClick={() => onAddToCart(product)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded">
          Add to Cart
        </button>
      </div>
    </div>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [email, setEmail] = useState('demo@shop.com')
  const [placingOrder, setPlacingOrder] = useState(false)

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/categories`).then(r => r.json()).then(d => setCategories(d.items || [])).catch(() => {})
    loadProducts()
    loadWishlist()
  }, [])

  const loadProducts = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('category', category)
    if (brand) params.set('brand', brand)
    if (priceMin) params.set('min_price', priceMin)
    if (priceMax) params.set('max_price', priceMax)
    fetch(`${BACKEND_URL}/api/products?${params.toString()}`)
      .then(r => r.json()).then(d => setProducts(d.items || [])).catch(() => {})
  }

  const loadWishlist = () => {
    fetch(`${BACKEND_URL}/api/wishlist?user_email=${encodeURIComponent(email)}`)
      .then(r => r.json()).then(d => setWishlist(d.items || [])).catch(() => {})
  }

  const wishedIds = useMemo(() => new Set(wishlist.map(w => w.product_id)), [wishlist])

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { id: product.id, title: product.title, price: product.price, quantity: 1, product_id: product.id }]
    })
  }

  const toggleWishlist = async (product) => {
    if (wishedIds.has(product.id)) return
    try {
      await fetch(`${BACKEND_URL}/api/wishlist`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: email, product_id: product.id })
      })
      loadWishlist()
    } catch {}
  }

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart])

  const placeOrder = async () => {
    if (cart.length === 0) return
    setPlacingOrder(true)
    try {
      const items = cart.map(i => ({ product_id: i.product_id, title: i.title, price: i.price, quantity: i.quantity }))
      await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: email, shipping_address: 'Demo Address', payment_method: 'cod', items, total })
      })
      setCart([])
      alert('Order placed!')
    } catch (e) {
      alert('Failed to place order')
    } finally {
      setPlacingOrder(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="text-xl font-bold">ShopMobile</div>
          <div className="flex-1 flex items-center gap-2">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products..." className="w-full rounded-lg border px-3 py-2" />
            <button onClick={loadProducts} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Search</button>
          </div>
          <div className="text-sm text-gray-600">Cart: {cart.reduce((s,i)=>s+i.quantity,0)} • ${total.toFixed(2)}</div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 space-y-4">
          <div className="p-4 rounded-xl border bg-white">
            <div className="font-semibold mb-2">Filters</div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Category</label>
                <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full rounded-lg border px-3 py-2 mt-1">
                  <option value="">All</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Brand</label>
                <input value={brand} onChange={e=>setBrand(e.target.value)} className="w-full rounded-lg border px-3 py-2 mt-1" placeholder="e.g. Nike" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600">Min</label>
                  <input type="number" value={priceMin} onChange={e=>setPriceMin(e.target.value)} className="w-full rounded-lg border px-3 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Max</label>
                  <input type="number" value={priceMax} onChange={e=>setPriceMax(e.target.value)} className="w-full rounded-lg border px-3 py-2 mt-1" />
                </div>
              </div>
              <button onClick={loadProducts} className="w-full bg-gray-900 text-white px-3 py-2 rounded-lg">Apply</button>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-white">
            <div className="font-semibold mb-2">Cart</div>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-500">Your cart is empty</p>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="line-clamp-1">{item.title}</span>
                    <div className="flex items-center gap-2">
                      <span>x{item.quantity}</span>
                      <span className="font-semibold">${(item.price*item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <button disabled={placingOrder} onClick={placeOrder} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg">
                  {placingOrder ? 'Placing...' : 'Checkout'}
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="md:col-span-3">
          {products.length === 0 ? (
            <div className="text-center text-gray-500 py-20">No products found</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <ProductCard key={p.id || p._id} product={p} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wished={wishedIds.has(p.id)} />
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t py-6 text-center text-sm text-gray-500">© {new Date().getFullYear()} ShopMobile</footer>
    </div>
  )
}

export default App
