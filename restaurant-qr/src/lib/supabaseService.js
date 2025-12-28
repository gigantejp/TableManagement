import { supabase } from './supabase'

const BUSINESS_ID = 'vanshelatto'

// =====================================================
// BUSINESS OPERATIONS
// =====================================================

export const fetchBusiness = async (businessId = BUSINESS_ID) => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (error) throw error
  return data
}

export const updateBusiness = async (businessId, updates) => {
  const { data, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', businessId)
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// CATEGORIES OPERATIONS
// =====================================================

export const fetchCategories = async (businessId = BUSINESS_ID) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('business_id', businessId)
    .order('id', { ascending: true })

  if (error) throw error
  return data
}

export const createCategory = async (name, businessId = BUSINESS_ID) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ business_id: businessId, name }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCategory = async (id, name) => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteCategory = async (id) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =====================================================
// MENU ITEMS OPERATIONS
// =====================================================

export const fetchMenuItems = async (businessId = BUSINESS_ID) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('business_id', businessId)
    .order('id', { ascending: true })

  if (error) throw error
  return data
}

export const createMenuItem = async (item, businessId = BUSINESS_ID) => {
  const { data, error } = await supabase
    .from('menu_items')
    .insert([{ ...item, business_id: businessId }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateMenuItem = async (id, updates) => {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteMenuItem = async (id) => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =====================================================
// TABLES OPERATIONS
// =====================================================

export const fetchTables = async (businessId = BUSINESS_ID) => {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('business_id', businessId)
    .order('number', { ascending: true })

  if (error) throw error
  return data
}

export const createTable = async (number, name, businessId = BUSINESS_ID) => {
  const { data, error } = await supabase
    .from('tables')
    .insert([{
      business_id: businessId,
      number: parseInt(number),
      name: name || `Mesa ${number}`,
      status: 'Disponible'
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateTable = async (id, number, name) => {
  const { data, error } = await supabase
    .from('tables')
    .update({
      number: parseInt(number),
      name: name || `Mesa ${number}`
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateTableStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('tables')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteTable = async (id) => {
  const { error } = await supabase
    .from('tables')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =====================================================
// ORDERS OPERATIONS
// =====================================================

export const fetchOrders = async (businessId = BUSINESS_ID) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Transform to match the app's expected format
  return data.map(order => ({
    ...order,
    items: order.order_items,
    timestamp: new Date(order.created_at).toLocaleTimeString()
  }))
}

export const createOrder = async (orderData, businessId = BUSINESS_ID) => {
  // First create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      business_id: businessId,
      table_id: orderData.tableId,
      table_number: orderData.tableNumber,
      table_name: orderData.tableName,
      total: orderData.total,
      status: 'Pendiente'
    }])
    .select()
    .single()

  if (orderError) throw orderError

  // Then create order items
  const orderItems = orderData.items.map(item => ({
    order_id: order.id,
    menu_item_id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) throw itemsError

  // Fetch the complete order with items
  const { data: completeOrder } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', order.id)
    .single()

  return {
    ...completeOrder,
    items: completeOrder.order_items,
    timestamp: new Date(completeOrder.created_at).toLocaleTimeString()
  }
}

export const updateOrderStatus = async (id, status, additionalData = {}) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, ...additionalData })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// WAITER CALLS OPERATIONS
// =====================================================

export const fetchWaiterCalls = async (businessId = BUSINESS_ID) => {
  const { data, error } = await supabase
    .from('waiter_calls')
    .select('*')
    .eq('business_id', businessId)
    .eq('attended', false)
    .order('created_at', { ascending: true })

  if (error) throw error

  return data.map(call => ({
    ...call,
    tableNumber: call.table_number,
    timestamp: new Date(call.created_at).toLocaleTimeString()
  }))
}

export const createWaiterCall = async (tableNumber, tableId, businessId = BUSINESS_ID) => {
  const { data, error } = await supabase
    .from('waiter_calls')
    .insert([{
      business_id: businessId,
      table_number: tableNumber,
      table_id: tableId,
      attended: false
    }])
    .select()
    .single()

  if (error) throw error

  return {
    ...data,
    tableNumber: data.table_number,
    timestamp: new Date(data.created_at).toLocaleTimeString()
  }
}

export const markWaiterCallAttended = async (id) => {
  const { error } = await supabase
    .from('waiter_calls')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================

export const subscribeToOrders = (businessId, callback) => {
  return supabase
    .channel('orders-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `business_id=eq.${businessId}`
      },
      callback
    )
    .subscribe()
}

export const subscribeToWaiterCalls = (businessId, callback) => {
  return supabase
    .channel('waiter-calls-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'waiter_calls',
        filter: `business_id=eq.${businessId}`
      },
      callback
    )
    .subscribe()
}

export const subscribeToTables = (businessId, callback) => {
  return supabase
    .channel('tables-channel')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tables',
        filter: `business_id=eq.${businessId}`
      },
      callback
    )
    .subscribe()
}

// =====================================================
// TABLE SESSIONS OPERATIONS
// =====================================================

export const getActiveSession = async (businessId, tableId) => {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('business_id', businessId)
    .eq('table_id', tableId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export const createSession = async (businessId, tableId, tableNumber, tableName) => {
  // Generate session code
  const sessionCode = `mesa${tableNumber}-${Date.now()}`

  const { data, error } = await supabase
    .from('table_sessions')
    .insert([{
      business_id: businessId,
      table_id: tableId,
      table_number: tableNumber,
      table_name: tableName,
      session_code: sessionCode,
      status: 'active',
      total_amount: 0.00
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const getSession = async (sessionId) => {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}

export const getSessionByCode = async (sessionCode) => {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('session_code', sessionCode)
    .single()

  if (error) throw error
  return data
}

export const updateSession = async (sessionId, updates) => {
  const { data, error } = await supabase
    .from('table_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const closeSession = async (sessionId, paymentMethod = 'admin') => {
  const { data, error } = await supabase
    .from('table_sessions')
    .update({
      status: paymentMethod === 'self' ? 'paid' : 'closed',
      payment_method: paymentMethod,
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const fetchActiveSessions = async (businessId = BUSINESS_ID) => {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })

  if (error) throw error
  return data
}

// =====================================================
// CART ITEMS OPERATIONS
// =====================================================

export const getCartItems = async (sessionId) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export const addToCart = async (sessionId, menuItem, quantity = 1) => {
  const subtotal = menuItem.price * quantity

  // Check if item already exists in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('session_id', sessionId)
    .eq('menu_item_id', menuItem.id)
    .maybeSingle()

  if (existingItem) {
    // Update existing item
    const newQuantity = existingItem.quantity + quantity
    const newSubtotal = menuItem.price * newQuantity

    const { data, error } = await supabase
      .from('cart_items')
      .update({
        quantity: newQuantity,
        subtotal: newSubtotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingItem.id)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Insert new item
    const { data, error } = await supabase
      .from('cart_items')
      .insert([{
        session_id: sessionId,
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: quantity,
        subtotal: subtotal
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const updateCartItem = async (itemId, quantity) => {
  if (quantity <= 0) {
    return removeFromCart(itemId)
  }

  // Get current item to recalculate subtotal
  const { data: item } = await supabase
    .from('cart_items')
    .select('*')
    .eq('id', itemId)
    .single()

  const newSubtotal = item.price * quantity

  const { data, error } = await supabase
    .from('cart_items')
    .update({
      quantity: quantity,
      subtotal: newSubtotal,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const removeFromCart = async (itemId) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}

export const clearCart = async (sessionId) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('session_id', sessionId)

  if (error) throw error
}

// =====================================================
// SESSION ORDERS OPERATIONS
// =====================================================

export const getSessionOrders = async (sessionId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(order => ({
    ...order,
    items: order.order_items,
    timestamp: new Date(order.created_at).toLocaleTimeString()
  }))
}

export const createOrderFromCart = async (sessionId, businessId = BUSINESS_ID) => {
  // Get cart items
  const cartItems = await getCartItems(sessionId)

  if (cartItems.length === 0) {
    throw new Error('El carrito está vacío')
  }

  // Get session info
  const session = await getSession(sessionId)

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0)

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      business_id: businessId,
      session_id: sessionId,
      table_id: session.table_id,
      table_number: session.table_number,
      table_name: session.table_name,
      total: total,
      status: 'Solicitado'
    }])
    .select()
    .single()

  if (orderError) throw orderError

  // Create order items from cart
  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) throw itemsError

  // Clear cart after creating order
  await clearCart(sessionId)

  // Fetch the complete order with items
  const { data: completeOrder } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', order.id)
    .single()

  return {
    ...completeOrder,
    items: completeOrder.order_items,
    timestamp: new Date(completeOrder.created_at).toLocaleTimeString()
  }
}

// =====================================================
// ADDITIONAL REALTIME SUBSCRIPTIONS
// =====================================================

export const subscribeToSessionOrders = (sessionId, callback) => {
  return supabase
    .channel(`session-orders-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `session_id=eq.${sessionId}`
      },
      callback
    )
    .subscribe()
}

export const subscribeToSessions = (businessId, callback) => {
  return supabase
    .channel('sessions-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'table_sessions',
        filter: `business_id=eq.${businessId}`
      },
      callback
    )
    .subscribe()
}

export const subscribeToCart = (sessionId, callback) => {
  return supabase
    .channel(`cart-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cart_items',
        filter: `session_id=eq.${sessionId}`
      },
      callback
    )
    .subscribe()
}
