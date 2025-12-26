import React, { useState, useEffect } from 'react';
import {
  QrCode, User, Bell, ChefHat, Plus, Trash2, Check,
  ShoppingCart, ArrowLeft, X, Clock, AlertCircle, CreditCard
} from 'lucide-react';

// Datos iniciales
const INITIAL_RESTAURANT = {
  name: "La Trattoria",
  emoji: "🍝"
};

const INITIAL_MENU = [
  { id: 1, name: "Pasta Carbonara", price: 1200, emoji: "🍝", category: "Platos principales" },
  { id: 2, name: "Pizza Margherita", price: 1500, emoji: "🍕", category: "Platos principales" },
  { id: 3, name: "Ensalada César", price: 800, emoji: "🥗", category: "Entradas" },
  { id: 4, name: "Tiramisú", price: 600, emoji: "🍰", category: "Postres" },
  { id: 5, name: "Coca Cola", price: 300, emoji: "🥤", category: "Bebidas" },
  { id: 6, name: "Vino Tinto", price: 1000, emoji: "🍷", category: "Bebidas" },
  { id: 7, name: "Bruschetta", price: 700, emoji: "🍞", category: "Entradas" },
  { id: 8, name: "Lasagna", price: 1400, emoji: "🍝", category: "Platos principales" },
  { id: 9, name: "Panna Cotta", price: 650, emoji: "🍮", category: "Postres" },
  { id: 10, name: "Café Espresso", price: 250, emoji: "☕", category: "Bebidas" }
];

const INITIAL_TABLES = [
  { id: 1, number: 1, status: "Disponible", qrUrl: "https://restaurant.com/table/1" },
  { id: 2, number: 2, status: "Disponible", qrUrl: "https://restaurant.com/table/2" },
  { id: 3, number: 3, status: "Disponible", qrUrl: "https://restaurant.com/table/3" },
  { id: 4, number: 4, status: "Disponible", qrUrl: "https://restaurant.com/table/4" }
];

