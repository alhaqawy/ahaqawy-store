import { useState } from "react";
import "./App.css";

const products = [
  {
    id: 1,
    name: "بطاقة Google Play",
    category: "بطاقات",
    description: "شحن رصيد حسابك بكل سهولة",
    price: 50,
    icon: "▶️",
    badge: "الأكثر مبيعاً",
    badgeType: "green",
  },
  {
    id: 2,
    name: "بطاقة Apple",
    category: "بطاقات",
    description: "للمتجر السعودي والأمريكي",
    price: 50,
    icon: "",
    badge: "مميز",
    badgeType: "purple",
  },
  {
    id: 3,
    name: "اشتراك Netflix",
    category: "اشتراكات",
    description: "شاهد أقوى الأفلام والمسلسلات",
    price: 50,
    icon: "N",
    badge: "خصم",
    badgeType: "red",
  },
  {
    id: 4,
    name: "بطاقة PlayStation",
    category: "ألعاب",
    description: "شحن رصيد بلايستيشن",
    price: 50,
    icon: "▶",
    badge: "جديد",
    badgeType: "blue",
  },
];

const categories = [
  { name: "المزيد", icon: "▦" },
  { name: "بطاقات Google", icon: "▶️" },
  { name: "بطاقات Apple", icon: "" },
  { name: "الاشتراكات", icon: "📺" },
  { name: "بطاقات الألعاب", icon: "🎮" },
];

function App() {
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const addToCart = (product) => {
    setCart((current) => [...current, product]);
  };

  if (selectedProduct) {
    return (
      <div className="mobile-store" dir="rtl">
        <header className="mobile-header">
          <button
            className="icon-button"
            onClick={() => setSelectedProduct(null)}
          >
            ←
          </button>

          <div className="brand">
            <div className="brand-icon">🛍️</div>
            <strong>متجرنا</strong>
          </div>

          <div className="header-spacer" />
        </header>

        <main className="product-details">
          <button
            className="back-link"
            onClick={() => setSelectedProduct(null)}
          >
            → العودة للمنتجات
          </button>

          <div className="details-card">
            <div className="details-image">
              <span>{selectedProduct.icon}</span>
            </div>

            <div className="details-category">
              {selectedProduct.category}
            </div>

            <h1>{selectedProduct.name}</h1>

            <p>{selectedProduct.description}</p>

            <div className="details-price">
              SAR {selectedProduct.price}
            </div>

            <button
              className="primary-button details-cart"
              onClick={() => addToCart(selectedProduct)}
            >
              🛒 أضف للسلة
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mobile-store" dir="rtl">
      <header className="mobile-header">
        <button
          className="icon-button hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <div className="brand">
          <div>
            <strong>متجرنا</strong>
            <span>كل ما تحتاجه في مكان واحد</span>
          </div>
          <div className="brand-icon">🛍️</div>
        </div>

        <div className="header-actions">
          <button className="icon-button">⌕</button>

          <button className="cart-button">
            🛒
            {cart.length > 0 && <b>{cart.length}</b>}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu">
          <button>الرئيسية</button>
          <button>المنتجات</button>
          <button>العروض</button>
          <button>تواصل معنا</button>
        </div>
      )}

      <main>
        <section className="hero-mobile">
          <div className="hero-card-art">
            <div className="digital-card">DIGITAL STORE</div>
          </div>

          <div className="hero-content">
            <div className="hero-badge">🔥 أفضل العروض الرقمية</div>

            <h1>
              بطاقاتك
              <br />
              واشتراكاتك
              <br />
              بكل سهولة
            </h1>

            <p>
              متجر رقمي لشراء بطاقات الشحن
              <br />
              والاشتراكات بسرعة وأمان.
            </p>

            <div className="hero-buttons">
              <button className="primary-button">
                تصفح المنتجات ←
              </button>

              <button className="secondary-button">
                مزيد من التفاصيل
              </button>
            </div>
          </div>
        </section>

        <div className="slider-dots">
          <span className="active" />
          <span />
          <span />
        </div>

        <section className="categories-mobile">
          {categories.map((category) => (
            <button className="category-card" key={category.name}>
              <span>{category.icon}</span>
              <strong>{category.name}</strong>
            </button>
          ))}
        </section>

        <section className="products-section">
          <div className="section-heading">
            <a href="#products">← عرض الكل</a>
            <h2>🔥 المنتجات الأكثر طلباً</h2>
          </div>

          <div className="products-mobile" id="products">
            {products.map((product) => (
              <article
                className="mobile-product-card"
                key={product.id}
                onClick={() => setSelectedProduct(product)}
              >
                <span className={`product-badge ${product.badgeType}`}>
                  {product.badge}
                </span>

                <button
                  className="favorite"
                  onClick={(e) => e.stopPropagation()}
                >
                  ♡
                </button>

                <div className={`product-image ${product.id === 3 ? "netflix" : ""}`}>
                  <span>{product.icon}</span>
                  {product.id === 1 && <small>Google Play</small>}
                  {product.id === 2 && <small>Apple</small>}
                  {product.id === 3 && <small>N</small>}
                  {product.id === 4 && <small>PS</small>}
                </div>

                <h3>{product.name}</h3>

                <p>{product.description}</p>

                <strong className="price">
                  SAR {product.price}
                </strong>

                <button
                  className="product-cart"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                >
                  🛒 أضف للسلة
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="benefits">
          <div>
            <span>⚡</span>
            <strong>تسليم فوري</strong>
            <small>خلال دقائق</small>
          </div>

          <div>
            <span>🛡️</span>
            <strong>دفع آمن</strong>
            <small>حماية 100%</small>
          </div>

          <div>
            <span>🎧</span>
            <strong>دعم العملاء</strong>
            <small>مستمر 24/7</small>
          </div>
        </section>
      </main>

      <nav className="bottom-nav">
        <button>
          <span>•••</span>
          المزيد
        </button>

        <button>
          <span>📦</span>
          الطلبات
        </button>

        <button className="active">
          <span>⌂</span>
          الرئيسية
        </button>

        <button>
          <span>♡</span>
          المفضلة
        </button>

        <button>
          <span>♙</span>
          حسابي
        </button>
      </nav>
    </div>
  );
}

export default App;
