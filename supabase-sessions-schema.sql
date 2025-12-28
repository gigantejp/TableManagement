-- Table Sessions System - Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- =====================================================
-- TABLE SESSIONS TABLE
-- =====================================================
-- Gestiona las sesiones activas de cada mesa
CREATE TABLE IF NOT EXISTS table_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  table_id BIGINT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  table_name TEXT NOT NULL,
  session_code TEXT NOT NULL UNIQUE, -- Código único para esta sesión (ej: mesa2-1735398000)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid', 'closed')),
  total_amount NUMERIC(10, 2) DEFAULT 0.00,
  payment_method TEXT, -- 'self', 'admin', etc.
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CART ITEMS TABLE
-- =====================================================
-- Items en el carrito que aún no se han enviado a cocina
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
  menu_item_id BIGINT NOT NULL REFERENCES menu_items(id),
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MODIFY ORDERS TABLE
-- =====================================================
-- Agregar session_id y actualizar estados
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES table_sessions(id) ON DELETE CASCADE;

-- Actualizar constraint de status para incluir nuevos estados
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('Solicitado', 'En proceso', 'Completado', 'Cancelado'));

-- Actualizar status por defecto
ALTER TABLE orders
  ALTER COLUMN status SET DEFAULT 'Solicitado';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_table_sessions_business ON table_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_table_sessions_table ON table_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_table_sessions_status ON table_sessions(status);
CREATE INDEX IF NOT EXISTS idx_table_sessions_code ON table_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_cart_items_session ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Table Sessions: Allow public read and insert
CREATE POLICY "Allow public read access to table_sessions" ON table_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations on table_sessions" ON table_sessions
  FOR ALL USING (true);

-- Cart Items: Allow public read and manage
CREATE POLICY "Allow public read access to cart_items" ON cart_items
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations on cart_items" ON cart_items
  FOR ALL USING (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Función para generar código único de sesión
CREATE OR REPLACE FUNCTION generate_session_code(p_table_number INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_timestamp BIGINT;
  v_code TEXT;
BEGIN
  v_timestamp := EXTRACT(EPOCH FROM NOW())::BIGINT;
  v_code := 'mesa' || p_table_number || '-' || v_timestamp;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener sesión activa de una mesa
CREATE OR REPLACE FUNCTION get_active_session(p_business_id TEXT, p_table_id BIGINT)
RETURNS table_sessions AS $$
DECLARE
  v_session table_sessions;
BEGIN
  SELECT * INTO v_session
  FROM table_sessions
  WHERE business_id = p_business_id
    AND table_id = p_table_id
    AND status = 'active'
  ORDER BY started_at DESC
  LIMIT 1;

  RETURN v_session;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar el total de una sesión
CREATE OR REPLACE FUNCTION update_session_total(p_session_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC(10, 2);
BEGIN
  -- Calcular total de todos los pedidos de la sesión
  SELECT COALESCE(SUM(total), 0.00) INTO v_total
  FROM orders
  WHERE session_id = p_session_id
    AND status != 'Cancelado';

  -- Actualizar el total en la sesión
  UPDATE table_sessions
  SET total_amount = v_total,
      updated_at = NOW()
  WHERE id = p_session_id;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar total de sesión cuando cambia un pedido
CREATE OR REPLACE FUNCTION trigger_update_session_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_id IS NOT NULL THEN
    PERFORM update_session_total(NEW.session_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_session_total_on_order_change ON orders;
CREATE TRIGGER update_session_total_on_order_change
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_session_total();

-- Función para actualizar status de mesa basado en sesión
CREATE OR REPLACE FUNCTION update_table_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    -- Marcar mesa como ocupada
    UPDATE tables
    SET status = 'Ocupada',
        updated_at = NOW()
    WHERE id = NEW.table_id;
  ELSIF NEW.status IN ('paid', 'closed') THEN
    -- Marcar mesa como disponible
    UPDATE tables
    SET status = 'Disponible',
        updated_at = NOW()
    WHERE id = NEW.table_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_table_status_on_session_change ON table_sessions;
CREATE TRIGGER update_table_status_on_session_change
  AFTER INSERT OR UPDATE OF status ON table_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_table_status();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE table_sessions IS 'Sesiones activas de cada mesa para control de servicio';
COMMENT ON TABLE cart_items IS 'Items en el carrito que aún no se han enviado a cocina';
COMMENT ON COLUMN table_sessions.session_code IS 'Código único que identifica esta sesión (usado para validar QR scans)';
COMMENT ON COLUMN table_sessions.status IS 'Estado de la sesión: active (en uso), paid (pagada), closed (finalizada desde admin)';