function App() {
  const [currentView, setCurrentView] = useState('home'); // home, restaurant, client
  const [currentTable, setCurrentTable] = useState(null);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [cart, setCart] = useState([]);
  const [clientTab, setClientTab] = useState('menu'); // menu, cart
  const [restaurantTab, setRestaurantTab] = useState('overview'); // overview, tables, menu
  const [showAccount, setShowAccount] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Sistema de notificaciones
  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Funciones del cliente
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const placeOrder = () => {
    if (cart.length === 0) return;

    const newOrder = {
      id: Date.now(),
      tableNumber: currentTable,
      items: cart.map(item => ({
        ...item,
        subtotal: item.price * item.quantity
      })),
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'Pendiente',
      timestamp: new Date().toLocaleTimeString()
    };

    setOrders(prev => [...prev, newOrder]);
    setTables(prev => prev.map(t =>
      t.number === currentTable ? { ...t, status: 'Ocupada' } : t
    ));
    setCart([]);
    setOrderConfirmed(true);

    setTimeout(() => {
      setOrderConfirmed(false);
      setClientTab('menu');
    }, 2000);
  };

  const callWaiter = () => {
    if (!waiterCalls.find(c => c.tableNumber === currentTable)) {
      setWaiterCalls(prev => [...prev, {
        id: Date.now(),
        tableNumber: currentTable,
        timestamp: new Date().toLocaleTimeString()
      }]);
      addNotification(`Mesa ${currentTable} llamando al mesero`, 'warning');
    }
  };

  const requestAccount = () => {
    setShowAccount(true);
  };

  const processPayment = () => {
    // Marcar todos los pedidos de esta mesa como completados
    setOrders(prev => prev.map(order =>
      order.tableNumber === currentTable
        ? { ...order, status: 'Completado' }
        : order
    ));

    // Limpiar mesa
    setTables(prev => prev.map(t =>
      t.number === currentTable ? { ...t, status: 'Disponible' } : t
    ));

    // Eliminar llamadas de mesero de esta mesa
    setWaiterCalls(prev => prev.filter(c => c.tableNumber !== currentTable));

    addNotification(`Pago procesado para Mesa ${currentTable}`, 'success');
    setShowAccount(false);
    setCurrentView('home');
    setCurrentTable(null);
  };

  // Funciones del restaurante
  const markCallAttended = (callId) => {
    const call = waiterCalls.find(c => c.id === callId);
    setWaiterCalls(prev => prev.filter(c => c.id !== callId));
    if (call) {
      addNotification(`Llamada de Mesa ${call.tableNumber} atendida`, 'success');
    }
  };

  const markOrderComplete = (orderId) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: 'Completado' } : order
    ));
    addNotification('Pedido marcado como completado', 'success');
  };

  const addTable = () => {
    const maxNumber = Math.max(...tables.map(t => t.number), 0);
    const newTable = {
      id: Date.now(),
      number: maxNumber + 1,
      status: 'Disponible',
      qrUrl: `https://restaurant.com/table/${maxNumber + 1}`
    };
    setTables(prev => [...prev, newTable]);
  };

  const selectTable = (tableNumber) => {
    setCurrentTable(tableNumber);
    setCurrentView('client');
    setClientTab('menu');
    setCart([]);
    setShowAccount(false);
  };

  // Componente de Notificaciones
  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
            notif.type === 'success' ? 'bg-green-500 text-white' :
            notif.type === 'warning' ? 'bg-orange-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          {notif.type === 'success' && <Check size={20} />}
          {notif.type === 'warning' && <Bell size={20} />}
          <span className="font-medium">{notif.message}</span>
        </div>
      ))}
    </div>
  );

  // Pantalla de inicio
  const HomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{INITIAL_RESTAURANT.emoji}</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{INITIAL_RESTAURANT.name}</h1>
          <p className="text-gray-600">Sistema de Autogestión con QR</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setCurrentView('restaurant')}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 px-6 rounded-xl shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-3 font-semibold text-lg"
          >
            <ChefHat size={24} />
            Panel del Restaurante
          </button>

          <button
            onClick={() => {
              // Simular selección de mesa para demo
              selectTable(1);
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-4 px-6 rounded-xl shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-3 font-semibold text-lg"
          >
            <QrCode size={24} />
            Vista del Cliente
          </button>
        </div>
      </div>
    </div>
  );

  // Panel del Restaurante
  const RestaurantPanel = () => {
    const occupiedTables = tables.filter(t => t.status === 'Ocupada').length;
    const availableTables = tables.filter(t => t.status === 'Disponible').length;
    const pendingOrders = orders.filter(o => o.status === 'Pendiente').length;

    const categories = ['Entradas', 'Platos principales', 'Postres', 'Bebidas'];

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold">{INITIAL_RESTAURANT.emoji} {INITIAL_RESTAURANT.name}</h1>
                <p className="text-orange-100">Panel Administrativo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total de Mesas</p>
                  <p className="text-3xl font-bold text-gray-800">{tables.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <QrCode className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Mesas Ocupadas</p>
                  <p className="text-3xl font-bold text-red-600">{occupiedTables}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <User className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Mesas Disponibles</p>
                  <p className="text-3xl font-bold text-green-600">{availableTables}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Check className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Llamadas Pendientes</p>
                  <p className="text-3xl font-bold text-orange-600">{waiterCalls.length}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Bell className="text-orange-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <div className="flex gap-4 px-6">
                <button
                  onClick={() => setRestaurantTab('overview')}
                  className={`py-4 px-4 font-semibold border-b-2 transition ${
                    restaurantTab === 'overview'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Vista General
                </button>
                <button
                  onClick={() => setRestaurantTab('tables')}
                  className={`py-4 px-4 font-semibold border-b-2 transition ${
                    restaurantTab === 'tables'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Mesas & QR
                </button>
                <button
                  onClick={() => setRestaurantTab('menu')}
                  className={`py-4 px-4 font-semibold border-b-2 transition ${
                    restaurantTab === 'menu'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Menú
                </button>
              </div>
            </div>

            <div className="p-6">
              {restaurantTab === 'overview' && (
                <div className="space-y-6">
                  {/* Alertas de Llamadas de Mesero */}
                  {waiterCalls.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Bell className="text-red-600" size={24} />
                        <h3 className="text-xl font-bold text-red-700">Llamadas de Mesero Pendientes</h3>
                      </div>
                      <div className="space-y-2">
                        {waiterCalls.map(call => (
                          <div key={call.id} className="bg-white p-4 rounded-lg flex items-center justify-between shadow">
                            <div className="flex items-center gap-3">
                              <AlertCircle className="text-orange-500" />
                              <div>
                                <p className="font-semibold">Mesa {call.tableNumber}</p>
                                <p className="text-sm text-gray-600">{call.timestamp}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => markCallAttended(call.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                            >
                              <Check size={16} />
                              Atendido
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pedidos Activos */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Pedidos Activos</h3>
                    {orders.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No hay pedidos activos</p>
                    ) : (
                      <div className="space-y-4">
                        {orders.map(order => (
                          <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                  <User className="text-orange-600" size={20} />
                                </div>
                                <div>
                                  <p className="font-bold text-lg">Mesa {order.tableNumber}</p>
                                  <p className="text-sm text-gray-500">{order.timestamp}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  order.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                  order.status === 'En preparación' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {order.status}
                                </span>
                                {order.status !== 'Completado' && (
                                  <button
                                    onClick={() => markOrderComplete(order.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                                  >
                                    <Check size={14} />
                                    Completar
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 ml-11">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                  <span className="font-semibold">${item.subtotal}</span>
                                </div>
                              ))}
                              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                <span>Total:</span>
                                <span className="text-orange-600">${order.total}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {restaurantTab === 'tables' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Gestión de Mesas</h3>
                    <button
                      onClick={addTable}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <Plus size={20} />
                      Agregar Mesa
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tables.map(table => (
                      <div key={table.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-2xl font-bold text-gray-800">Mesa {table.number}</h4>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                              table.status === 'Ocupada'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {table.status}
                            </span>
                          </div>
                          <QrCode className="text-gray-400" size={48} />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">URL del QR:</p>
                          <p className="text-sm text-gray-700 font-mono break-all">{table.qrUrl}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {restaurantTab === 'menu' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Menú Completo</h3>
                  {categories.map(category => {
                    const items = INITIAL_MENU.filter(item => item.category === category);
                    return (
                      <div key={category} className="mb-8">
                        <h4 className="text-lg font-bold text-gray-700 mb-3 border-b-2 border-orange-500 pb-2">
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {items.map(item => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                              <div className="text-4xl">{item.emoji}</div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800">{item.name}</p>
                                <p className="text-orange-600 font-bold">${item.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Vista del Cliente
  const ClientView = () => {
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tableOrders = orders.filter(o => o.tableNumber === currentTable);
    const categories = ['Entradas', 'Platos principales', 'Postres', 'Bebidas'];

    if (orderConfirmed) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-600" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Pedido Realizado!</h2>
            <p className="text-gray-600">Tu pedido ha sido enviado a la cocina</p>
          </div>
        </div>
      );
    }

    if (showAccount) {
      const accountTotal = tableOrders.reduce((sum, order) => sum + order.total, 0);

      return (
        <div className="min-h-screen bg-gray-50 pb-20">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 shadow-lg sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAccount(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <div className="text-2xl">{INITIAL_RESTAURANT.emoji}</div>
                <p className="text-sm text-orange-100">Mesa {currentTable}</p>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Tu Cuenta</h2>

            {tableOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <p className="text-gray-500">No hay pedidos en esta mesa</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tableOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">{order.timestamp}</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-semibold">${item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="bg-orange-50 border-2 border-orange-500 rounded-xl p-6">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total a Pagar:</span>
                    <span className="text-orange-600">${accountTotal}</span>
                  </div>
                </div>

                <button
                  onClick={processPayment}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 font-semibold text-lg transition"
                >
                  <CreditCard size={24} />
                  Pagar con Tarjeta
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <div className="text-2xl">{INITIAL_RESTAURANT.emoji}</div>
                <p className="text-sm text-orange-100">Mesa {currentTable}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow-sm sticky top-16 z-10">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setClientTab('menu')}
              className={`flex-1 py-4 font-semibold border-b-2 transition ${
                clientTab === 'menu'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Menú
            </button>
            <button
              onClick={() => setClientTab('cart')}
              className={`flex-1 py-4 font-semibold border-b-2 transition relative ${
                clientTab === 'cart'
                  ? 'border-orange-500 text-orange-600'
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

        {/* Content */}
        <div className="p-4">
          {clientTab === 'menu' && (
            <div className="space-y-6">
              {categories.map(category => {
                const items = INITIAL_MENU.filter(item => item.category === category);
                return (
                  <div key={category}>
                    <h3 className="text-lg font-bold text-gray-700 mb-3 border-b-2 border-orange-500 pb-2">
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {items.map(item => (
                        <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                          <div className="text-5xl">{item.emoji}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{item.name}</h4>
                            <p className="text-orange-600 font-bold text-lg">${item.price}</p>
                          </div>
                          <button
                            onClick={() => addToCart(item)}
                            className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition transform hover:scale-110"
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
                    className="mt-4 text-orange-600 font-semibold hover:underline"
                  >
                    Ver Menú
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{item.emoji}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{item.name}</h4>
                          <p className="text-orange-600 font-bold">${item.price}</p>
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
                            className="bg-orange-500 hover:bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition"
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
                        <span className="text-gray-600">Subtotal: <span className="font-bold text-gray-800">${item.price * item.quantity}</span></span>
                      </div>
                    </div>
                  ))}

                  <div className="bg-orange-50 border-2 border-orange-500 rounded-xl p-6">
                    <div className="flex justify-between items-center text-2xl font-bold">
                      <span>Total:</span>
                      <span className="text-orange-600">${cartTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={placeOrder}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 font-semibold text-lg transition"
                  >
                    <Check size={24} />
                    Realizar Pedido
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
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
              Pedir la Cuenta
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <NotificationContainer />
      {currentView === 'home' && <HomeScreen />}
      {currentView === 'restaurant' && <RestaurantPanel />}
      {currentView === 'client' && <ClientView />}
    </>
  );
}

export default App;
