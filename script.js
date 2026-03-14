// Utilidades
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

/* ===============================
   CONFIG
================================ */
const WHATSAPP_NUMBER = "5491127283586";
const API_URL = "http://localhost:3000/api/productos";

let productosBackend = [];
let categoriaActual = "todos";

/* ===============================
   Menú mobile
================================ */
(function mobileMenu() {
  const toggle = $("#menuToggle");
  const menu = $("#mobileMenu");

  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    menu.classList.toggle("open");
  });

  $$("a", menu).forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
    });
  });
})();

/* ===============================
   Carrusel HERO
================================ */
(function heroSlider() {
  const root = $("#heroSlider");
  const dotsWrap = $("#heroDots");

  if (!root || !dotsWrap) return;

  const imgs = $$("img", root);
  if (!imgs.length) return;

  let i = 0;
  let timer = null;
  const delay = 3500;
  let paused = false;

  imgs.forEach((_, idx) => {
    const b = document.createElement("button");
    b.addEventListener("click", () => {
      i = idx;
      sync(true);
    });
    dotsWrap.appendChild(b);
  });

  const dots = $$("button", dotsWrap);

  function sync(byUser = false) {
    imgs.forEach((im, idx) => im.classList.toggle("active", idx === i));
    dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
    if (byUser) restart();
  }

  function next() {
    i = (i + 1) % imgs.length;
    sync();
  }

  function start() {
    timer = setInterval(next, delay);
  }

  function stop() {
    clearInterval(timer);
  }

  function restart() {
    stop();
    start();
  }

  root.addEventListener("mouseenter", () => {
    paused = true;
    stop();
  });

  root.addEventListener("mouseleave", () => {
    if (paused) {
      paused = false;
      start();
    }
  });

  sync();
  start();
})();

/* ===============================
   Productos desde backend
================================ */
async function cargarProductos() {
  const el = $("#productGrid");
  if (!el) return;

  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      throw new Error("No se pudo obtener la lista de productos");
    }

    productosBackend = await res.json();
    renderProductos();
  } catch (error) {
    console.error("Error al cargar productos:", error);
    el.innerHTML = `<p class="muted">No se pudieron cargar los productos.</p>`;
  }
}

function renderProductos() {
  const el = $("#productGrid");
  if (!el) return;

  el.innerHTML = "";

  let productosFiltrados = productosBackend;

  if (categoriaActual !== "todos") {
    productosFiltrados = productosBackend.filter((p) => {
      return (p.categoria || "").toLowerCase() === categoriaActual;
    });
  }

  if (!productosFiltrados.length) {
    el.innerHTML = `<p class="muted">No hay productos cargados en esta categoría.</p>`;
    return;
  }

  productosFiltrados.forEach((p) => {
    const nombre = p.nombre || "Producto";
    const precio = Number(p.precio) || 0;
    const imagen = p.imagen ? `http://localhost:3000${p.imagen}` : "";
    const colores = p.colores || "-";
    const talles = p.talles || "-";
    const categoria = p.categoria || "-";
    const descripcion = p.descripcion || "";
    const stock = p.stock ?? 0;

    const card = document.createElement("div");
    card.className = "p-card";

    card.innerHTML = `
      <div class="thumb" style="aspect-ratio:3/4; background:#f8f8fc;">
        ${
          imagen
            ? `<img src="${imagen}" alt="${nombre}" style="width:100%;height:100%;object-fit:cover;">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#888;padding:20px;text-align:center;">
                 Sin imagen
               </div>`
        }
      </div>

      <div class="info">
        <h4>${nombre}</h4>
        <div class="price">
          <span class="now">$ ${precio.toLocaleString("es-AR")}</span>
        </div>

        ${descripcion ? `<p class="meta-line"><b>Descripción:</b> ${descripcion}</p>` : ""}
        <p class="meta-line"><b>Categoría:</b> ${categoria}</p>
        <p class="meta-line"><b>Colores:</b> ${colores}</p>
        <p class="meta-line"><b>Talles:</b> ${talles}</p>
        <p class="meta-line"><b>Stock:</b> ${stock}</p>

        <button class="add" data-name="${nombre}" data-price="${precio}">
          Agregar al carrito
        </button>
      </div>
    `;

    el.appendChild(card);
  });
}

