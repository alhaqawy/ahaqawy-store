export default function ProductDetails({ product, onBack, onAddToCart }) {
  if (!product) {
    return null;
  }

  const price =
    typeof product.price === "number"
      ? product.price
      : Number(product.price || 0);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f7f8fc",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            border: "none",
            background: "transparent",
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← العودة للمنتجات
        </button>

        <section
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1fr) minmax(260px, 1.2fr)",
            gap: "30px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              minHeight: "260px",
              borderRadius: "18px",
              background: "#f1f3f8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "260px",
                  objectFit: "contain",
                }}
              />
            ) : (
              <span style={{ fontSize: "90px" }}>
                {product.icon || "🛍️"}
              </span>
            )}
          </div>

          <div>
            <div
              style={{
                display: "inline-block",
                background: "#eef1ff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "14px",
                marginBottom: "12px",
              }}
            >
              {product.category || "منتج"}
            </div>

            <h1
              style={{
                margin: "0 0 12px",
                fontSize: "32px",
              }}
            >
              {product.name}
            </h1>

            <p
              style={{
                color: "#666",
                lineHeight: "1.8",
                marginBottom: "24px",
              }}
            >
              {product.description || "لا يوجد وصف لهذا المنتج."}
            </p>

            <div
              style={{
                borderTop: "1px solid #eee",
                paddingTop: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#777",
                  marginBottom: "6px",
                }}
              >
                السعر
              </div>

              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  marginBottom: "20px",
                }}
              >
                {price.toFixed(2)} <span style={{ fontSize: "18px" }}>SAR</span>
              </div>

              <button
                type="button"
                onClick={() => onAddToCart(product)}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px 20px",
                  background: "#111827",
                  color: "#fff",
                  fontSize: "17px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                أضف للسلة
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
