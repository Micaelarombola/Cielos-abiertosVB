const API_URL = "https://cielos-abiertos-vb-api.onrender.com/api/productos";
const form = document.getElementById("productoForm");
const productoId = document.getElementById("productoId");
const nombre = document.getElementById("nombre");
const precio = document.getElementById("precio");
const descripcion = document.getElementById("descripcion");
const categoria = document.getElementById("categoria");
const talles = document.getElementById("talles");
const colores = document.getElementById("colores");
const stock = document.getElementById("stock");
const imagen = document.getElementById("imagen");
const listaProductos = document.getElementById("listaProductos");
const submitBtn = document.getElementById("submitBtn");

let editando = false;

function resetFormulario() {
  form.reset();
  productoId.value = "";
  editando = false;

  if (submitBtn) {
    submitBtn.textContent = "Guardar producto";
  }

  const btnCancelar = document.getElementById("btnCancelar");
  if (btnCancelar) {
    btnCancelar.remove();
  }
}

function mostrarBotonCancelar() {
  let btnCancelar = document.getElementById("btnCancelar");

  if (!btnCancelar) {
    btnCancelar = document.createElement("button");
    btnCancelar.type = "button";
    btnCancelar.id = "btnCancelar";
    btnCancelar.textContent = "Cancelar edición";
    btnCancelar.style.background = "#999";
    btnCancelar.style.color = "#fff";
    btnCancelar.style.border = "none";
    btnCancelar.style.fontWeight = "700";
    btnCancelar.style.cursor = "pointer";

    btnCancelar.addEventListener("click", () => {
      resetFormulario();
    });

    form.appendChild(btnCancelar);
  }
}

async function cargarProductosAdmin() {
  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      throw new Error("No se pudieron obtener los productos");
    }

    const productos = await res.json();

    listaProductos.innerHTML = "";

    if (!productos.length) {
      listaProductos.innerHTML = "<p>No hay productos cargados todavía.</p>";
      return;
    }

    productos.forEach((producto) => {
      const div = document.createElement("div");
      div.className = "producto-admin";

      div.innerHTML = `
        ${producto.imagen ? `<img src="http://localhost:3000${producto.imagen}" alt="${producto.nombre}">` : ""}
        <h3>${producto.nombre}</h3>
        <p><strong>Precio:</strong> $${Number(producto.precio).toLocaleString("es-AR")}</p>
        <p><strong>Descripción:</strong> ${producto.descripcion || "-"}</p>
        <p><strong>Categoría:</strong> ${producto.categoria || "-"}</p>
        <p><strong>Talles:</strong> ${producto.talles || "-"}</p>
        <p><strong>Colores:</strong> ${producto.colores || "-"}</p>
        <p><strong>Stock:</strong> ${producto.stock ?? 0}</p>

        <div class="acciones">
          <button class="btn-editar" onclick="editarProducto(${producto.id})">Editar</button>
          <button class="btn-eliminar" onclick="eliminarProducto(${producto.id})">Eliminar</button>
        </div>
      `;

      listaProductos.appendChild(div);
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);
    listaProductos.innerHTML = "<p>Error al cargar productos.</p>";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!nombre.value.trim()) {
    alert("Por favor ingresá el nombre del producto.");
    return;
  }

  if (!precio.value || Number(precio.value) <= 0) {
    alert("Por favor ingresá un precio válido.");
    return;
  }

  const formData = new FormData();
  formData.append("nombre", nombre.value.trim());
  formData.append("precio", precio.value);
  formData.append("descripcion", descripcion.value.trim());
  formData.append("categoria", categoria.value);
  formData.append("talles", talles.value.trim());
  formData.append("colores", colores.value.trim());
  formData.append("stock", stock.value || 0);

  if (imagen.files[0]) {
    formData.append("imagen", imagen.files[0]);
  }

  try {
    let res;

    if (productoId.value) {
      res = await fetch(`${API_URL}/${productoId.value}`, {
        method: "PUT",
        body: formData
      });
    } else {
      res = await fetch(API_URL, {
        method: "POST",
        body: formData
      });
    }

    if (!res.ok) {
      throw new Error("No se pudo guardar el producto");
    }

    alert(productoId.value ? "Producto actualizado correctamente." : "Producto guardado correctamente.");

    resetFormulario();
    cargarProductosAdmin();
  } catch (error) {
    console.error("Error al guardar producto:", error);
    alert("Hubo un error al guardar el producto.");
  }
});

async function editarProducto(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);

    if (!res.ok) {
      throw new Error("No se pudo cargar el producto");
    }

    const producto = await res.json();

    productoId.value = producto.id;
    nombre.value = producto.nombre || "";
    precio.value = producto.precio || "";
    descripcion.value = producto.descripcion || "";
    categoria.value = producto.categoria || "";
    talles.value = producto.talles || "";
    colores.value = producto.colores || "";
    stock.value = producto.stock ?? 0;

    editando = true;

    if (submitBtn) {
      submitBtn.textContent = "Actualizar producto";
    }

    mostrarBotonCancelar();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  } catch (error) {
    console.error("Error al cargar producto para editar:", error);
    alert("No se pudo cargar el producto para editar.");
  }
}

async function eliminarProducto(id) {
  const confirmar = confirm("¿Seguro que querés eliminar este producto?");
  if (!confirmar) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error("No se pudo eliminar el producto");
    }

    alert("Producto eliminado correctamente.");
    cargarProductosAdmin();

    if (productoId.value === String(id)) {
      resetFormulario();
    }
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    alert("Hubo un error al eliminar el producto.");
  }
}

cargarProductosAdmin();