function initFiltrosCategorias() {
  const botones = $$(".cat-btn");
  if (!botones.length) return;

  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoriaActual = btn.dataset.cat || "todos";

      botones.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      renderProductos();
    });
  });
}

/* ===============================
   Carrito simple + Drawer
================================ */
const cart = [];

function money(n) {
  return Number(n).toLocaleString("es-AR");
}

function renderCart() {
  const box = $("#cartItems");
  if (!box) return;

  box.innerHTML = "";

  if (cart.length === 0) {
    box.innerHTML = `<p class="muted">Tu carrito está vacío.</p>`;
  } else {
    cart.forEach((it, index) => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <div>
          <span>${it.name} × ${it.qty}</span><br>
          <small class="muted">$ ${money(it.price)} c/u</small>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <b>$ ${money(it.price * it.qty)}</b>
          <button class="remove-item" data-index="${index}" style="border:none;background:#eee;border-radius:8px;padding:6px 10px;cursor:pointer;">
            ✕
          </button>
        </div>
      `;
      box.appendChild(row);
    });
  }

  const subt = cart.reduce((a, b) => a + b.price * b.qty, 0);

  $("#subtot").textContent = money(subt);
  $("#recargo").textContent = money(0);
  $("#total").textContent = money(subt);
  $("#cartCount").textContent = cart.reduce((a, b) => a + b.qty, 0);
}

function addToCart(name, price) {
  const exist = cart.find((x) => x.name === name && x.price === price);

  if (exist) {
    exist.qty++;
  } else {
    cart.push({ name, price, qty: 1 });
  }

  renderCart();
  drawer(true);
}

function removeFromCart(index) {
  if (cart[index]) {
    cart.splice(index, 1);
    renderCart();
  }
}

function buildWhatsAppMessage() {
  if (!cart.length) {
    return encodeURIComponent("Hola! Quiero consultar por productos de Cielos Abiertos VB.");
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  let message = "Hola! Quiero hacer este pedido:\n\n";

  cart.forEach((item) => {
    message += `• ${item.name} x${item.qty} - $ ${money(item.price * item.qty)}\n`;
  });

  message += `\n`;
  message += `Total: $ ${money(subtotal)}\n\n`;
  message += `Quedo a la espera para coordinar la compra 😊`;

  return encodeURIComponent(message);
}

function sendCartToWhatsApp() {
  if (!cart.length) {
    alert("El carrito está vacío.");
    return;
  }

  const message = buildWhatsAppMessage();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  window.open(url, "_blank");
}

/* ===============================
   Delegación general de clicks
================================ */
document.addEventListener("click", (e) => {
  const addBtn = e.target.closest(".add");
  if (addBtn) {
    const name = addBtn.dataset.name || "Producto";
    const price = Number(addBtn.dataset.price || 0);
    addToCart(name, price);
    return;
  }

  const removeBtn = e.target.closest(".remove-item");
  if (removeBtn) {
    const index = Number(removeBtn.dataset.index);
    removeFromCart(index);
  }
});

/* ===============================
   Drawer open/close
================================ */
const drawerEl = $("#drawer");

function drawer(open) {
  drawerEl?.classList.toggle("active", !!open);
  document.body.classList.toggle("no-scroll", !!open);
}

$("#openCart")?.addEventListener("click", () => drawer(true));
$("#closeCart")?.addEventListener("click", () => drawer(false));
$("#closeX")?.addEventListener("click", () => drawer(false));

/* ===============================
   Checkout WhatsApp
================================ */
$("#checkout")?.addEventListener("click", (e) => {
  e.preventDefault();
  sendCartToWhatsApp();
});

/* ===============================
   Footer año
================================ */
const yearEl = $("#year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

/* ===============================
   Scroll suave
================================ */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (!id || id.length <= 1) return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    const headerOffset = 90;
    const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top,
      behavior: "smooth"
    });
  });
});

/* ===============================
   Inicialización
================================ */
renderCart();
initFiltrosCategorias();
cargarProductos();