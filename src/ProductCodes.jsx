import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

export default function ProductCodes({ products = [] }) {
  const [productId, setProductId] = useState("");
  const [codes, setCodes] = useState([]);
  const [newCodes, setNewCodes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(productId)),
    [products, productId]
  );

  async function syncProductStock() {
    if (!productId) return;

    const { count, error } = await supabase
      .from("product_codes")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId)
      .eq("status", "available");

    if (error) {
      console.error("Stock sync error:", error);
      return;
    }

    await supabase
      .from("products")
      .update({ stock: count || 0 })
      .eq("id", productId);
  }

  async function loadCodes() {
    if (!productId) {
      setCodes([]);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("product_codes")
      .select(
        "id,product_id,code,status,sold_to,sold_at,created_at"
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setCodes(data || []);
    }

    await syncProductStock();
    setLoading(false);
  }

  useEffect(() => {
    loadCodes();
  }, [productId]);

  async function addCodes() {
    const list = [
      ...new Set(
        newCodes
          .split(/\r?\n|,/)
          .map((code) => code.trim())
          .filter(Boolean)
      ),
    ];

    if (!productId) {
      alert("اختر المنتج أولاً");
      return;
    }

    if (!list.length) {
      alert("أدخل كودًا واحدًا على الأقل");
      return;
    }

    setSaving(true);

    const rows = list.map((code) => ({
      product_id: Number(productId),
      code,
      status: "available",
    }));

    const { error } = await supabase
      .from("product_codes")
      .insert(rows);

    if (error) {
      alert(error.message);
    } else {
      setNewCodes("");
      await loadCodes();
    }

    setSaving(false);
  }

  async function changeStatus(id, status) {
    const { error } = await supabase
      .from("product_codes")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setCodes((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );

    await syncProductStock();
  }

  async function deleteCode(id) {
    if (!confirm("هل تريد حذف هذا الكود؟")) return;

    const { error } = await supabase
      .from("product_codes")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setCodes((current) =>
      current.filter((item) => item.id !== id)
    );

    await syncProductStock();
  }

  const available = codes.filter(
    (x) => x.status === "available"
  ).length;

  const sold = codes.filter(
    (x) => x.status === "sold"
  ).length;

  const reserved = codes.filter(
    (x) => x.status === "reserved"
  ).length;

  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0 }}>🔐 أكواد المنتجات</h2>

        <p style={{ color: "#777", marginTop: 8 }}>
          إدارة الأكواد الرقمية الجاهزة للبيع وربطها بالمخزون تلقائيًا.
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e7e8ef",
          borderRadius: 18,
          padding: 20,
          marginBottom: 18,
        }}
      >
        <label
          style={{
            display: "block",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          اختر المنتج
        </label>

        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          style={{
            width: "100%",
            padding: "13px 14px",
            borderRadius: 12,
            border: "1px solid #d9dbe7",
            background: "#fff",
            color: "#20243c",
            fontSize: 15,
          }}
        >
          <option value="">اختر المنتج...</option>

          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.icon || "📦"} {product.name}
            </option>
          ))}
        </select>
      </div>

      {productId && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 18,
            }}
          >
            {[
              ["🟢", "متاح", available],
              ["🔴", "مباع", sold],
              ["🟡", "محجوز", reserved],
            ].map(([icon, title, value]) => (
              <div
                key={title}
                style={{
                  background: "#fff",
                  border: "1px solid #e7e8ef",
                  borderRadius: 16,
                  padding: 18,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22 }}>
                  {icon}
                </div>

                <div
                  style={{
                    color: "#777",
                    marginTop: 5,
                  }}
                >
                  {title}
                </div>

                <strong style={{ fontSize: 25 }}>
                  {value}
                </strong>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e7e8ef",
              borderRadius: 18,
              padding: 20,
              marginBottom: 18,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              إضافة أكواد إلى{" "}
              {selectedProduct?.name || "المنتج"}
            </h3>

            <textarea
              value={newCodes}
              onChange={(e) =>
                setNewCodes(e.target.value)
              }
              placeholder={
                "ضع كل كود في سطر مستقل\nCODE-001\nCODE-002\nCODE-003"
              }
              rows={7}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #d9dbe7",
                background: "#fff",
                color: "#20243c",
                fontSize: 14,
                resize: "vertical",
                direction: "ltr",
              }}
            />

            <button
              type="button"
              onClick={addCodes}
              disabled={saving}
              style={{
                marginTop: 12,
                width: "100%",
                border: 0,
                borderRadius: 12,
                padding: "13px 16px",
                background: "#4f46e5",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {saving
                ? "جاري الإضافة..."
                : "➕ إضافة الأكواد"}
            </button>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e7e8ef",
              borderRadius: 18,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              الأكواد الحالية
            </h3>

            {loading ? (
              <p>جاري تحميل الأكواد...</p>
            ) : codes.length === 0 ? (
              <p style={{ color: "#777" }}>
                لا توجد أكواد لهذا المنتج حتى الآن.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                {codes.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: 12,
                      border: "1px solid #eee",
                      borderRadius: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <code
                      style={{
                        flex: 1,
                        minWidth: 180,
                        direction: "ltr",
                        textAlign: "left",
                      }}
                    >
                      {item.code}
                    </code>

                    <select
                      value={item.status}
                      onChange={(e) =>
                        changeStatus(
                          item.id,
                          e.target.value
                        )
                      }
                      style={{
                        padding: "8px 10px",
                        borderRadius: 9,
                        border: "1px solid #ddd",
                        background: "#fff",
                      }}
                    >
                      <option value="available">
                        متاح
                      </option>

                      <option value="reserved">
                        محجوز
                      </option>

                      <option value="sold">
                        مباع
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        deleteCode(item.id)
                      }
                      style={{
                        border: 0,
                        background: "#fee2e2",
                        color: "#b91c1c",
                        borderRadius: 9,
                        padding: "8px 11px",
                        cursor: "pointer",
                      }}
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
