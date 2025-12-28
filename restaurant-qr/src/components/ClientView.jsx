import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Bell, Plus, Trash2, Check, ShoppingCart, ArrowLeft, CreditCard, ChefHat, Clock
} from 'lucide-react';
import * as supabaseService from '../lib/supabaseService';
import { supabase } from '../lib/supabase';

function ClientView({ addNotification }) {
  console.log('ClientView v2.0 - Multi-tenant with loading states');
  const { businessSlug, tableNumber } = useParams();
  const navigate = useNavigate();

  // Business data state
  const [business, setBusiness] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);

  // Session and table state
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [currentTable, setCurrentTable] = useState(null);

  // Cart and orders state
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [clientTab, setClientTab] = useState('menu');
  const [showAccount, setShowAccount] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Order status timer
  const [timeLeft, setTimeLeft] = useState(0);

  // Load business data first
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        // Get business by slug
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', businessSlug)
          .single();

        if (businessError) {
          console.error('Error loading business:', businessError);
          addNotification('Negocio no encontrado', 'error');
          navigate('/');
          return;
        }

        setBusiness(businessData);

        // Load business categories, menu, and tables
        const [categoriesData, menuItemsData, tablesData] = await Promise.all([
          supabaseService.fetchCategories(businessData.id),
          supabaseService.fetchMenuItems(businessData.id),
          supabaseService.fetchTables(businessData.id)
        ]);

        setCategories(categoriesData);
        setMenuItems(menuItemsData);
        setTables(tablesData);
      } catch (error) {
        console.error('Error loading business data:', error);
        addNotification('Error al cargar datos del negocio', 'error');
      }
    };

    if (businessSlug) {
      loadBusinessData();
    }
  }, [businessSlug, navigate, addNotification]);

  // Initialize session when component loads
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setSessionLoading(true);

        // Find the table
        const table = tables.find(t => t.number === parseInt(tableNumber));
        if (!table) {
          addNotification('Mesa no encontrada', 'error');
          navigate('/');
          return;
        }

        setCurrentTable(table);

        // Check if there's an active session for this table
        let session = await supabaseService.getActiveSession(business.id, table.id);

        if (session) {
          // Load existing session
          console.log('Sesión existente encontrada:', session.id);
          setCurrentSession(session);

          // Load cart items from session
          const cartItems = await supabaseService.getCartItems(session.id);
          setCart(cartItems);

          // Load orders from session
          const sessionOrders = await supabaseService.getSessionOrders(session.id);
          setOrders(sessionOrders);
        } else {
          // Create new session
          console.log('Creando nueva sesión para mesa', table.number);
          session = await supabaseService.createSession(
            business.id,
            table.id,
            table.number,
            table.name
          );
          setCurrentSession(session);
          setCart([]);
          setOrders([]);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        addNotification('Error al inicializar la sesión', 'error');
      } finally {
        setSessionLoading(false);
      }
    };

    if (business && tables.length > 0) {
      initializeSession();
    }
  }, [tableNumber, business, tables, navigate, addNotification]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentSession) return;

    // Subscribe to cart changes
    const cartSubscription = supabaseService.subscribeToCart(
      currentSession.id,
      async (payload) => {
        console.log('Cart change:', payload);
        const updatedCart = await supabaseService.getCartItems(currentSession.id);
        setCart(updatedCart);
      }
    );

    // Subscribe to session orders
    const ordersSubscription = supabaseService.subscribeToSessionOrders(
      currentSession.id,
      async (payload) => {
        console.log('Order change:', payload);
        const updatedOrders = await supabaseService.getSessionOrders(currentSession.id);
        setOrders(updatedOrders);
      }
    );

    return () => {
      cartSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
    };
  }, [currentSession]);

  // Timer for order in preparation
  useEffect(() => {
    const currentOrder = orders.find(o => o.status === 'En proceso');

    if (currentOrder && currentOrder.estimated_time && currentOrder.start_time) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - currentOrder.start_time) / 1000 / 60);
        const remaining = currentOrder.estimated_time - elapsed;
        setTimeLeft(Math.max(0, remaining));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [orders]);

  // Cart operations
  const addToCart = async (item) => {
    if (!currentSession) {
      addNotification('No hay sesión activa', 'error');
      return;
    }

    try {
      await supabaseService.addToCart(currentSession.id, item, 1);
      // Cart will update via real-time subscription
    } catch (error) {
      console.error('Error adding to cart:', error);
      addNotification('Error al agregar al carrito', 'error');
    }
  };

  const updateCartQuantity = async (itemId, delta) => {
    try {
      const item = cart.find(i => i.id === itemId);
      if (!item) return;

      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        await supabaseService.removeFromCart(itemId);
      } else {
        await supabaseService.updateCartItem(itemId, newQuantity);
      }
      // Cart will update via real-time subscription
    } catch (error) {
      console.error('Error updating cart:', error);
      addNotification('Error al actualizar el carrito', 'error');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await supabaseService.removeFromCart(itemId);
      // Cart will update via real-time subscription
    } catch (error) {
      console.error('Error removing from cart:', error);
      addNotification('Error al eliminar del carrito', 'error');
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      addNotification('El carrito está vacío', 'error');
      return;
    }

    if (!currentSession) {
      addNotification('No hay sesión activa', 'error');
      return;
    }

    try {
      await supabaseService.createOrderFromCart(currentSession.id, business.id);

      setOrderConfirmed(true);
      addNotification(`Nuevo pedido de ${currentTable.name}`, 'warning', true);

      setTimeout(() => {
        setOrderConfirmed(false);
        setClientTab('menu');
      }, 2000);
    } catch (error) {
      console.error('Error placing order:', error);
      addNotification(error.message || 'Error al realizar el pedido', 'error');
    }
  };

  const callWaiter = async () => {
    if (!currentTable) return;

    try {
      await supabaseService.createWaiterCall(currentTable.number, currentTable.id, business.id);
      addNotification(`Mesa ${currentTable.number} llamando al mesero`, 'warning');
    } catch (error) {
      console.error('Error calling waiter:', error);
      addNotification('Error al llamar al mesero', 'error');
    }
  };

  const requestAccount = () => {
    setShowAccount(true);
  };

  const processPayment = async () => {
    if (!currentSession) return;

    try {
      await supabaseService.closeSession(currentSession.id, 'self');
      addNotification(`Pago procesado para ${currentTable.name}`, 'success');
      setShowAccount(false);
      navigate('/');
    } catch (error) {
      console.error('Error processing payment:', error);
      addNotification('Error al procesar el pago', 'error');
    }
  };

  // Calculate totals
  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  const accountTotal = currentSession ? parseFloat(currentSession.total_amount || 0) : 0;
  const currentOrder = orders.find(o => o.status === 'En proceso' || o.status === 'Completado');

  // Loading state
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // Order confirmed screen
  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Pedido Enviado a Cocina!</h2>
          <p className="text-gray-600">Tu pedido está siendo preparado</p>
        </div>
      </div>
    );
  }

  // Account view
  if (showAccount) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAccount(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="text-2xl">{business.logo}</div>
              <p className="text-sm text-blue-100">{currentTable?.name}</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Tu Cuenta</h2>

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500">No hay pedidos en esta sesión</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-500">{order.timestamp}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'Solicitado' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'En proceso' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-semibold">${item.subtotal}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between font-bold">
                    <span>Subtotal:</span>
                    <span>${order.total}</span>
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span>Total a Pagar:</span>
                  <span className="text-blue-600">${accountTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={processPayment}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 font-semibold text-lg transition"
              >
                <CreditCard size={24} />
                Pagar Ahora
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show loading state while business data is loading
  if (!business || !currentTable) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold text-lg">Cargando menú v2.0...</p>
          <p className="text-gray-400 text-sm mt-2">Plataforma multi-tenant</p>
        </div>
      </div>
    );
  }

  // Main client view
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl">{business.logo}</span>
                )}
                <span className="font-bold">{business.name}</span>
              </div>
              <p className="text-sm text-blue-100">{currentTable?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Banner */}
      {currentOrder && currentOrder.status === 'En proceso' && (
        <div className="bg-blue-500 text-white p-4 shadow-md">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ChefHat size={24} />
              <p className="font-bold text-lg">Tu pedido está en preparación</p>
            </div>
            {timeLeft > 0 && (
              <div className="flex items-center justify-center gap-2">
                <Clock size={20} />
                <p className="text-xl font-bold">{timeLeft} minutos restantes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {currentOrder && currentOrder.status === 'Completado' && (
        <div className="bg-green-500 text-white p-6 shadow-md">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-bold text-2xl">¡Que lo disfrutes!</p>
            <p className="text-sm mt-2">Tu pedido ha sido entregado</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm sticky top-16 z-10">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setClientTab('menu')}
            className={`flex-1 py-4 font-semibold border-b-2 transition ${
              clientTab === 'menu'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Menú
          </button>
          <button
            onClick={() => setClientTab('cart')}
            className={`flex-1 py-4 font-semibold border-b-2 transition relative ${
              clientTab === 'cart'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Carrito
            {cart.length > 0 && (
              <span className="absolute top-2 right-1/4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        {clientTab === 'menu' && (
          <div className="space-y-6">
            {categories.map(category => {
              const items = menuItems.filter(item => item.category_id === category.id);
              if (items.length === 0) return null;

              return (
                <div key={category.id}>
                  <h3 className="text-lg font-bold text-gray-700 mb-3 border-b-2 border-blue-500 pb-2">
                    {category.name}
                  </h3>
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                        <div className="text-5xl">{item.image}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{item.name}</h4>
                          <p className="text-sm text-gray-500">{item.size} - {item.unit}</p>
                          <p className="text-blue-600 font-bold text-lg">${item.price}</p>
                        </div>
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition transform hover:scale-110"
                        >
                          <Plus size={24} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {clientTab === 'cart' && (
          <div>
            {cart.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <ShoppingCart className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">Tu carrito está vacío</p>
                <button
                  onClick={() => setClientTab('menu')}
                  className="mt-4 text-blue-600 font-semibold hover:underline"
                >
                  Ver Menú
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{menuItems.find(mi => mi.id === item.menu_item_id)?.image || '🍽️'}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                        <p className="text-blue-600 font-bold">${item.price}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition"
                        >
                          -
                        </button>
                        <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <span className="text-gray-600">Subtotal: <span className="font-bold text-gray-800">${parseFloat(item.subtotal).toFixed(2)}</span></span>
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 font-semibold text-lg transition"
                >
                  <Check size={24} />
                  Enviar a Cocina
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
          <button
            onClick={callWaiter}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl shadow-md flex items-center justify-center gap-2 font-semibold transition"
          >
            <Bell size={20} />
            Llamar Mesero
          </button>
          <button
            onClick={requestAccount}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl shadow-md flex items-center justify-center gap-2 font-semibold transition"
          >
            <CreditCard size={20} />
            Ver la Cuenta
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientView;
