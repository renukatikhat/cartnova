
import { useEffect, useState } from 'react'
import API_BASE_URL from '../api'

function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [updatingOrder, setUpdatingOrder] = useState('')
  const [editingId, setEditingId] = useState(null)

  const emptyForm = {
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    stock: '',
  }

  const [form, setForm] = useState(emptyForm)
  const token = sessionStorage.getItem('authToken')

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const fetchOrders = async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/orders/admin/all`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to fetch orders')
    setOrders(Array.isArray(data.orders) ? data.orders : [])
  }

  const fetchProducts = async () => {
    const response = await fetch(`${API_BASE_URL}/api/products`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Failed to fetch products')
    setProducts(Array.isArray(data) ? data : [])
  }

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      if (!token) throw new Error('Please login again.')
      await Promise.all([fetchOrders(), fetchProducts()])
    } catch (err) {
      setError(err.message || 'Unable to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const saveProduct = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const url = editingId
        ? `${API_BASE_URL}/api/products/${editingId}`
        : `${API_BASE_URL}/api/products`

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not save product')

      setSuccess(editingId ? 'Product updated successfully!' : 'Product added successfully!')
      setForm(emptyForm)
      setEditingId(null)
      await fetchProducts()
    } catch (err) {
      setError(err.message || 'Unable to save product')
    }
  }

  const editProduct = (product) => {
    setEditingId(product._id)
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      category: product.category || '',
      image: product.image || '',
      stock: String(product.stock ?? 0),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    setError('')
    setSuccess('')
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/products/${id}`,
        { method: 'DELETE', headers }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not delete product')

      setSuccess('Product deleted successfully!')
      await fetchProducts()
    } catch (err) {
      setError(err.message || 'Unable to delete product')
    }
  }

  const getNextStatuses = (status) => {
    if (status === 'Pending') return ['Confirmed', 'Cancelled']
    if (status === 'Confirmed') return ['Shipped', 'Cancelled']
    if (status === 'Shipped') return ['Delivered']
    return []
  }

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrder(orderId)
    setError('')
    setSuccess('')
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status }),
        }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Status update failed')

      setSuccess(`Order status updated to ${status}`)
      await fetchOrders()
    } catch (err) {
      setError(err.message || 'Unable to update order')
    } finally {
      setUpdatingOrder('')
    }
  }

  return (
    <section className="products-section">
      <h2>Admin Dashboard</h2>
      <p>Manage your store products and customer orders.</p>

      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
      {success && <p role="status" style={{ color: 'green' }}>{success}</p>}

      <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>

      <form onSubmit={saveProduct} className="auth-card">
        <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
        <input name="price" type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={handleChange} required />
        <input name="category" placeholder="Category" value={form.category} onChange={handleChange} required />
        <input name="image" type="url" placeholder="Image URL" value={form.image} onChange={handleChange} required />
        <input name="stock" type="number" min="0" placeholder="Stock" value={form.stock} onChange={handleChange} required />

        <button type="submit">
          {editingId ? 'Save Changes' : 'Add Product'}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(emptyForm)
            }}
          >
            Cancel Edit
          </button>
        )}
      </form>

      <h3>All Products ({products.length})</h3>
      <button onClick={loadDashboard} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh Dashboard'}
      </button>

      {loading ? <p>Loading dashboard...</p> : (
        <div className="products-container">
          {products.map((product) => (
            <div className="product-card" key={product._id}>
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', maxHeight: 160, objectFit: 'contain' }}
                />
              )}
              <h4>{product.name}</h4>
              <p>{product.category}</p>
              <p>Price: ₹{Number(product.price).toLocaleString('en-IN')}</p>
              <p>Stock: {product.stock}</p>
              <button onClick={() => editProduct(product)}>Edit</button>
              <button onClick={() => deleteProduct(product._id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      <h3>All Orders ({orders.length})</h3>
      {loading ? <p>Loading orders...</p> : orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="products-container">
          {orders.map((order) => {
            const nextStatuses = getNextStatuses(order.status)
            return (
              <div className="product-card" key={order._id}>
                <h4>Order ID: {order._id}</h4>
                <p>Status: <strong>{order.status}</strong></p>
                <p>Customer: {order.user?.name || 'Customer'}</p>
                <p>Email: {order.user?.email || 'Not available'}</p>
                <h4>Items</h4>
                {order.items?.map((item, index) => (
                  <p key={`${order._id}-${index}`}>
                    {item.name} × {item.quantity}
                  </p>
                ))}
                <h4>Total: ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</h4>
                {nextStatuses.length > 0 ? (
                  <select
                    value=""
                    disabled={updatingOrder === order._id}
                    onChange={(e) => {
                      if (e.target.value) updateOrderStatus(order._id, e.target.value)
                    }}
                  >
                    <option value="">Update Status</option>
                    {nextStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                ) : <p>This order is {order.status}.</p>}
                {updatingOrder === order._id && <p>Updating...</p>}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default AdminDashboard