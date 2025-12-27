# Configurar Variables de Entorno en GitHub Pages

Para que tu sitio funcione en GitHub Pages con Supabase, necesitas agregar las variables de entorno en GitHub Secrets.

## Pasos:

### 1. Ve a Settings de tu repositorio
```
https://github.com/gigantejp/TableManagement/settings
```

### 2. Ve a "Secrets and variables" > "Actions"
- En el menú lateral izquierdo, busca "Secrets and variables"
- Click en "Actions"

### 3. Agrega las siguientes variables:

#### Click en "New repository secret" y agrega cada una:

**Secret 1:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://fzdkatzjybvxgutffrxq.supabase.co`

**Secret 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `sb_publishable_oqgmVRmLB1dEM3Z4H5Bw1Q_qRgjFGUs`

### 4. Actualiza el workflow de GitHub Actions

El workflow necesita pasar estas variables al build. Ya está configurado en el código que vamos a hacer push.

### 5. Haz push y espera el deployment

Una vez configurados los secrets, cada push activará el deployment automáticamente.

---

## Verificación

Después del deployment, tu sitio en:
```
https://gigantejp.github.io/TableManagement/
```

Debería:
- ✅ Cargar los datos desde Supabase
- ✅ Permitir crear, editar y eliminar categorías, items, mesas
- ✅ Permitir hacer pedidos desde la vista del cliente
- ✅ Actualizar en tiempo real los pedidos y llamadas al mesero
