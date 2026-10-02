
import API_BASE_URL from "./api";
import { useEffect, useState } from 'react'
import './App.css'
import Auth from './Auth'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  const [products, setProducts] = useState([])

  // Load saved cart from browser
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cartItems')
      return savedCart ? JSON.parse(savedCart) : []
    } catch {
      return []
    }
  })

  const [showCart, setShowCart] = useState(false)
  const [showMyOrders, setShowMyOrders] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('currentUser')) || null
    } catch {
      return null
    }
  })

  const [authToken, setAuthToken] = useState(
    () => sessionStorage.getItem('authToken') || null
  )

  // Order states
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(false)

  // My Orders states
  const [myOrders, setMyOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState('')

  // Fetch products from backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        return response.json()
      })
      .then((data) => {
        setProducts(data)
      })
      .catch((error) => {
        console.error('Error fetching products:', error)
      })
  }, [])

  // Save cart whenever it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems))
  }, [cartItems])

  // Add product to cart
  const addToCart = (product) => {
    setCartItems((currentCart) => [...currentCart, product])
    setOrderMessage('')
    setOrderSuccess(false)
  }

  // Remove product from cart
  const removeFromCart = (indexToRemove) => {
    setCartItems((currentCart) =>
      currentCart.filter((_, index) => index !== indexToRemove)
    )
    setOrderMessage('')
    setOrderSuccess(false)
  }

  // Calculate total amount
  const totalAmount = cartItems.reduce(
    (total, item) => total + Number(item.price),
    0
  )

  // Fetch logged-in user's orders
  const fetchMyOrders = async () => {
    if (!authToken) {
      setOrdersError('Please login to view your orders.')
      return
    }

    setLoadingOrders(true)
    setOrdersError('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/orders/my-orders`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders.')
      }

      setMyOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch (error) {
      console.error('Fetch orders error:', error)
      setOrdersError(error.message || 'Unable to load your orders.')
    } finally {
      setLoadingOrders(false)
    }
  }

  // Open My Orders page
  const openMyOrders = (e) => {
    e.preventDefault()
    setShowMyOrders(true)
    setShowCart(false)
    setShowAuth(false)
    setShowAdminDashboard(false)
    setSelectedProduct(null)
    fetchMyOrders()
  }

  // Place order through backend API
  const placeOrder = async () => {
    setOrderMessage('')
    setOrderSuccess(false)

    if (!authToken) {
      setOrderMessage('Please login first to place your order.')
      return
    }

    if (cartItems.length === 0) {
      setOrderMessage('Your cart is empty.')
      return
    }

    // Combine repeated products into product + quantity
    const orderItemsMap = {}

    cartItems.forEach((item) => {
      const productId = item._id

      if (!orderItemsMap[productId]) {
        orderItemsMap[productId] = {
          product: productId,
          quantity: 0,
        }
      }

      orderItemsMap[productId].quantity += 1
    })

    const orderItems = Object.values(orderItemsMap)

    try {
      setIsPlacingOrder(true)

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          items: orderItems,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order.')
      }

      setCartItems([])
      setOrderMessage('Order placed successfully!')
      setOrderSuccess(true)
    } catch (error) {
      console.error('Place order error:', error)
      setOrderMessage(error.message || 'Something went wrong.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  // Go to home
  const goHome = (e) => {
    e?.preventDefault()
    setShowCart(false)
    setShowMyOrders(false)
    setShowAdminDashboard(false)
    setShowAuth(false)
    setSelectedProduct(null)
    setOrderMessage('')
  }

  // Open cart
  const openCart = (e) => {
    e.preventDefault()
    setShowCart(true)
    setShowMyOrders(false)
    setShowAdminDashboard(false)
    setShowAuth(false)
    setSelectedProduct(null)
  }

  // Open login/register
  const openAuth = (e) => {
    e.preventDefault()
    setShowCart(false)
    setShowMyOrders(false)
    setShowAdminDashboard(false)
    setSelectedProduct(null)
    setShowAuth(true)
  }

  // Logout
  const logout = (e) => {
    e.preventDefault()

    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('currentUser')

    setCurrentUser(null)
    setAuthToken(null)
    setMyOrders([])
    setShowAuth(false)
    setShowCart(false)
    setShowMyOrders(false)
    setShowAdminDashboard(false)
    setSelectedProduct(null)
    setOrderMessage('')
  }

  // Login/register success
  const handleLogin = (token, user) => {
    sessionStorage.setItem('authToken', token)
    sessionStorage.setItem('currentUser', JSON.stringify(user))

    setAuthToken(token)
    setCurrentUser(user)
    setShowAuth(false)
    setShowCart(false)
    setShowMyOrders(false)
    setShowAdminDashboard(false)
    setSelectedProduct(null)
  }

  // Open Admin Dashboard
  const openAdminDashboard = (e) => {
    e.preventDefault()

    if (!authToken || currentUser?.role !== 'admin') {
      return
    }

    setShowAdminDashboard(true)
    setShowMyOrders(false)
    setShowCart(false)
    setShowAuth(false)
    setSelectedProduct(null)
  }

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <h2>CodeAlpha Store</h2>

        <div className="nav-links">
          <a href="/" onClick={goHome}>
            Home
          </a>

          <a
            href="/products"
            onClick={(e) => {
              e.preventDefault()
              goHome()
              setTimeout(() => {
                document.getElementById('products')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }, 0)
            }}
          >
            Products
          </a>

          <a href="/cart" onClick={openCart}>
            Cart ({cartItems.length})
          </a>

          {authToken && currentUser ? (
            <>
              <a href="/my-orders" onClick={openMyOrders}>
                My Orders
              </a>

              {currentUser.role === 'admin' && (
                <a href="/admin" onClick={openAdminDashboard}>
                  Admin Dashboard
                </a>
              )}

              <span className="user-greeting">
                Hi, {currentUser.name}
              </span>

              <a href="/" onClick={logout}>
                Logout
              </a>
            </>
          ) : (
            <a href="/login" onClick={openAuth}>
              Login
            </a>
          )}
        </div>
      </nav>

      {/* Authentication Page */}
      {showAuth ? (
        <Auth
          onLogin={handleLogin}
          onBack={() => setShowAuth(false)}
        />
      ) : showAdminDashboard ? (
        /* Admin Dashboard Page */
        currentUser?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <section className="products-section">
            <h2>Access Denied</h2>
            <p>Admin access is required to view this page.</p>
            <button onClick={goHome}>Go Home</button>
          </section>
        )
      ) : showMyOrders ? (
        /* My Orders Page */
        <section className="products-section">
          <h2>My Orders</h2>

          <button onClick={goHome}>
            ← Continue Shopping
          </button>

          {loadingOrders ? (
            <p>Loading your orders...</p>
          ) : ordersError ? (
            <p role="alert" style={{ color: 'crimson' }}>
              {ordersError}
            </p>
          ) : myOrders.length === 0 ? (
            <p>You have not placed any orders yet.</p>
          ) : (
            <div className="products-container">
              {myOrders.map((order) => (
                <div className="product-card" key={order._id}>
                  <h3>Order ID: {order._id}</h3>

                  <p>
                    Date:{' '}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString('en-IN')
                      : 'Not available'}
                  </p>

                  <p>
                    Status: {order.status || 'Pending'}
                  </p>

                  <h4>Items</h4>

                  {order.items?.map((item, index) => (
                    <div key={`${order._id}-${index}`}>
                      <p>
                        {item.name} × {item.quantity}
                      </p>
                      <p>
                        Price: ₹
                        {(
                          Number(item.price) * Number(item.quantity)
                        ).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}

                  <h3>
                    Total: ₹
                    {Number(order.totalAmount || 0).toLocaleString(
                      'en-IN'
                    )}
                  </h3>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={fetchMyOrders}
            disabled={loadingOrders}
          >
            {loadingOrders ? 'Refreshing...' : 'Refresh Orders'}
          </button>
        </section>
      ) : showCart ? (
        /* Cart Page */
        <section className="products-section">
          <h2>My Shopping Cart</h2>

          {cartItems.length === 0 ? (
            <div>
              <p>Your cart is empty.</p>

              {orderSuccess && (
                <p className="order-message" role="status">
                  {orderMessage}
                </p>
              )}

              <button onClick={goHome}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="products-container">
                {cartItems.map((item, index) => (
                  <div
                    className="product-card"
                    key={`${item._id}-${index}`}
                  >
                    <img src={item.image} alt={item.name} />

                    <h3>{item.name}</h3>

                    <p>Price: ₹{item.price}</p>

                    <button
                      onClick={() => removeFromCart(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <h2>
                  Total: ₹{totalAmount.toLocaleString('en-IN')}
                </h2>

                {orderMessage && (
                  <p
                    className="order-message"
                    role="status"
                    style={{
                      color: orderSuccess ? 'green' : 'crimson',
                    }}
                  >
                    {orderMessage}
                  </p>
                )}

                <button onClick={goHome}>
                  Continue Shopping
                </button>

                <button
                  onClick={placeOrder}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </>
          )}
        </section>
      ) : selectedProduct ? (
        /* Product Details Page */
        <section className="product-details">
          <button
            className="back-button"
            onClick={() => setSelectedProduct(null)}
          >
            ← Back to Products
          </button>

          <div className="details-card">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
            />

            <div className="details-info">
              <p className="category">
                {selectedProduct.category}
              </p>

              <h1>{selectedProduct.name}</h1>

              <h2>₹{selectedProduct.price}</h2>

              <p>{selectedProduct.description}</p>

              <p>
                Available Stock: {selectedProduct.stock}
              </p>

              <button
                onClick={() => addToCart(selectedProduct)}
                disabled={selectedProduct.stock <= 0}
              >
                {selectedProduct.stock <= 0
                  ? 'Out of Stock'
                  : 'Add to Cart'}
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* Home and Products Page */
        <>
          {/* Hero Section */}
          <main className="hero-section">
            <h1>Modern Tech & Gadgets</h1>
            <p>
              Discover smart gadgets and the latest technology.
            </p>

            <button
              onClick={() => {
                document.getElementById('products')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }}
            >
              Shop Now
            </button>
          </main>

          {/* Products Section */}
          <section className="products-section" id="products">
            <h2>Featured Products</h2>

            <div className="products-container">
              {products.map((product) => (
                <div
                  className="product-card"
                  key={product._id}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                  />

                  <h3>{product.name}</h3>

                  <p className="category">
                    {product.category}
                  </p>

                  <p>{product.description}</p>

                  <h3>₹{product.price}</h3>

                  <p>Stock: {product.stock}</p>

                  <button
                    className="details-button"
                    onClick={() => setSelectedProduct(product)}
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    {product.stock <= 0
                      ? 'Out of Stock'
                      : 'Add to Cart'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default App