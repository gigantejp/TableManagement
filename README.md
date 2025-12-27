# Table Management - Sistema de Gestión de Mesas con QR

Sistema completo de gestión de mesas con menú digital QR para restaurantes, cafeterías, heladerías y pizzerías.

## Características

- Landing Page con presentación del servicio
- Panel de Administración completo
- Gestión de marca (logo, nombre, descripción)
- Gestión de menú (categorías e items)
- Gestión de mesas con códigos QR
- Gestión de pedidos en tiempo real
- Vista del cliente con menú digital
- Sistema de notificaciones en tiempo real
- Carrito de compras
- Llamar al mesero
- Pedir la cuenta

## Despliegue en GitHub Pages

### Pasos para activar GitHub Pages:

1. **Ve a tu repositorio en GitHub:**
   ```
   https://github.com/gigantejp/TableManagement
   ```

2. **Ve a Settings (Configuración):**
   - Click en la pestaña "Settings" en tu repositorio

3. **Ve a Pages:**
   - En el menú lateral izquierdo, busca y haz click en "Pages"

4. **Configura la fuente de GitHub Pages:**
   - En "Build and deployment"
   - En "Source", selecciona: **GitHub Actions**
   - ¡NO selecciones "Deploy from a branch"!

5. **Activa el workflow manualmente (primera vez):**
   - Ve a la pestaña "Actions" en tu repositorio
   - Haz click en el workflow "Deploy to GitHub Pages"
   - Haz click en "Run workflow"
   - Selecciona la rama `claude/resume-project-session-SUI8J`
   - Haz click en el botón verde "Run workflow"

6. **Espera a que termine el deployment:**
   - El proceso tomará unos 2-3 minutos
   - Verás un check verde cuando esté completo

7. **Accede a tu sitio:**
   ```
   https://gigantejp.github.io/TableManagement/
   ```

### Deployments automáticos

Una vez configurado, el sitio se actualizará automáticamente cada vez que hagas push a la rama `claude/resume-project-session-SUI8J`.

## Desarrollo Local

```bash
cd restaurant-qr
npm install
npm run dev
```

El sitio estará disponible en `http://localhost:5173`

## Tecnologías

- React 19
- Vite 7
- Tailwind CSS 4
- Lucide React (iconos)
- QRCode.react

## Estructura del Proyecto

```
TableManagement/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── restaurant-qr/              # Aplicación principal
│   ├── src/
│   │   ├── App.jsx            # Componente principal
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js         # Configuración de Vite
│   └── tailwind.config.js
└── README.md
```

## Licencia

© 2024 Table Management. Todos los derechos reservados.
