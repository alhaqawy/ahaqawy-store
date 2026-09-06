import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import ProductCodes from "./ProductCodes";

const menu = [
  ["dashboard", "📊", "الرئيسية"],
  ["orders", "🧾", "الطلبات"],
  ["codes", "🔐", "أكواد المنتجات"],
  ["products", "📦", "المنتجات"],
  ["inventory", "🧠", "المخزون"],
  ["customers", "👥", "العملاء"],
  ["payments", "💳", "المدفوعات"],
  ["transfers", "🏦", "التحويلات البنكية"],
  ["coupons", "🎟️", "الكوبونات"],
  ["analytics", "📈", "التحليلات"],
  ["reports", "📑", "التقارير"],
  ["notifications", "🔔", "التنبيهات"],
  ["automation", "🤖", "الأتمتة"],
  ["staff", "👤", "الموظفون والصلاحيات"],
  ["activity", "📝", "سجل العمليات"],
  ["settings", "⚙️", "الإعدادات"],
  ["product-codes", "🔑", "أكواد المنتجات"],
];


const emptyProduct = {
  name: "",
  category: "",
  icon: "📦",
  description: "",
  price: "",
  stock: "",
  image_url: "",
  is_active: true,
};

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e7e8ef",
        borderRadius: 18,
        boxShadow: "0 5px 20px rgba(20,25,60,.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ icon, title, value, subtitle }) {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ color: "#777", fontSize: 13 }}>{title}</div>
          <div
            style={{
              color: "#20243c",
              fontSize: 25,
              fontWeight: 900,
              marginTop: 8,
            }}
          >
            {value}
          </div>
          {subtitle && (
            <div style={{ color: "#999", fontSize: 12, marginTop: 6 }}>
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            width: 45,
            height: 45,
            borderRadius: 14,
            background: "#f0f1ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboard({ onExit }) {
  // ADMIN_ACCESS_CHECK
  const [adminChecking, setAdminChecking] = useState(true);
  const [adminAllowed, setAdminAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) {
          setAdminAllowed(false);
          setAdminChecking(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (mounted) {
        setAdminAllowed(!error && data?.is_admin === true);
        setAdminChecking(false);
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        { data: productsData, error: productsError },
        { data: customersData, error: customersError },
        { data: paymentData, error: paymentError },
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id,name,category,icon,description,price,image_url,is_active,stock,created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("profiles")
          .select(
            "id,full_name,phone,email,account_type,is_active,last_login_at,notes,created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("payment_settings")
          .select(
            "id,mada_enabled,visa_enabled,apple_pay_enabled,stc_bank_enabled,bank_transfer_enabled,bank_name,account_name,account_number,iban"
          )
          .limit(1)
          .maybeSingle(),
      ]);

      if (productsError) throw productsError;
      if (customersError) throw customersError;
      if (paymentError) throw paymentError;

      setProducts(productsData || []);
      setCustomers(customersData || []);
      setPaymentSettings(paymentData || null);
    } catch (err) {
      console.error(err);
      setError(err?.message || "تعذر تحميل بيانات لوحة التحكم.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (adminChecking) {
    return <div dir="rtl" style={{ padding: "40px", textAlign: "center" }}>جاري التحقق...</div>;
  }

  if (!adminAllowed) {
    return (
      <div dir="rtl" style={{ padding: "40px", textAlign: "center" }}>
        <h2>غير مصرح</h2>
        <p>هذه الصفحة متاحة للمشرف فقط.</p>
        {onExit && (
          <button type="button" onClick={onExit}>العودة</button>
        )}
      </div>
    );
  }

  const activeProducts = products.filter((p) => p.is_active);
  const hiddenProducts = products.filter((p) => !p.is_active);

  const lowStock = products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 10);
  const outOfStock = products.filter((p) => Number(p.stock) <= 0);

  const totalInventoryUnits = products.reduce(
    (sum, p) => sum + Number(p.stock || 0),
    0
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return products;

    return products.filter((product) =>
      [
        product.name,
        product.category,
        product.description,
        String(product.id),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [products, search]);

  function openAddProduct() {
    setEditingProduct(null);
    setProductForm(emptyProduct);
    setShowProductForm(true);
    setError("");
  }

  function openEditProduct(product) {
    setEditingProduct(product);
    setProductForm({
      name: product.name || "",
      category: product.category || "",
      icon: product.icon || "📦",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      image_url: product.image_url || "",
      is_active: Boolean(product.is_active),
    });
    setShowProductForm(true);
    setError("");
  }

  async function saveProduct(event) {
    event.preventDefault();

    if (!productForm.name.trim()) {
      setError("اسم المنتج مطلوب.");
      return;
    }

    if (!productForm.category.trim()) {
      setError("التصنيف مطلوب.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: productForm.name.trim(),
        category: productForm.category.trim(),
        icon: productForm.icon || "📦",
        description: productForm.description.trim(),
        price: Number(productForm.price || 0),
        stock: Math.max(0, Number(productForm.stock || 0)),
        image_url: productForm.image_url.trim() || null,
        is_active: Boolean(productForm.is_active),
      };

      if (editingProduct) {
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert(payload);

        if (insertError) throw insertError;
      }

      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm(emptyProduct);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err?.message || "تعذر حفظ المنتج.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product) {
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("products")
        .update({ is_active: !product.is_active })
        .eq("id", product.id);

      if (updateError) throw updateError;

      await loadData();
    } catch (err) {
      console.error(err);
      setError(err?.message || "تعذر تغيير حالة المنتج.");
    }
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `هل تريد حذف المنتج "${product.name}" نهائيًا؟`
    );

    if (!confirmed) return;

    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (deleteError) throw deleteError;

      await loadData();
    } catch (err) {
      console.error(err);
      setError(err?.message || "تعذر حذف المنتج.");
    }
  }

  const currentLabel =
    menu.find(([id]) => id === active)?.[2] || "الرئيسية";

  function renderDashboard() {
    return (
      <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(205px,1fr))",
            gap: 16,
          }}
        >
          <StatCard
            icon="📦"
            title="إجمالي المنتجات"
            value={products.length}
            subtitle={`${activeProducts.length} منتج نشط`}
          />

          <StatCard
            icon="🧠"
            title="وحدات المخزون"
            value={totalInventoryUnits}
            subtitle={`${lowStock.length} منتجات منخفضة المخزون`}
          />

          <StatCard
            icon="⚠️"
            title="نفد المخزون"
            value={outOfStock.length}
            subtitle="منتجات تحتاج إعادة توفير"
          />

          <StatCard
            icon="👥"
            title="العملاء"
            value={customers.length}
            subtitle="حسابات مسجلة فعليًا"
          />

          <StatCard
            icon="👁️"
            title="منتجات مخفية"
            value={hiddenProducts.length}
            subtitle="غير ظاهرة للعملاء"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,2fr) minmax(280px,1fr)",
            gap: 16,
            marginTop: 18,
          }}
        >
          <Card style={{ padding: 22 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>حالة المتجر</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gap: 12,
                marginTop: 18,
              }}
            >
              <div style={{ background: "#f7f8fc", padding: 16, borderRadius: 14 }}>
                <div style={{ color: "#777", fontSize: 12 }}>منتجات نشطة</div>
                <strong style={{ display: "block", fontSize: 23, marginTop: 6 }}>
                  {activeProducts.length}
                </strong>
              </div>

              <div style={{ background: "#f7f8fc", padding: 16, borderRadius: 14 }}>
                <div style={{ color: "#777", fontSize: 12 }}>مخزون منخفض</div>
                <strong style={{ display: "block", fontSize: 23, marginTop: 6 }}>
                  {lowStock.length}
                </strong>
              </div>

              <div style={{ background: "#f7f8fc", padding: 16, borderRadius: 14 }}>
                <div style={{ color: "#777", fontSize: 12 }}>بدون مخزون</div>
                <strong style={{ display: "block", fontSize: 23, marginTop: 6 }}>
                  {outOfStock.length}
                </strong>
              </div>

              <div style={{ background: "#f7f8fc", padding: 16, borderRadius: 14 }}>
                <div style={{ color: "#777", fontSize: 12 }}>طرق الدفع المفعلة</div>
                <strong style={{ display: "block", fontSize: 23, marginTop: 6 }}>
                  {paymentSettings
                    ? [
                        paymentSettings.mada_enabled,
                        paymentSettings.visa_enabled,
                        paymentSettings.apple_pay_enabled,
                        paymentSettings.stc_bank_enabled,
                        paymentSettings.bank_transfer_enabled,
                      ].filter(Boolean).length
                    : 0}
                </strong>
              </div>
            </div>
          </Card>

          <Card style={{ padding: 22 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>⚡ يحتاج انتباهك</h2>

            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {outOfStock.length > 0 && (
                <div
                  style={{
                    padding: 13,
                    borderRadius: 12,
                    background: "#fff1f2",
                    color: "#9f1239",
                    fontSize: 13,
                  }}
                >
                  🔴 يوجد {outOfStock.length} منتج بدون مخزون.
                </div>
              )}

              {lowStock.length > 0 && (
                <div
                  style={{
                    padding: 13,
                    borderRadius: 12,
                    background: "#fff7ed",
                    color: "#9a3412",
                    fontSize: 13,
                  }}
                >
                  🟠 يوجد {lowStock.length} منتج منخفض المخزون.
                </div>
              )}

              {outOfStock.length === 0 && lowStock.length === 0 && (
                <div
                  style={{
                    padding: 13,
                    borderRadius: 12,
                    background: "#f0fdf4",
                    color: "#166534",
                    fontSize: 13,
                  }}
                >
                  🟢 لا توجد مشاكل في المخزون حاليًا.
                </div>
              )}
            </div>
          </Card>
        </div>
      </>
    );
  }

  function renderProducts() {
    return (
      <>
        <Card style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>📦 إدارة المنتجات</h2>
              <p style={{ color: "#777", fontSize: 13, marginBottom: 0 }}>
                هذه البيانات مرتبطة مباشرة بقاعدة بيانات Supabase.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddProduct}
              style={{
                border: 0,
                background: "#474bd6",
                color: "#fff",
                padding: "11px 17px",
                borderRadius: 11,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              + إضافة منتج
            </button>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="بحث عن منتج..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginTop: 18,
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: 11,
              outline: "none",
            }}
          />
        </Card>

        <Card style={{ overflow: "hidden", marginTop: 16 }}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 850,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#fafbfc" }}>
                  {[
                    "المنتج",
                    "التصنيف",
                    "السعر",
                    "المخزون",
                    "الحالة",
                    "الإجراءات",
                  ].map((title) => (
                    <th
                      key={title}
                      style={{
                        textAlign: "right",
                        padding: "14px 16px",
                        color: "#777",
                        fontSize: 12,
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={{ padding: "15px 16px", fontWeight: 800 }}>
                      {product.icon || "📦"} {product.name}
                    </td>

                    <td style={{ padding: "15px 16px" }}>
                      {product.category}
                    </td>

                    <td style={{ padding: "15px 16px", fontWeight: 800 }}>
                      {Number(product.price || 0).toFixed(2)} SAR
                    </td>

                    <td style={{ padding: "15px 16px" }}>
                      <span
                        style={{
                          fontWeight: 900,
                          color:
                            Number(product.stock) <= 0
                              ? "#b91c1c"
                              : Number(product.stock) <= 10
                              ? "#c2410c"
                              : "#166534",
                        }}
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td style={{ padding: "15px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: product.is_active
                            ? "#dcfce7"
                            : "#f3f4f6",
                          color: product.is_active
                            ? "#166534"
                            : "#6b7280",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {product.is_active ? "نشط" : "مخفي"}
                      </span>
                    </td>

                    <td style={{ padding: "15px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 7,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => openEditProduct(product)}
                          style={{
                            border: 0,
                            background: "#eef0ff",
                            color: "#3f43c8",
                            padding: "7px 10px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          تعديل
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleProduct(product)}
                          style={{
                            border: 0,
                            background: "#f3f4f6",
                            color: "#374151",
                            padding: "7px 10px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          {product.is_active ? "إخفاء" : "إظهار"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteProduct(product)}
                          style={{
                            border: 0,
                            background: "#fee2e2",
                            color: "#991b1b",
                            padding: "7px 10px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: 35,
                        color: "#888",
                      }}
                    >
                      لا توجد منتجات.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    );
  }

  function renderInventory() {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        <StatCard
          icon="📦"
          title="إجمالي وحدات المخزون"
          value={totalInventoryUnits}
        />

        <StatCard
          icon="🟠"
          title="مخزون منخفض"
          value={lowStock.length}
          subtitle="10 وحدات أو أقل"
        />

        <StatCard
          icon="🔴"
          title="نفد المخزون"
          value={outOfStock.length}
        />
      </div>
    );
  }

  function renderCustomers() {
    const q = search.trim().toLowerCase();

    const filteredCustomers = customers.filter((customer) =>
      [
        customer.full_name,
        customer.phone,
        customer.email,
        customer.account_type,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );

    function formatDate(value) {
      if (!value) return "—";

      return new Intl.DateTimeFormat("ar-SA", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    }

    return (
      <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <StatCard
            icon="👥"
            title="إجمالي العملاء"
            value={customers.length}
            subtitle="من قاعدة البيانات"
          />

          <StatCard
            icon="🟢"
            title="الحسابات النشطة"
            value={customers.filter((c) => c.is_active).length}
          />

          <StatCard
            icon="🔴"
            title="الحسابات الموقوفة"
            value={customers.filter((c) => !c.is_active).length}
          />
        </div>

        <Card style={{ padding: 20 }}>
          <div>
            <h2 style={{ margin: 0 }}>👥 العملاء</h2>
            <p style={{ color: "#777", fontSize: 13 }}>
              بيانات العملاء المسجلين فعليًا في المتجر.
            </p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بالاسم أو الجوال أو البريد..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginTop: 15,
              padding: "12px 14px",
              border: "1px solid #d8dbe7",
              borderRadius: 11,
              background: "#fff",
              color: "#20243c",
            }}
          />
        </Card>

        <Card style={{ overflow: "hidden", marginTop: 16 }}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 950,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#fafbfc" }}>
                  {[
                    "العميل",
                    "الجوال",
                    "البريد الإلكتروني",
                    "نوع الحساب",
                    "التسجيل",
                    "آخر دخول",
                    "الحالة",
                  ].map((title) => (
                    <th
                      key={title}
                      style={{
                        textAlign: "right",
                        padding: "14px 16px",
                        color: "#777",
                        fontSize: 12,
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td
                      style={{
                        padding: "15px 16px",
                        fontWeight: 800,
                      }}
                    >
                      {customer.full_name || "بدون اسم"}
                    </td>

                    <td style={{ padding: "15px 16px" }}>
                      {customer.phone || "—"}
                    </td>

                    <td style={{ padding: "15px 16px" }}>
                      {customer.email || "—"}
                    </td>

                    <td style={{ padding: "15px 16px" }}>
                      {customer.account_type === "email"
                        ? "بريد إلكتروني"
                        : customer.account_type === "phone"
                        ? "جوال"
                        : customer.account_type || "—"}
                    </td>

                    <td style={{ padding: "15px 16px", fontSize: 12 }}>
                      {formatDate(customer.created_at)}
                    </td>

                    <td style={{ padding: "15px 16px", fontSize: 12 }}>
                      {formatDate(customer.last_login_at)}
                    </td>

                    <td style={{ padding: "15px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: customer.is_active
                            ? "#dcfce7"
                            : "#fee2e2",
                          color: customer.is_active
                            ? "#166534"
                            : "#991b1b",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {customer.is_active ? "نشط" : "موقوف"}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredCustomers.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "#888",
                      }}
                    >
                      لا توجد حسابات مطابقة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    );
  }

  
function renderThemeSettings() {
    return (
      <div>
        <h2 style={{ marginBottom: 8 }}>🎨 ستايل الموقع</h2>
        <p style={{ color: "#777", marginTop: 0, marginBottom: 24 }}>
          اختر التصميم المناسب لمتجرك. يمكنك تغييره في أي وقت.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
          }}
        >
          {SITE_THEMES.map((theme) => {
            const selected = siteTheme === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSiteTheme(theme.id)}
                style={{
                  textAlign: "right",
                  padding: 0,
                  overflow: "hidden",
                  cursor: "pointer",
                  borderRadius: 18,
                  border: selected
                    ? `3px solid ${theme.accent}`
                    : "1px solid #e5e7eb",
                  background: "#fff",
                  boxShadow: selected
                    ? `0 8px 25px ${theme.accent}33`
                    : "0 4px 14px rgba(0,0,0,.06)",
                }}
              >
                <div
                  style={{
                    height: 110,
                    background: theme.preview,
                    padding: 16,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "65%",
                      height: 12,
                      borderRadius: 6,
                      background: theme.accent,
                      marginBottom: 12,
                    }}
                  />
                  <div
                    style={{
                      width: "90%",
                      height: 8,
                      borderRadius: 4,
                      background: theme.id === "luxury"
                        ? "#444"
                        : "#d1d5db",
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      width: "75%",
                      height: 8,
                      borderRadius: 4,
                      background: theme.id === "luxury"
                        ? "#333"
                        : "#e5e7eb",
                    }}
                  />
                </div>

                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    {theme.name}
                  </div>

                  <div style={{ color: "#777", fontSize: 13 }}>
                    {theme.description}
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      color: theme.accent,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {selected ? "✓ التصميم الحالي" : "اختيار التصميم"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

function renderPlaceholder() {
    return (
      <Card style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 42 }}>
          {menu.find(([id]) => id === active)?.[1]}
        </div>

        <h2 style={{ marginBottom: 8 }}>{currentLabel}</h2>

        <p style={{ color: "#777", margin: 0 }}>
          سيتم ربط هذا القسم بالبيانات الحقيقية في المرحلة التالية.
        </p>
      </Card>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "auto",
        zIndex: 5000,
        background: "#f5f6fa",
        color: "#20243c",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {sidebarOpen && (
          <aside
            style={{
              width: 250,
              background: "#20233b",
              color: "#fff",
              flexShrink: 0,
              padding: "18px 12px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                padding: "8px 12px 20px",
                borderBottom: "1px solid rgba(255,255,255,.1)",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 900 }}>
                لوحة التحكم
              </div>

              <div
                style={{
                  color: "#aeb2cb",
                  fontSize: 12,
                  marginTop: 5,
                }}
              >
                إدارة المتجر
              </div>
            </div>

            <nav
              style={{
                display: "grid",
                gap: 4,
                maxHeight: "calc(100vh - 125px)",
                overflowY: "auto",
              }}
            >
              {menu.map(([id, icon, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActive(id)}
                  style={{
                    border: 0,
                    borderRadius: 10,
                    padding: "11px 12px",
                    background:
                      active === id
                        ? "rgba(100,105,255,.24)"
                        : "transparent",
                    color: active === id ? "#fff" : "#bdc0d2",
                    cursor: "pointer",
                    textAlign: "right",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    fontWeight: active === id ? 800 : 500,
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        <main style={{ flex: 1, minWidth: 0 }}>
          <header
            style={{
              height: 70,
              background: "#fff",
              borderBottom: "1px solid #e7e8ef",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              boxSizing: "border-box",
              position: "sticky",
              top: 0,
              zIndex: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => setSidebarOpen((value) => !value)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                ☰
              </button>

              <div>
                <div style={{ color: "#999", fontSize: 11 }}>
                  لوحة التحكم
                </div>

                <strong>{currentLabel}</strong>
              </div>
            </div>

            {onExit && (
              <button
                type="button"
                onClick={onExit}
                style={{
                  border: 0,
                  background: "#f1f2f7",
                  padding: "10px 14px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                العودة للمتجر
              </button>
            )}
          </header>

          <section
            style={{
              padding: 22,
              maxWidth: 1500,
              margin: "0 auto",
              boxSizing: "border-box",
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ margin: 0, fontSize: 25 }}>
                {active === "dashboard"
                  ? "نظرة عامة على المتجر"
                  : currentLabel}
              </h1>

              <p style={{ color: "#888", fontSize: 13 }}>
                البيانات المعروضة هنا مأخوذة من قاعدة البيانات مباشرة.
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: "#fff1f2",
                  color: "#9f1239",
                  border: "1px solid #fecdd3",
                  padding: 13,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            {loading ? (
              <Card style={{ padding: 40, textAlign: "center" }}>
                جاري تحميل بيانات المتجر...
              </Card>
            ) : (
              <>
                {active === "dashboard" && renderDashboard()}
                {active === "codes" && <ProductCodes products={products} />}
          {active === "products" && renderProducts()}
                {active === "inventory" && renderInventory()}
          {active === "product-codes" && <ProductCodes products={products} />}
                {active === "customers" && renderCustomers()}

                {active !== "dashboard" &&
                  active !== "products" &&
                  active !== "inventory" &&
                  active !== "customers" &&
                  renderPlaceholder()}
              </>
            )}
          </section>
        </main>
      </div>

      {showProductForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,12,25,.6)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "min(620px,100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 18,
              padding: 22,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0 }}>
                {editingProduct ? "تعديل المنتج" : "إضافة منتج"}
              </h2>

              <button
                type="button"
                onClick={() => setShowProductForm(false)}
                style={{
                  border: 0,
                  background: "#f3f4f6",
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveProduct}>
              {[
                ["name", "اسم المنتج", "text"],
                ["icon", "الأيقونة", "text"],
                ["price", "السعر", "number"],
                ["stock", "المخزون", "number"],
                ["image_url", "رابط الصورة", "url"],
              ].map(([field, label, type]) => (
                <label
                  key={field}
                  style={{
                    display: "block",
                    marginTop: 14,
                    fontWeight: 700,
                    fontSize: 13,
                    color: "#20243c",
                  }}
                >
                  {label}

                  <input
                    type={type}
                    value={productForm[field]}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      marginTop: 7,
                      padding: "11px 12px",
                      border: "1px solid #d8dbe7",
                      borderRadius: 10,
                      background: "#fff",
                      color: "#20243c",
                      WebkitTextFillColor: "#20243c",
                    }}
                  />
                </label>
              ))}

              <label
                style={{
                  display: "block",
                  marginTop: 14,
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#20243c",
                }}
              >
                التصنيف

                <select
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    marginTop: 7,
                    padding: "11px 12px",
                    border: "1px solid #d8dbe7",
                    borderRadius: 10,
                    background: "#fff",
                    color: "#20243c",
                    WebkitTextFillColor: "#20243c",
                  }}
                >
                  <option value="">اختر التصنيف</option>
                  <option value="ألعاب">🎮 ألعاب</option>
                  <option value="بطاقات">🎁 بطاقات</option>
                  <option value="اشتراكات">📺 اشتراكات</option>
                  <option value="خدمات">🛠️ خدمات</option>
                  <option value="أخرى">📦 أخرى</option>
                </select>
              </label>

              <label
                style={{
                  display: "block",
                  marginTop: 14,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                الوصف

                <textarea
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    marginTop: 7,
                    padding: "11px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    resize: "vertical",
                  }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 15,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <input
                  type="checkbox"
                  checked={productForm.is_active}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                />
                المنتج ظاهر للعملاء
              </label>

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: "100%",
                  marginTop: 20,
                  border: 0,
                  background: "#474bd6",
                  color: "#fff",
                  padding: 13,
                  borderRadius: 11,
                  fontWeight: 900,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? "جاري الحفظ..."
                  : editingProduct
                  ? "حفظ التعديلات"
                  : "إضافة المنتج"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
