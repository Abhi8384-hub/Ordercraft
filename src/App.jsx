import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api/products";

const defaultProducts = [
  { id: 1, name: "Wireless Mouse", category: "Electronics", description: "Ergonomic wireless mouse with silent clicks.", price: 1299, stockQuantity: 24 },
  { id: 2, name: "Mechanical Keyboard", category: "Accessories", description: "RGB gaming keyboard built for fast typing.", price: 3499, stockQuantity: 12 },
  { id: 3, name: "USB-C Hub", category: "Peripherals", description: "Multi-port adapter for workstations and laptops.", price: 1999, stockQuantity: 7 },
  { id: 4, name: "Office Chair", category: "Furniture", description: "Comfortable desk chair with lumbar support.", price: 8999, stockQuantity: 4 },
  { id: 5, name: "Laptop Stand", category: "Accessories", description: "Adjustable aluminum stand for better posture and airflow.", price: 2499, stockQuantity: 18 },
  { id: 6, name: "Noise Cancelling Headset", category: "Electronics", description: "Wireless headset designed for calls and long listening sessions.", price: 5999, stockQuantity: 9 },
  { id: 7, name: "Desk Lamp", category: "Office Supplies", description: "LED desk lamp with touch control and warm-to-cool lighting.", price: 1799, stockQuantity: 15 },
  { id: 8, name: "Monitor Arm", category: "Furniture", description: "Flexible arm mount for ergonomic dual-monitor setups.", price: 4599, stockQuantity: 6 },
];

const defaultOrders = [
  { id: "ORD-2048", customer: "Aisha Khan", total: 3299, status: "Packed" },
  { id: "ORD-2049", customer: "Daniel Ross", total: 11999, status: "Shipped" },
  { id: "ORD-2050", customer: "Priya Shah", total: 7999, status: "Processing" },
  { id: "ORD-2051", customer: "Noah Lee", total: 2499, status: "Delivered" },
];

const revenueTrend = [42, 58, 48, 76, 81, 72, 96, 84, 110, 120, 128, 140];

const navigationItems = [
  { id: "dashboard", label: "Overview" },
  { id: "products", label: "Products" },
  { id: "analytics", label: "Analytics" },
  { id: "orders", label: "Orders" },
  { id: "settings", label: "Settings" },
];

