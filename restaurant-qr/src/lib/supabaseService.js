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
