# Implementación del Sistema de Sesiones de Mesa

## Cambios Implementados

### 1. Base de Datos (Supabase)
Se ha creado el esquema completo para sesiones de mesa en el archivo `supabase-sessions-schema.sql`.

**Nuevas tablas:**
- `table_sessions` - Gestiona las sesiones activas de cada mesa
- `cart_items` - Items en el carrito que aún no se han enviado a cocina

**Modificaciones:**
- Tabla `orders`: Agregado campo `session_id` y actualizados estados a:
  - `Solicitado` (nuevo estado inicial)
  - `En proceso` (en preparación)
  - `Completado` (entregado)
  - `Cancelado`

**Funciones helper:**
- `generate_session_code()` - Genera código único para cada sesión
- `get_active_session()` - Obtiene sesión activa de una mesa
- `update_session_total()` - Actualiza el total de una sesión
- Triggers automáticos para actualizar estado de mesas y totales

### 2. Frontend - Vista Móvil (ClientView)
**Nuevo componente:** `restaurant-qr/src/components/ClientView.jsx`

**Funcionalidades:**
- ✅ Detección automática de sesión activa al escanear QR
- ✅ Creación de nueva sesión si no existe
- ✅ Carga de sesión existente si ya está activa
- ✅ Carrito persistente sincronizado con base de datos
- ✅ Vista de cuenta en tiempo real con total de la sesión
- ✅ Pago que cierra la sesión automáticamente
- ✅ Suscripción en tiempo real a cambios en el carrito y pedidos

**Flujo:**
1. Usuario escanea QR de mesa
2. Sistema verifica si hay sesión activa
3. Si existe → carga sesión con carrito y pedidos
4. Si no existe → crea nueva sesión
5. Usuario agrega productos al carrito (persistente)
6. Al "Enviar a Cocina" → crea pedido con estado "Solicitado" y limpia carrito
7. Usuario puede ver su cuenta total en cualquier momento
8. Al pagar → sesión se cierra automáticamente

### 3. Frontend - Panel Admin
**Actualizaciones en `OrdersManagement`:**

**Gestión de Sesiones:**
- Vista de sesiones activas con total acumulado
- Detalles de pedidos por sesión
- Botón para finalizar sesión desde admin

**Gestión de Pedidos:**
- Organización por estado (Solicitado, En proceso, Completado)
- Contador de pedidos pendientes en tab
- Cambio de estado:
  - Solicitado → En proceso (con tiempo estimado)
  - En proceso → Completado
- Suscripción en tiempo real a nuevos pedidos
- Notificaciones visuales de nuevos pedidos

### 4. Servicios (supabaseService.js)
**Nuevas funciones implementadas:**

**Sesiones:**
- `getActiveSession(businessId, tableId)` - Obtener sesión activa
- `createSession(businessId, tableId, tableNumber, tableName)` - Crear nueva sesión
- `getSession(sessionId)` - Obtener sesión por ID
- `updateSession(sessionId, updates)` - Actualizar sesión
- `closeSession(sessionId, paymentMethod)` - Cerrar sesión
- `fetchActiveSessions(businessId)` - Obtener todas las sesiones activas

**Carrito:**
- `getCartItems(sessionId)` - Obtener items del carrito
- `addToCart(sessionId, menuItem, quantity)` - Agregar al carrito
- `updateCartItem(itemId, quantity)` - Actualizar cantidad
- `removeFromCart(itemId)` - Remover del carrito
- `clearCart(sessionId)` - Limpiar carrito

**Pedidos:**
- `getSessionOrders(sessionId)` - Obtener pedidos de una sesión
- `createOrderFromCart(sessionId, businessId)` - Crear pedido desde carrito

**Suscripciones en tiempo real:**
- `subscribeToSessionOrders(sessionId, callback)` - Cambios en pedidos de sesión
- `subscribeToSessions(businessId, callback)` - Cambios en sesiones
- `subscribeToCart(sessionId, callback)` - Cambios en carrito

## IMPORTANTE: Ejecutar Script SQL

**ANTES de probar el sistema, debes ejecutar el siguiente script en Supabase:**

1. Ve a tu proyecto de Supabase
2. Navega a "SQL Editor"
3. Abre el archivo `supabase-sessions-schema.sql`
4. Copia todo el contenido
5. Pégalo en el editor SQL de Supabase
6. Haz click en "Run" o "Ejecutar"

Este script creará:
- Las nuevas tablas (table_sessions, cart_items)
- Modificará la tabla orders para agregar session_id y nuevos estados
- Creará funciones helper y triggers
- Configurará políticas RLS

## Flujo Completo del Sistema

### Usuario (Móvil):
1. Escanea QR → Se crea/carga sesión automáticamente
2. Agrega productos al carrito → Persistente en DB
3. Envía pedido a cocina → Estado "Solicitado"
4. Ve su cuenta total en tiempo real
5. Paga → Sesión se cierra

### Cocinero (Admin):
1. Recibe notificación de nuevo pedido "Solicitado"
2. Revisa detalles y establece tiempo estimado
3. Cambia estado a "En proceso"
4. Al terminar, marca como "Completado"

### Administrador (Admin):
1. Ve todas las sesiones activas
2. Monitorea totales por mesa
3. Puede finalizar sesiones manualmente si es necesario
4. Ve historial de pedidos por sesión

## Características Clave

✅ **Sesiones únicas por mesa**: No se puede crear nueva sesión si hay una activa
✅ **Carrito persistente**: Se mantiene entre recargas de página
✅ **Sincronización en tiempo real**: Cambios visibles instantáneamente
✅ **Gestión completa de estados**: Flujo Solicitado → En proceso → Completado
✅ **Total automático**: Se calcula automáticamente por triggers en DB
✅ **Estado de mesa automático**: Se actualiza según sesión (Ocupada/Disponible)
✅ **Control de pago**: Desde móvil (self) o desde admin

## Archivos Modificados

1. `supabase-sessions-schema.sql` - ⭐ NUEVO - Schema de sesiones
2. `restaurant-qr/src/lib/supabaseService.js` - Agregadas funciones de sesiones
3. `restaurant-qr/src/components/ClientView.jsx` - ⭐ NUEVO - Vista móvil completa
4. `restaurant-qr/src/App.jsx` - Integración de ClientView y OrdersManagement actualizado

## Próximos Pasos

1. ✅ Ejecutar script SQL en Supabase
2. ✅ Hacer commit de los cambios
3. ✅ Deploy a GitHub Pages
4. ✅ Probar flujo completo:
   - Escanear QR de una mesa
   - Agregar productos al carrito
   - Enviar pedido a cocina
   - Desde admin: cambiar estados del pedido
   - Pagar desde móvil
   - Verificar que la sesión se cierra correctamente
