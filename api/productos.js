import { v4 as uuidv4 } from 'uuid';

let productos = [];

function authenticateToken(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token || token !== process.env.BEARER_TOKEN) return null;
  return { role: 'admin' };
}

function authorizeRole(user, roles) {
  return roles.includes(user.role);
}

export async function GET(req) {
  return new Response(JSON.stringify(productos), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req) {
  const user = authenticateToken(req);
  if (!user) return new Response('No autorizado', { status: 401 });
  if (!authorizeRole(user, ['admin', 'mantenedor'])) return new Response('Prohibido', { status: 403 });

  const body = await req.json();
  const { nombre, categoria, precio, stock, esPromocion, esNovedad } = body;

  if (!nombre || !categoria || precio == null || stock == null) {
    return new Response('Faltan campos requeridos', { status: 400 });
  }

  const nuevoProducto = {
    id: uuidv4(),
    nombre,
    categoria,
    precio,
    stock,
    esPromocion: esPromocion ?? false,
    esNovedad: esNovedad ?? false,
  };

  productos.push(nuevoProducto);

  return new Response(JSON.stringify(nuevoProducto), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(req) {
  const user = authenticateToken(req);
  if (!user) return new Response('No autorizado', { status: 401 });
  if (!authorizeRole(user, ['admin', 'mantenedor'])) return new Response('Prohibido', { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return new Response('ID requerido en query (?id=)', { status: 400 });

  const producto = productos.find(p => p.id === id);
  if (!producto) return new Response('Producto no encontrado', { status: 404 });

  const body = await req.json();
  const { nombre, categoria, precio, stock, esPromocion, esNovedad } = body;

  if (nombre) producto.nombre = nombre;
  if (categoria) producto.categoria = categoria;
  if (precio != null) producto.precio = precio;
  if (stock != null) producto.stock = stock;
  if (esPromocion != null) producto.esPromocion = esPromocion;
  if (esNovedad != null) producto.esNovedad = esNovedad;

  return new Response(JSON.stringify(producto), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
