import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';

const app = express();
app.use(express.json());
const swaggerDocument = JSON.parse(fs.readFileSync('./swagger.json', 'utf-8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Middleware de autenticación básica (token fijo)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (token !== process.env.BEARER_TOKEN) return res.sendStatus(401);
  req.user = { role: 'admin' }; // Puedes adaptar esto
  next();
}

function authorizeRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.sendStatus(403);
    next();
  };
}

// ENDPOINTS

// GET todos los productos
app.get('/api/productos', (req, res) => {
  res.json(productos);
});

// POST crear producto
app.post('/api/productos', authenticateToken, authorizeRole(['admin', 'mantenedor']), (req, res) => {
  const { nombre, categoria, precio, stock, esPromocion, esNovedad } = req.body;
  if (!nombre || !categoria || precio == null || stock == null) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }

  const nuevoProducto = {
    id: uuidv4(),
    nombre,
    categoria,
    precio,
    stock,
    esPromocion: esPromocion ?? false,
    esNovedad: esNovedad ?? false
  };

  productos.push(nuevoProducto);
  res.status(201).json(nuevoProducto);
});

// PUT actualizar producto
app.put('/api/productos/:id', authenticateToken, authorizeRole(['admin', 'mantenedor']), (req, res) => {
  const producto = productos.find(p => p.id === req.params.id);
  if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

  const { nombre, categoria, precio, stock, esPromocion, esNovedad } = req.body;

  if (nombre) producto.nombre = nombre;
  if (categoria) producto.categoria = categoria;
  if (precio != null) producto.precio = precio;
  if (stock != null) producto.stock = stock;
  if (esPromocion != null) producto.esPromocion = esPromocion;
  if (esNovedad != null) producto.esNovedad = esNovedad;

  res.json(producto);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