const initialForm = {
  name: "",
  description: "",
  category: "Electronics",
  price: "",
  stockQuantity: "",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const normalizeProduct = (product) => ({
  id: product.id ?? product._id ?? product.productId ?? Date.now() + Math.random(),
  name: product.productName ?? product.name ?? `Product ${product.id ?? "New"}`,
  description: product.description ?? "",
  category: product.category ?? "General",
  price: Number(product.price ?? 0),
  stockQuantity: Number(product.stockQuantity ?? 0),
});

function App() {
  const [products, setProducts] = useState(defaultProducts);
  const [orders] = useState(defaultOrders);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState("Backend connected or demo mode is active.");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeView, setActiveView] = useState("dashboard");
  const [authMode, setAuthMode] = useState("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const categories = ["All", ...new Set(products.map((product) => product.category))];

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch = !query || [product.name, product.category, product.description].join(" ").toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  const totalInventoryValue = products.reduce((total, product) => total + product.price * product.stockQuantity, 0);
  const totalUnits = products.reduce((total, product) => total + product.stockQuantity, 0);
  const lowStockCount = products.filter((product) => product.stockQuantity <= 5).length;
  const uniqueCategories = new Set(products.map((product) => product.category)).size;
  const salesTotal = orders.reduce((total, order) => total + order.total, 0);
  const topProducts = [...products].sort((a, b) => b.stockQuantity - a.stockQuantity).slice(0, 4);

  const loadProducts = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to fetch products");
      }

      const data = await response.json();
      const productList = Array.isArray(data) ? data : Array.isArray(data.products) ? data.products : [];
      setProducts(productList.map(normalizeProduct));
      setStatusMessage("Inventory synced successfully.");
    } catch (error) {
      setProducts(defaultProducts);
      setStatusMessage("Backend unavailable. Showing demo inventory data.");
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleEditProduct = (product) => {
    setActiveView("products");
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description ?? "",
      category: product.category ?? "Electronics",
      price: String(product.price),
      stockQuantity: String(product.stockQuantity),
    });
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    const price = Number(formData.price);
    const stockQuantity = Number(formData.stockQuantity);

    if (!formData.name || !formData.category || !formData.price || !formData.stockQuantity) {
      setStatusMessage("Please fill in all product details.");
      return;
    }

    if (Number.isNaN(price) || Number.isNaN(stockQuantity) || price <= 0 || stockQuantity < 0) {
      setStatusMessage("Price must be greater than zero and stock cannot be negative.");
      return;
    }

    const payload = {
      productName: formData.name,
      description: formData.description,
      price,
      stockQuantity,
    };

    const localPayload = {
      ...payload,
      name: formData.name,
      category: formData.category,
    };

    try {
      const endpoint = editingId ? `${API_URL}/${editingId}` : API_URL;
      const response = await fetch(endpoint, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(editingId ? "Product update failed" : "Product creation failed");
      }

      const returnedProduct = await response.json().catch(() => null);
      const productToSave = normalizeProduct({
        ...(returnedProduct && Object.keys(returnedProduct).length ? returnedProduct : {}),
        ...localPayload,
        id: editingId ?? returnedProduct?.id ?? returnedProduct?._id ?? returnedProduct?.productId ?? payload.id,
        productName: formData.name,
      });

      setProducts((previous) => {
        if (editingId) {
          return previous.map((product) =>
            product.id === editingId ? { ...product, ...productToSave, id: editingId, category: formData.category } : product
          );
        }

        return [{ ...productToSave, category: formData.category }, ...previous];
      });

      resetForm();
      setStatusMessage(editingId ? "Product updated successfully." : "New product added successfully.");
    } catch (error) {
      if (editingId) {
        setProducts((previous) =>
          previous.map((product) =>
            product.id === editingId ? { ...product, ...localPayload, id: editingId, category: formData.category } : product
          )
        );
        setStatusMessage("Update saved locally because the backend is unavailable.");
      } else {
        setProducts((previous) => [{ ...localPayload, id: Date.now(), category: formData.category }, ...previous]);
        setStatusMessage("New product saved locally because the backend is unavailable.");
      }

      resetForm();
      console.error("Error saving product:", error);
    }
  };

  const deleteProduct = async (productId) => {
    const confirmed = window.confirm("Are you sure you want to delete this product?");

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        throw new Error("Delete request failed");
      }

      setProducts((previous) => previous.filter((product) => product.id !== productId));
      setStatusMessage("Product removed successfully.");
    } catch (error) {
      setProducts((previous) => previous.filter((product) => product.id !== productId));
      setStatusMessage("Product removed locally because the backend is unavailable.");
      console.error("Error deleting product:", error);
    }
  };

  const handleAuthSubmit = (event) => {
    event.preventDefault();
    setIsAuthenticated(true);
  };

  const renderOverview = () => (
    <>
      <section className="stats-grid">
        <div className="stat-card accent">
          <span>Total Products</span>
          <strong>{products.length}</strong>
        </div>
        <div className="stat-card">
          <span>Inventory Value</span>
          <strong>{formatCurrency(totalInventoryValue)}</strong>
        </div>
        <div className="stat-card">
          <span>Units in Stock</span>
          <strong>{totalUnits}</strong>
        </div>
        <div className="stat-card warning">
          <span>Low Stock Items</span>
          <strong>{lowStockCount}</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Overview</p>
              <h3>Revenue trend</h3>
            </div>
            <span className="chip positive">+18.4%</span>
          </div>

          <div className="bar-chart" aria-label="Revenue trend chart">
            {revenueTrend.map((value, index) => (
              <div key={index} className="bar-column">
                <span className="bar-value">{value}k</span>
                <div className="bar-fill" style={{ height: `${value}%` }} />
                <span className="bar-label">{["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][index]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel report-panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Sales</p>
              <h3>Total revenue</h3>
            </div>
          </div>

          <div className="money-block">
            <strong>{formatCurrency(salesTotal)}</strong>
            <span>Projected this quarter</span>
          </div>

          <ul className="mini-list">
            <li><span>Shipping</span><strong>₹19,800</strong></li>
            <li><span>Returns</span><strong>₹3,240</strong></li>
            <li><span>Marketing</span><strong>₹8,950</strong></li>
          </ul>
        </div>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading compact">
          <div>
            <p className="muted-label">Top products</p>
            <h3>Inventory leaders</h3>
          </div>
        </div>

        <div className="top-products">
          {topProducts.map((product) => (
            <div key={product.id} className="product-rank-card">
              <div>
                <p className="muted-label">{product.category}</p>
                <h4>{product.name}</h4>
              </div>
              <div className="rank-metrics">
                <strong>{product.stockQuantity}</strong>
                <span>in stock</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const renderProductsPanel = () => (
    <div className="content-grid">
      <aside className="panel form-panel">
        <div className="panel-header">
          <h2>{editingId ? "Edit Product" : "Add Product"}</h2>
        </div>

        <form className="product-form" onSubmit={saveProduct}>
          <label>
            Product name
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter product name" />
          </label>

          <label>
            Category
            <select name="category" value={formData.category} onChange={handleInputChange}>
              <option value="Electronics">Electronics</option>
              <option value="Accessories">Accessories</option>
              <option value="Peripherals">Peripherals</option>
              <option value="Furniture">Furniture</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="General">General</option>
            </select>
          </label>

          <label>
            Price (₹)
            <input type="number" name="price" min="1" value={formData.price} onChange={handleInputChange} placeholder="599" />
          </label>

          <label>
            Stock quantity
            <input type="number" name="stockQuantity" min="0" value={formData.stockQuantity} onChange={handleInputChange} placeholder="25" />
          </label>

          <label>
            Description
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" placeholder="Add a short product description" />
          </label>

          <div className="form-actions">
            <button type="submit" className="primary-btn">{editingId ? "Update product" : "Save product"}</button>
            {editingId && <button type="button" className="secondary-btn" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </aside>

      <section className="panel inventory-panel">
        <div className="panel-header inventory-header">
          <h2>Product List</h2>
          <div className="toolbar">
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input className="search-box" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products" />
          </div>
        </div>

        <div className="product-list">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">No products match your search.</div>
          ) : (
            filteredProducts.map((product) => (
              <article key={product.id} className="product-item">
                <div className="product-copy">
                  <div className="product-topline">
                    <span className="category-tag">{product.category}</span>
                    <span className={`stock-badge ${product.stockQuantity <= 5 ? "danger" : "safe"}`}>
                      {product.stockQuantity <= 5 ? "Low stock" : "In stock"}
                    </span>
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.description || "No description added yet."}</p>
                </div>

                <div className="product-metrics">
                  <div>
                    <span>Price</span>
                    <strong>{formatCurrency(product.price)}</strong>
                  </div>
                  <div>
                    <span>Stock</span>
                    <strong>{product.stockQuantity}</strong>
                  </div>
                  <div>
                    <span>Value</span>
                    <strong>{formatCurrency(product.price * product.stockQuantity)}</strong>
                  </div>
                </div>

                <div className="action-row">
                  <button type="button" className="edit-btn" onClick={() => handleEditProduct(product)}>Edit</button>
                  <button type="button" className="delete-btn" onClick={() => deleteProduct(product.id)}>Delete</button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );

  const renderAnalyticsPanel = () => (
    <div className="analytics-layout">
      <div className="panel analytics-main">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Performance</p>
            <h3>Category performance</h3>
          </div>
        </div>

        <div className="ring-summary">
          <div className="ring-card">
            <div className="ring-value">82%</div>
            <span>Retention</span>
          </div>
          <div className="ring-card">
            <div className="ring-value alt">67%</div>
            <span>Conversion</span>
          </div>
        </div>
      </div>

      <div className="panel analytics-side">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Summary</p>
            <h3>Key metrics</h3>
          </div>
        </div>

        <ul className="metrics-list">
          <li><span>Categories</span><strong>{uniqueCategories}</strong></li>
          <li><span>Avg price</span><strong>{formatCurrency(totalInventoryValue / Math.max(products.length, 1))}</strong></li>
          <li><span>Low stock</span><strong>{lowStockCount}</strong></li>
          <li><span>Search result</span><strong>{filteredProducts.length}</strong></li>
        </ul>
      </div>
    </div>
  );

  const renderOrdersPanel = () => (
    <div className="panel orders-panel">
      <div className="panel-heading compact">
        <div>
          <p className="muted-label">Orders</p>
          <h3>Recent activity</h3>
        </div>
      </div>

      <div className="order-table">
        <div className="table-head">
          <span>Order ID</span>
          <span>Customer</span>
          <span>Total</span>
          <span>Status</span>
        </div>

        {orders.map((order) => (
          <div key={order.id} className="table-row">
            <span>{order.id}</span>
            <span>{order.customer}</span>
            <span>{formatCurrency(order.total)}</span>
            <span className={`order-status ${order.status.toLowerCase().replace(/\s+/g, "-")}`}>{order.status}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettingsPanel = () => (
    <div className="panel settings-panel">
      <div className="panel-heading compact">
        <div>
          <p className="muted-label">Profile</p>
          <h3>Account settings</h3>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-box">
          <label>
            Full name
            <input type="text" defaultValue="Admin User" />
          </label>
        </div>
        <div className="setting-box">
          <label>
            Email
            <input type="email" defaultValue="admin@company.com" />
          </label>
        </div>
        <div className="setting-box wide">
          <label>
            Team notifications
            <textarea defaultValue="Weekly inventory summary and stock alerts are enabled for all managers." rows="4" />
          </label>
        </div>
      </div>
    </div>
  );

  const authContent = (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="auth-brand">
          <div className="brand-mark">I</div>
          <div>
            <p className="eyebrow">Inventory</p>
            <h2>IntelliStock</h2>
          </div>
        </div>

        <div className="auth-toggle">
          <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Login</button>
          <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>Sign up</button>
        </div>

        <form className="auth-form" onSubmit={handleAuthSubmit}>
          {authMode === "signup" && (
            <label>
              Full name
              <input type="text" placeholder="Your name" />
            </label>
          )}

          <label>
            Email
            <input type="email" placeholder="name@company.com" required />
          </label>

          <label>
            Password
            <input type="password" placeholder="••••••••" required />
          </label>

          <button type="submit" className="primary-btn auth-submit">
            {authMode === "login" ? "Login to dashboard" : "Create account"}
          </button>
        </form>
      </div>

      <div className="auth-side">
        <div className="auth-side-inner">
          <p className="eyebrow">Smart management</p>
          <h1>Track stock, sales, and performance in one place.</h1>
          <ul>
            <li>Live inventory insights across categories</li>
            <li>Order tracking with quick reporting</li>
            <li>Inventory alerts for low stock items</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      {!isAuthenticated ? (
        authContent
      ) : (
        <div className="admin-shell">
          <aside className="sidebar">
            <div className="brand-block">
              <div className="brand-mark">I</div>
              <div>
                <p className="eyebrow">Admin</p>
                <h2>IntelliStock</h2>
              </div>
            </div>

            <nav className="nav-list">
              {navigationItems.map((item) => (
                <button key={item.id} type="button" className={activeView === item.id ? "nav-item active" : "nav-item"} onClick={() => setActiveView(item.id)}>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="profile-card">
              <div className="avatar">AU</div>
              <div>
                <strong>Admin User</strong>
                <span>Operations Lead</span>
              </div>
            </div>

            <button type="button" className="logout-btn" onClick={() => setIsAuthenticated(false)}>Logout</button>
          </aside>

          <main className="workspace">
            <header className="workspace-header">
              <div>
                <p className="muted-label">Welcome back</p>
                <h1>Inventory dashboard</h1>
              </div>

              <div className="workspace-actions">
                <button type="button" className="secondary-btn" onClick={loadProducts} disabled={isLoading}>{isLoading ? "Refreshing..." : "Refresh"}</button>
                <button type="button" className="primary-btn" onClick={() => setActiveView("products")}>Add product</button>
              </div>
            </header>

            <div className="status-banner">{statusMessage}</div>

            {activeView === "dashboard" && renderOverview()}
            {activeView === "products" && renderProductsPanel()}
            {activeView === "analytics" && renderAnalyticsPanel()}
            {activeView === "orders" && renderOrdersPanel()}
            {activeView === "settings" && renderSettingsPanel()}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;