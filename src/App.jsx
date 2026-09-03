import { useState } from "react";
import "./App.css";

const products = [
  {
    id: 1,
    name: "بطاقات ألعاب",
    icon: "🎮",
    description: "بطاقات شحن لأشهر الألعاب",
  },
  {
    id: 2,
    name: "اشتراكات رقمية",
    icon: "📺",
    description: "اشتراكات ترفيهية ورقمية",
  },
  {
    id: 3,
    name: "بطاقات Apple",
    icon: "",
    description: "بطاقات App Store و Apple",
  },
  {
    id: 4,
    name: "بطاقات Google Play",
    icon: "▶️",
    description: "شحن Google Play بسهولة",
  },
];

function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  return (
    <div className="app" dir="rtl">
      <header className="navbar">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span>متجرنا</span>
        </div>

        <nav>
          <a href="#home">الرئيسية</a>
          <a href="#categories">الأقسام</a>
          <a href="#offers">العروض</a>
          <a href="#contact">تواصل معنا</a>
        </nav>

        <div className="nav-actions">
          <button className="login-btn">تسجيل الدخول</button>

          <button className="cart-btn">
            🛒
            <span>{cart.length}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="badge">🔥 أفضل العروض الرقمية</div>

            <h1>
              بطاقاتك واشتراكاتك
              <br />
              <strong>بكل سهولة</strong>
            </h1>

            <p>
              متجر رقمي لشراء بطاقات الشحن والاشتراكات
              بسرعة وأمان.
            </p>

            <div className="hero-buttons">
              <a href="#categories" className="primary-btn">
                تصفح المنتجات
              </a>

              <a href="#offers" className="secondary-btn">
                مشاهدة العروض
              </a>
            </div>
          </div>

          <div className="hero-card">
            <div className="floating-card card-one">🎮</div>
            <div className="floating-card card-two">💳</div>
            <div className="main-card">
              <div className="card-glow"></div>
              <span>متجرنا</span>
              <strong>DIGITAL STORE</strong>
              <div className="card-chip">▦</div>
            </div>
          </div>
        </section>

        <section className="categories" id="categories">
          <div className="section-title">
            <span>اكتشف منتجاتنا</span>
            <h2>الأقسام الرئيسية</h2>
          </div>

          <div className="products-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-icon">{product.icon}</div>

                <h3>{product.name}</h3>

                <p>{product.description}</p>

                <button onClick={() => addToCart(product)}>
                  استعرض القسم ←
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="features">
          <div>
            <span>⚡</span>
            <h3>تسليم سريع</h3>
            <p>استلم منتجاتك الرقمية بسرعة.</p>
          </div>

          <div>
            <span>🔒</span>
            <h3>دفع آمن</h3>
            <p>حماية وأمان أثناء عملية الشراء.</p>
          </div>

          <div>
            <span>💬</span>
            <h3>دعم العملاء</h3>
            <p>نساعدك عند الحاجة.</p>
          </div>
        </section>

        <section className="offers" id="offers">
          <div>
            <span className="offer-label">عرض خاص</span>
            <h2>عروض رقمية مميزة</h2>
            <p>
              تابع أحدث المنتجات والعروض داخل متجرنا.
            </p>
          </div>

          <button>تصفح العروض</button>
        </section>
      </main>

      <footer id="contact">
        <div className="footer-logo">⚡ متجرنا</div>
        <p>متجر البطاقات والاشتراكات الرقمية</p>
        <small>© 2026 متجرنا — جميع الحقوق محفوظة</small>
      </footer>
    </div>
  );
}

export default App;