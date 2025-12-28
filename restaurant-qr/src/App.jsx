import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import {
  QrCode, User, Bell, ChefHat, Plus, Trash2, Check, ShoppingCart, ArrowLeft,
  AlertCircle, CreditCard, Edit2, Save, X, Upload, LogIn, UserPlus, Store,
  Coffee, UtensilsCrossed, Clock, TrendingUp, Users, Zap, Menu as MenuIcon,
  Image as ImageIcon, DollarSign, Maximize2, Download
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import * as supabaseService from './lib/supabaseService';
import * as authService from './lib/authService';
import RegisterPage from './components/RegisterPage';
import ClientView from './components/ClientView';

function App() {
  const navigate = useNavigate();

  // Estado global de la app
  const [currentUser, setCurrentUser] = useState(null);
  const [authSession, setAuthSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado del negocio
  const [business, setBusiness] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);

  // Estado del cliente
  const [currentTable, setCurrentTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [clientTab, setClientTab] = useState('menu');
  const [showAccount, setShowAccount] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Estados de edición
  const [editingBrand, setEditingBrand] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [showQRModal, setShowQRModal] = useState(null);

  // Sistema de notificaciones
  const addNotification = (message, type = 'success', persistent = false) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, persistent }]);
    if (!persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 4000);
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Verificar autenticación y cargar datos iniciales
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);

        // Verificar si hay sesión activa
        const session = await authService.getSession();

        if (session) {
          setAuthSession(session);
          setCurrentUser(session.user);

          // Obtener negocio del usuario
          const userBusiness = await authService.getUserBusiness(session.user.id);

          if (userBusiness) {
            await loadBusinessData(userBusiness.id);
          } else {
            console.log('User has no business associated');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios de autenticación
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);

      setAuthSession(session);
      setCurrentUser(session?.user || null);

      if (session?.user) {
        // Usuario autenticado - cargar su negocio
        const userBusiness = await authService.getUserBusiness(session.user.id);
        if (userBusiness) {
          await loadBusinessData(userBusiness.id);
        }
      } else {
        // Usuario no autenticado - limpiar datos
        setBusiness(null);
        setCategories([]);
        setMenuItems([]);
        setTables([]);
        setOrders([]);
        setWaiterCalls([]);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Función para cargar datos del negocio
  const loadBusinessData = async (businessId) => {
    try {
      const [businessData, categoriesData, menuItemsData, tablesData, ordersData, waiterCallsData] = await Promise.all([
        supabaseService.fetchBusiness(businessId),
        supabaseService.fetchCategories(businessId),
        supabaseService.fetchMenuItems(businessId),
        supabaseService.fetchTables(businessId),
        supabaseService.fetchOrders(businessId),
        supabaseService.fetchWaiterCalls(businessId)
      ]);

      setBusiness(businessData);
      setCategories(categoriesData);
      setMenuItems(menuItemsData.map(item => ({
        ...item,
        categoryId: item.category_id
      })));
      setTables(tablesData);
      setOrders(ordersData);
      setWaiterCalls(waiterCallsData);

      // Suscripciones en tiempo real
      setupRealtimeSubscriptions(businessId);
    } catch (error) {
      console.error('Error loading business data:', error);
      addNotification('Error al cargar datos del negocio', 'error');
      throw error;
    }
  };

  // Configurar suscripciones en tiempo real
  const setupRealtimeSubscriptions = (businessId) => {
    const ordersSubscription = supabaseService.subscribeToOrders(businessId, async () => {
      const ordersData = await supabaseService.fetchOrders(businessId);
      setOrders(ordersData);
    });

    const waiterCallsSubscription = supabaseService.subscribeToWaiterCalls(businessId, async () => {
      const callsData = await supabaseService.fetchWaiterCalls(businessId);
      setWaiterCalls(callsData);
    });

    const tablesSubscription = supabaseService.subscribeToTables(businessId, async () => {
      const tablesData = await supabaseService.fetchTables(businessId);
      setTables(tablesData);
    });
  };

  // Funciones de autenticación
  const handleLogin = async (email, password) => {
    try {
      const result = await authService.signIn({ email, password });
      // Auth state change listener manejará la carga de datos
      addNotification('Sesión iniciada correctamente', 'success');
      navigate('/admin/brand');
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      // Auth state change listener manejará la limpieza de datos
      addNotification('Sesión cerrada', 'success');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      addNotification('Error al cerrar sesión', 'error');
    }
  };

  const handleRegisterSuccess = (user, business) => {
    // El listener de auth manejará la carga de datos
    addNotification(`Bienvenido a ${business.name}!`, 'success');
  };

  // Funciones de gestión de marca
  const saveBrandChanges = async (newBrand) => {
    try {
      const updated = await supabaseService.updateBusiness(business.id, {
        name: newBrand.name,
        logo: newBrand.logo,
        logo_url: newBrand.logoUrl,
        tagline: newBrand.tagline,
        description: newBrand.description
      });
      setBusiness(updated);
      setEditingBrand(false);
      addNotification('Información de marca actualizada correctamente');
    } catch (error) {
      console.error('Error updating business:', error);
      addNotification('Error al actualizar información de marca', 'error');
    }
  };

  // Funciones de gestión de categorías
  const addCategory = async (name) => {
    try {
      const newCategory = await supabaseService.createCategory(name, business.id);
      setCategories(prev => [...prev, newCategory]);
      setShowAddCategory(false);
      addNotification('Categoría agregada correctamente');
    } catch (error) {
      console.error('Error adding category:', error);
      addNotification('Error al agregar categoría', 'error');
    }
  };

  const updateCategory = async (id, name) => {
    try {
      const updated = await supabaseService.updateCategory(id, name);
      setCategories(prev => prev.map(cat => cat.id === id ? updated : cat));
      setEditingCategory(null);
      addNotification('Categoría actualizada correctamente');
    } catch (error) {
      console.error('Error updating category:', error);
      addNotification('Error al actualizar categoría', 'error');
    }
  };

  const deleteCategory = async (id) => {
    try {
      await supabaseService.deleteCategory(id);
      // Eliminar items del menú de esta categoría (CASCADE en DB)
      setMenuItems(prev => prev.filter(item => item.categoryId !== id));
      setCategories(prev => prev.filter(cat => cat.id !== id));
      addNotification('Categoría eliminada correctamente');
    } catch (error) {
      console.error('Error deleting category:', error);
      addNotification('Error al eliminar categoría', 'error');
    }
  };

  // Funciones de gestión de items del menú
  const addMenuItem = async (item) => {
    try {
      const newItem = await supabaseService.createMenuItem({
        category_id: item.categoryId,
        name: item.name,
        price: item.price,
        image: item.image,
        size: item.size,
        unit: item.unit
      }, business.id);
      setMenuItems(prev => [...prev, { ...newItem, categoryId: newItem.category_id }]);
      setShowAddMenuItem(false);
      addNotification('Item agregado al menú correctamente');
    } catch (error) {
      console.error('Error adding menu item:', error);
      addNotification('Error al agregar item al menú', 'error');
    }
  };

  const updateMenuItem = async (id, updatedItem) => {
    try {
      const updated = await supabaseService.updateMenuItem(id, {
        category_id: updatedItem.categoryId,
        name: updatedItem.name,
        price: updatedItem.price,
        image: updatedItem.image,
        size: updatedItem.size,
        unit: updatedItem.unit
      });
      setMenuItems(prev => prev.map(item => item.id === id ? { ...updated, categoryId: updated.category_id } : item));
      setEditingMenuItem(null);
      addNotification('Item actualizado correctamente');
    } catch (error) {
      console.error('Error updating menu item:', error);
      addNotification('Error al actualizar item', 'error');
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      await supabaseService.deleteMenuItem(id);
      setMenuItems(prev => prev.filter(item => item.id !== id));
      addNotification('Item eliminado del menú correctamente');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      addNotification('Error al eliminar item', 'error');
    }
  };

  // Funciones de gestión de mesas
  const addTable = async (number, name) => {
    try {
      const newTable = await supabaseService.createTable(number, name, business.id);
      setTables(prev => [...prev, newTable]);
      setShowAddTable(false);
      addNotification('Mesa agregada correctamente');
    } catch (error) {
      console.error('Error adding table:', error);
      addNotification('Error al agregar mesa', 'error');
    }
  };

  const updateTable = async (id, number, name) => {
    try {
      const updated = await supabaseService.updateTable(id, number, name);
      setTables(prev => prev.map(table => table.id === id ? updated : table));
      setEditingTable(null);
      addNotification('Mesa actualizada correctamente');
    } catch (error) {
      console.error('Error updating table:', error);
      addNotification('Error al actualizar mesa', 'error');
    }
  };

  const deleteTable = async (id) => {
    try {
      await supabaseService.deleteTable(id);
      setTables(prev => prev.filter(table => table.id !== id));
      addNotification('Mesa eliminada correctamente');
    } catch (error) {
      console.error('Error deleting table:', error);
      addNotification('Error al eliminar mesa', 'error');
    }
  };

  const printQR = (table) => {
    setShowQRModal(table);
  };

  // Funciones del cliente (mantienen la lógica anterior)
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

  const placeOrder = async () => {
    if (cart.length === 0) return;

    try {
      const table = tables.find(t => t.number === currentTable);
      const newOrder = await supabaseService.createOrder({
        tableId: table.id,
        tableNumber: currentTable,
        tableName: table?.name || `Mesa ${currentTable}`,
        items: cart.map(item => ({
          ...item,
          subtotal: item.price * item.quantity
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      }, business.id);

      setOrders(prev => [...prev, newOrder]);

      // Update table status
      await supabaseService.updateTableStatus(table.id, 'Ocupada');
      setTables(prev => prev.map(t =>
        t.id === table.id ? { ...t, status: 'Ocupada' } : t
      ));

      setCart([]);
      setOrderConfirmed(true);

      // Persistent notification for new order
      addNotification(`Nuevo pedido de ${table?.name || `Mesa ${currentTable}`}`, 'warning', true);

      setTimeout(() => {
        setOrderConfirmed(false);
        setClientTab('menu');
      }, 2000);
    } catch (error) {
      console.error('Error placing order:', error);
      addNotification('Error al realizar el pedido', 'error');
    }
  };

  const callWaiter = async () => {
    if (!waiterCalls.find(c => c.tableNumber === currentTable)) {
      try {
        const table = tables.find(t => t.number === currentTable);
        const newCall = await supabaseService.createWaiterCall(currentTable, table.id, business.id);
        setWaiterCalls(prev => [...prev, newCall]);
        addNotification(`Mesa ${currentTable} llamando al mesero`, 'warning');
      } catch (error) {
        console.error('Error calling waiter:', error);
        addNotification('Error al llamar al mesero', 'error');
      }
    }
  };

  const requestAccount = () => {
    setShowAccount(true);
  };

  const processPayment = () => {
    setOrders(prev => prev.map(order =>
      order.tableNumber === currentTable
        ? { ...order, status: 'Completado' }
        : order
    ));

    setTables(prev => prev.map(t =>
      t.number === currentTable ? { ...t, status: 'Disponible' } : t
    ));

    setWaiterCalls(prev => prev.filter(c => c.tableNumber !== currentTable));

    addNotification(`Pago procesado para Mesa ${currentTable}`, 'success');
    setShowAccount(false);
    navigate('/');
    setCurrentTable(null);
  };

  const markCallAttended = async (callId) => {
    try {
      const call = waiterCalls.find(c => c.id === callId);
      await supabaseService.markWaiterCallAttended(callId);
      setWaiterCalls(prev => prev.filter(c => c.id !== callId));
      if (call) {
        addNotification(`Llamada de Mesa ${call.tableNumber} atendida`, 'success');
      }
    } catch (error) {
      console.error('Error marking call as attended:', error);
      addNotification('Error al marcar llamada como atendida', 'error');
    }
  };

  const setEstimatedTime = async (orderId, minutes) => {
    try {
      await supabaseService.updateOrderStatus(orderId, 'Pendiente', {
        estimated_time: parseInt(minutes)
      });
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, estimatedTime: parseInt(minutes), estimated_time: parseInt(minutes) } : order
      ));
      addNotification('Tiempo estimado configurado', 'success');
    } catch (error) {
      console.error('Error setting estimated time:', error);
      addNotification('Error al configurar tiempo estimado', 'error');
    }
  };

  const startPreparation = async (orderId) => {
    try {
      await supabaseService.updateOrderStatus(orderId, 'En preparación', {
        start_time: Date.now()
      });
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: 'En preparación', startTime: Date.now(), start_time: Date.now() } : order
      ));

      // Dismiss persistent notification when order starts preparation
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const notif = notifications.find(n => n.message.includes(order.tableName));
        if (notif) {
          dismissNotification(notif.id);
        }
      }

      addNotification('Pedido en preparación', 'info');
    } catch (error) {
      console.error('Error starting preparation:', error);
      addNotification('Error al iniciar preparación', 'error');
    }
  };

  const markAsDelivered = async (orderId) => {
    try {
      await supabaseService.updateOrderStatus(orderId, 'Entregado');
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: 'Entregado' } : order
      ));
      addNotification('Pedido entregado', 'success');
    } catch (error) {
      console.error('Error marking as delivered:', error);
      addNotification('Error al marcar como entregado', 'error');
    }
  };

  const accessClientView = (tableNumber) => {
    setCurrentTable(tableNumber);
    navigate(`/${business.slug}/table/${tableNumber}`);
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
            notif.type === 'info' ? 'bg-blue-500 text-white' :
            'bg-red-500 text-white'
          }`}
        >
          {notif.type === 'success' && <Check size={20} />}
          {notif.type === 'warning' && <Bell size={20} />}
          {notif.type === 'info' && <AlertCircle size={20} />}
          <span className="font-medium">{notif.message}</span>
          {notif.persistent && (
            <button
              onClick={() => dismissNotification(notif.id)}
              className="ml-2 hover:bg-white/20 p-1 rounded"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  // LANDING PAGE
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="text-blue-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-800">Table Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
            >
              <UserPlus size={20} />
              Registrarse
            </Link>
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <LogIn size={20} />
              Ingresar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Transforma la Experiencia de tus Clientes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            La solución digital definitiva para eliminar tiempos de espera y optimizar el servicio en tu comercio
          </p>
        </div>

        {/* Problems & Solutions */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Problema 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Clock className="text-red-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">El Problema</h3>
            <p className="text-gray-600 mb-4">
              "Esperamos 15 minutos solo para que nos tomen el pedido"
            </p>
            <div className="border-t pt-4">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                <Zap className="text-green-600" size={24} />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Nuestra Solución</h4>
              <p className="text-gray-600 text-sm">
                Menú digital instantáneo con código QR. Tus clientes ordenan directamente desde su teléfono sin esperas.
              </p>
            </div>
          </div>

          {/* Problema 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">El Problema</h3>
            <p className="text-gray-600 mb-4">
              "Necesito algo y el mesero nunca está cerca"
            </p>
            <div className="border-t pt-4">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                <Bell className="text-green-600" size={24} />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Nuestra Solución</h4>
              <p className="text-gray-600 text-sm">
                Llamada al mesero con un toque. Notificación instantánea al personal para atención inmediata.
              </p>
            </div>
          </div>

          {/* Problema 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <CreditCard className="text-red-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">El Problema</h3>
            <p className="text-gray-600 mb-4">
              "Ya terminamos, ¿dónde está la cuenta?"
            </p>
            <div className="border-t pt-4">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Nuestra Solución</h4>
              <p className="text-gray-600 text-sm">
                Pago digital directo desde la mesa. Tus clientes solicitan y pagan la cuenta sin esperar.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">60%</div>
              <p className="text-blue-100">Reducción en tiempos de espera</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">40%</div>
              <p className="text-blue-100">Aumento en satisfacción</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">25%</div>
              <p className="text-blue-100">Incremento en ventas</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            ¿Listo para modernizar tu negocio?
          </h3>
          <Link
            to="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            Comenzar Ahora - Es Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Store className="text-blue-400" size={24} />
            <span className="text-xl font-bold text-white">Table Management</span>
          </div>
          <p className="text-gray-400">
            Optimiza la experiencia en heladerías, cafeterías, pizzerías y restaurantes
          </p>
          <p className="text-gray-500 mt-4 text-sm">
            © 2024 Table Management. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );

  // LOGIN PAGE
  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
        await handleLogin(email, password);
      } catch (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu email antes de iniciar sesión');
        } else {
          setError('Error al iniciar sesión. Intenta nuevamente.');
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="text-blue-600" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Iniciar Sesión</h2>
            <p className="text-gray-600 mt-2">Accede a tu panel de gestión</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Ingresar
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                ¿No tienes una cuenta?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Regístrate aquí
                </Link>
              </p>
            </div>

            <Link
              to="/"
              className="block w-full text-center text-gray-600 hover:text-gray-800 py-2 rounded-lg font-medium transition"
            >
              Volver al inicio
            </Link>
          </form>
        </div>
      </div>
    );
  };

  // ADMIN PANEL - Continuará en el siguiente mensaje...
  const AdminPanel = ({ tab }) => {
    const occupiedTables = tables.filter(t => t.status === 'Ocupada').length;
    const availableTables = tables.filter(t => t.status === 'Disponible').length;
    const adminTab = tab || 'brand';

    // Show loading state if business data hasn't loaded yet
    if (!business) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos del negocio...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt={business.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="text-4xl">{business.logo}</div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{business.name}</h1>
                <p className="text-sm text-gray-600">{business.tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">Administrador</p>
                <p className="text-xs text-gray-500">{currentUser?.businessId}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-lg transition"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Mesas</p>
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
                  <p className="text-gray-600 text-sm">Ocupadas</p>
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
                  <p className="text-gray-600 text-sm">Disponibles</p>
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
                  <p className="text-gray-600 text-sm">Items Menú</p>
                  <p className="text-3xl font-bold text-purple-600">{menuItems.length}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <UtensilsCrossed className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <div className="flex gap-4 px-6">
                <Link
                  to="/admin/brand"
                  className={`py-4 px-4 font-semibold border-b-2 transition ${
                    adminTab === 'brand'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gestión de Marca
                </Link>
                <Link
                  to="/admin/menu"
                  className={`py-4 px-4 font-semibold border-b-2 transition ${
                    adminTab === 'menu'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gestión del Menú
                </Link>
                <Link
                  to="/admin/tables"
                  className={`py-4 px-4 font-semibold border-b-2 transition ${
                    adminTab === 'tables'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gestión de Mesas
                </Link>
                <Link
                  to="/admin/orders"
                  className={`py-4 px-4 font-semibold border-b-2 transition relative ${
                    adminTab === 'orders'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gestión de Pedidos
                  {orders.filter(o => o.status === 'Solicitado').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {orders.filter(o => o.status === 'Solicitado').length}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            <div className="p-6">
              {adminTab === 'brand' && <BrandManagement />}
              {adminTab === 'menu' && <MenuManagement />}
              {adminTab === 'tables' && <TablesManagement />}
              {adminTab === 'orders' && <OrdersManagement />}
            </div>
          </div>

          {/* Active Orders Section */}
          {waiterCalls.length > 0 || orders.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Actividad en Tiempo Real</h3>

              {/* Waiter Calls */}
              {waiterCalls.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Llamadas de Mesero</h4>
                  <div className="space-y-2">
                    {waiterCalls.map(call => (
                      <div key={call.id} className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bell className="text-orange-500" />
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

              {/* Orders */}
              {orders.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Pedidos Activos</h4>
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <User className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-lg">Mesa {order.tableNumber}</p>
                              <p className="text-sm text-gray-500">{order.timestamp}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              order.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
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
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-700">{item.quantity}x {item.name}</span>
                              <span className="font-semibold">${item.subtotal}</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                            <span>Total:</span>
                            <span className="text-blue-600">${order.total}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  // BRAND MANAGEMENT COMPONENT
  const BrandManagement = () => {
    const [formData, setFormData] = useState(business || {
      id: '',
      name: '',
      logo: '🍦',
      logoUrl: null,
      tagline: '',
      description: ''
    });
    const fileInputRef = useRef(null);

    const handleLogoUpload = (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFormData({...formData, logoUrl: event.target.result});
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="max-w-2xl">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Información de la Marca</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Negocio</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Mi Heladería"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Logo de la Marca</label>
            <div className="flex items-center gap-4">
              {formData.logoUrl ? (
                <div className="relative">
                  <img src={formData.logoUrl} alt="Logo" className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300" />
                  <button
                    onClick={() => setFormData({...formData, logoUrl: null})}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-4xl">
                  {formData.logo}
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <Upload size={20} />
                  Subir Imagen
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Sube una imagen de tu logo. Se mostrará en el menú digital.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Logo Emoji (alternativo)</label>
            <input
              type="text"
              value={formData.logo}
              onChange={(e) => setFormData({...formData, logo: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-4xl text-center"
              placeholder="🍦"
              maxLength={2}
            />
            <p className="text-xs text-gray-500 mt-1">Se usará si no subes una imagen</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Eslogan/Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({...formData, tagline: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Heladería artesanal y cafetería"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Describe tu negocio, especialidades y qué ofreces..."
            />
          </div>

          <button
            onClick={() => saveBrandChanges(formData)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
          >
            <Save size={20} />
            Guardar Cambios
          </button>
        </div>
      </div>
    );
  };

  // MENU MANAGEMENT COMPONENT
  const MenuManagement = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Gestión del Menú</h3>
        </div>

        {/* Categories Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-700">Categorías</h4>
            <button
              onClick={() => setShowAddCategory(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Plus size={20} />
              Nueva Categoría
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={() => setEditingCategory(category)}
                onDelete={() => deleteCategory(category.id)}
              />
            ))}
          </div>

          {showAddCategory && (
            <AddCategoryForm
              onAdd={addCategory}
              onCancel={() => setShowAddCategory(false)}
            />
          )}

          {editingCategory && (
            <EditCategoryForm
              category={editingCategory}
              onUpdate={updateCategory}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </div>

        {/* Menu Items Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-700">Items del Menú</h4>
            <button
              onClick={() => setShowAddMenuItem(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Plus size={20} />
              Nuevo Item
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {categories.map(category => {
              const items = menuItems.filter(item => item.categoryId === category.id);
              if (items.length === 0) return null;

              return (
                <div key={category.id} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-bold text-gray-700 mb-3 border-b pb-2">{category.name}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map(item => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onEdit={() => setEditingMenuItem(item)}
                        onDelete={() => deleteMenuItem(item.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {showAddMenuItem && (
            <AddMenuItemForm
              categories={categories}
              onAdd={addMenuItem}
              onCancel={() => setShowAddMenuItem(false)}
            />
          )}

          {editingMenuItem && (
            <EditMenuItemForm
              item={editingMenuItem}
              categories={categories}
              onUpdate={updateMenuItem}
              onCancel={() => setEditingMenuItem(null)}
            />
          )}
        </div>
      </div>
    );
  };

  // TABLES MANAGEMENT COMPONENT
  const TablesManagement = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Gestión de Mesas</h3>
          <button
            onClick={() => setShowAddTable(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={20} />
            Nueva Mesa
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <TableCard
              key={table.id}
              table={table}
              businessSlug={business.slug}
              onEdit={() => setEditingTable(table)}
              onDelete={() => deleteTable(table.id)}
              onPrintQR={() => printQR(table)}
              onAccess={() => accessClientView(table.number)}
            />
          ))}
        </div>

        {showAddTable && (
          <AddTableForm
            onAdd={addTable}
            onCancel={() => setShowAddTable(false)}
          />
        )}

        {editingTable && (
          <EditTableForm
            table={editingTable}
            onUpdate={updateTable}
            onCancel={() => setEditingTable(null)}
          />
        )}
      </div>
    );
  };

  // ORDERS MANAGEMENT COMPONENT
  const OrdersManagement = () => {
    const [activeSessions, setActiveSessions] = useState([]);

    // Load active sessions
    useEffect(() => {
      const loadActiveSessions = async () => {
        try {
          const sessions = await supabaseService.fetchActiveSessions(business.id);
          setActiveSessions(sessions);
        } catch (error) {
          console.error('Error loading sessions:', error);
        }
      };

      if (business) {
        loadActiveSessions();
      }

      // Subscribe to session changes
      const subscription = supabaseService.subscribeToSessions(business.id, () => {
        loadActiveSessions();
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [business]);

    const OrderCard = ({ order }) => {
      const [estimatedMinutes, setEstimatedMinutes] = useState(order.estimated_time || '');

      const handleStartPreparation = async () => {
        try {
          await supabaseService.updateOrderStatus(order.id, 'En proceso', {
            estimated_time: parseInt(estimatedMinutes),
            start_time: Date.now()
          });
          addNotification('Pedido en preparación', 'success');
        } catch (error) {
          console.error('Error starting preparation:', error);
          addNotification('Error al iniciar preparación', 'error');
        }
      };

      const handleMarkCompleted = async () => {
        try {
          await supabaseService.updateOrderStatus(order.id, 'Completado');
          addNotification('Pedido completado', 'success');
        } catch (error) {
          console.error('Error marking as completed:', error);
          addNotification('Error al completar pedido', 'error');
        }
      };

      return (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ChefHat className="text-blue-600" size={24} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-800">{order.table_name}</h4>
                <p className="text-sm text-gray-500">{order.timestamp}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold text-sm ${
              order.status === 'Solicitado' ? 'bg-yellow-100 text-yellow-700' :
              order.status === 'En proceso' ? 'bg-blue-100 text-blue-700' :
              order.status === 'Completado' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {order.status}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h5 className="font-semibold text-gray-700 mb-2">Detalles del Pedido:</h5>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-semibold">${item.subtotal}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-blue-600">${order.total}</span>
            </div>
          </div>

          {order.status === 'Solicitado' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="Tiempo estimado (minutos)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleStartPreparation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                disabled={!estimatedMinutes}
              >
                <ChefHat size={20} />
                Comenzar Preparación
              </button>
            </div>
          )}

          {order.status === 'En proceso' && (
            <button
              onClick={handleMarkCompleted}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Marcar como Completado
            </button>
          )}

          {order.status === 'Completado' && (
            <div className="text-center py-2 text-green-600 font-semibold">
              ¡Pedido completado!
            </div>
          )}
        </div>
      );
    };

    const SessionCard = ({ session }) => {
      const sessionOrders = orders.filter(o => o.session_id === session.id);
      const table = tables.find(t => t.id === session.table_id);

      const handleCloseSession = async () => {
        if (!window.confirm(`¿Cerrar sesión de ${session.table_name}?`)) return;

        try {
          await supabaseService.closeSession(session.id, 'admin');
          addNotification('Sesión cerrada', 'success');
        } catch (error) {
          console.error('Error closing session:', error);
          addNotification('Error al cerrar sesión', 'error');
        }
      };

      return (
        <div className="bg-white border-2 border-purple-200 rounded-xl p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-xl font-bold text-gray-800">{session.table_name}</h4>
              <p className="text-sm text-gray-500">
                Inicio: {new Date(session.started_at).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Pedidos: {sessionOrders.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">${parseFloat(session.total_amount).toFixed(2)}</p>
              <p className="text-xs text-gray-500">Total de la sesión</p>
            </div>
          </div>

          {sessionOrders.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h5 className="font-semibold text-gray-700 mb-2">Pedidos de esta sesión:</h5>
              {sessionOrders.map(order => (
                <div key={order.id} className="flex justify-between text-sm py-1">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      order.status === 'Solicitado' ? 'bg-yellow-500' :
                      order.status === 'En proceso' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}></span>
                    {order.timestamp} - {order.status}
                  </span>
                  <span className="font-semibold">${order.total}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleCloseSession}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            <X size={20} />
            Finalizar Sesión
          </button>
        </div>
      );
    };

    const requestedOrders = orders.filter(o => o.status === 'Solicitado');
    const inProgressOrders = orders.filter(o => o.status === 'En proceso');
    const completedOrders = orders.filter(o => o.status === 'Completado');

    return (
      <div className="space-y-6">
        {/* Active Sessions Section */}
        {activeSessions.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Sesiones Activas ({activeSessions.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {/* Orders Management */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Gestión de Pedidos</h3>

          {orders.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <ChefHat className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 text-lg">No hay pedidos activos</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requestedOrders.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                    <AlertCircle size={20} />
                    Solicitados ({requestedOrders.length})
                  </h4>
                  {requestedOrders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              )}

              {inProgressOrders.length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <ChefHat size={20} />
                    En Proceso ({inProgressOrders.length})
                  </h4>
                  {inProgressOrders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              )}

              {completedOrders.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <Check size={20} />
                    Completados ({completedOrders.length})
                  </h4>
                  {completedOrders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // SUB-COMPONENTS FOR CARDS AND FORMS
  const CategoryCard = ({ category, onEdit, onDelete }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition">
      <span className="font-semibold text-gray-800">{category.name}</span>
      <div className="flex items-center gap-2">
        <button onClick={onEdit} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition">
          <Edit2 size={16} />
        </button>
        <button onClick={onDelete} className="text-red-600 hover:bg-red-50 p-2 rounded transition">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  const MenuItemCard = ({ item, onEdit, onDelete }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{item.image}</span>
          <div>
            <p className="font-semibold text-gray-800">{item.name}</p>
            <p className="text-sm text-gray-500">{item.size} - {item.unit}</p>
          </div>
        </div>
        <p className="font-bold text-blue-600">${item.price}</p>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onEdit} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition">
          <Edit2 size={16} />
        </button>
        <button onClick={onDelete} className="text-red-600 hover:bg-red-50 p-2 rounded transition">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  const TableCard = ({ table, businessSlug, onEdit, onDelete, onPrintQR, onAccess }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-2xl font-bold text-gray-800">{table.name}</h4>
          <p className="text-sm text-gray-500">Número: {table.number}</p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
            table.status === 'Ocupada' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {table.status}
          </span>
        </div>
        <QrCode className="text-gray-400" size={48} />
      </div>

      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <p className="text-xs text-gray-500 mb-1">URL de acceso:</p>
        <p className="text-sm text-gray-700 font-mono break-all">
          {window.location.origin}/TableManagement/{businessSlug}/table/{table.number}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onPrintQR} className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1">
          <QrCode size={16} />
          Imprimir QR
        </button>
        <button onClick={onAccess} className="text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1">
          <User size={16} />
          Acceder
        </button>
        <button onClick={onEdit} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1">
          <Edit2 size={16} />
          Editar
        </button>
        <button onClick={onDelete} className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1">
          <Trash2 size={16} />
          Eliminar
        </button>
      </div>
    </div>
  );

  // QR MODAL COMPONENT
  const QRModal = ({ table, businessSlug, onClose }) => {
    const qrRef = useRef(null);

    const downloadQR = () => {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${table.name}-QR.png`;
        link.href = url;
        link.click();
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Código QR</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>

          <div className="text-center">
            <div ref={qrRef} className="bg-white p-6 rounded-xl inline-block">
              <QRCodeCanvas
                value={`${window.location.origin}/TableManagement/${businessSlug}/table/${table.number}`}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="mt-4 mb-6">
              <p className="text-xl font-bold text-gray-800">{table.name}</p>
              <p className="text-sm text-gray-500 mt-1">Escanea para ver el menú</p>
            </div>

            <button
              onClick={downloadQR}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Descargar QR
            </button>
          </div>
        </div>
      </div>
    );
  };

  // FORM COMPONENTS
  const AddCategoryForm = ({ onAdd, onCancel }) => {
    const [name, setName] = useState('');
    return (
      <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-4">
        <h5 className="font-semibold text-gray-800 mb-3">Nueva Categoría</h5>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre de la categoría"
          />
          <button onClick={() => name && onAdd(name)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition">
            Agregar
          </button>
          <button onClick={onCancel} className="text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg transition">
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  const EditCategoryForm = ({ category, onUpdate, onCancel }) => {
    const [name, setName] = useState(category.name);
    return (
      <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-4">
        <h5 className="font-semibold text-gray-800 mb-3">Editar Categoría</h5>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
          />
          <button onClick={() => onUpdate(category.id, name)} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition">
            Guardar
          </button>
          <button onClick={onCancel} className="text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg transition">
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  const AddMenuItemForm = ({ categories, onAdd, onCancel }) => {
    const [formData, setFormData] = useState({
      categoryId: categories[0]?.id || '',
      name: '',
      price: '',
      image: '🍽️',
      size: 'Mediano',
      unit: 'unidad'
    });

    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-4">
        <h5 className="font-semibold text-gray-800 mb-4">Nuevo Item del Menú</h5>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Nombre del producto"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Precio</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Imagen (Emoji)</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-2xl text-center"
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tamaño</label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({...formData, size: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option>Chico</option>
              <option>Mediano</option>
              <option>Grande</option>
              <option>Unidad</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Unidad</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option>unidad</option>
              <option>gramos</option>
              <option>ml</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => formData.name && formData.price && onAdd(formData)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Agregar Item
          </button>
          <button onClick={onCancel} className="text-gray-600 hover:bg-gray-200 px-6 py-2 rounded-lg transition">
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  const EditMenuItemForm = ({ item, categories, onUpdate, onCancel }) => {
    const [formData, setFormData] = useState(item);

    return (
      <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-6 mb-4">
        <h5 className="font-semibold text-gray-800 mb-4">Editar Item del Menú</h5>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Precio</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Imagen (Emoji)</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-2xl text-center"
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tamaño</label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({...formData, size: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            >
              <option>Chico</option>
              <option>Mediano</option>
              <option>Grande</option>
              <option>Unidad</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Unidad</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            >
              <option>unidad</option>
              <option>gramos</option>
              <option>ml</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onUpdate(item.id, formData)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Guardar Cambios
          </button>
          <button onClick={onCancel} className="text-gray-600 hover:bg-gray-200 px-6 py-2 rounded-lg transition">
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  const AddTableForm = ({ onAdd, onCancel }) => {
    const [number, setNumber] = useState('');
    const [name, setName] = useState('');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <h5 className="font-semibold text-gray-800 mb-4">Nueva Mesa</h5>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Mesa</label>
              <input
                type="number"
                value={number}
                onChange={(e) => {
                  setNumber(e.target.value);
                  if (!name) setName(`Mesa ${e.target.value}`);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Mesa</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Mesa 1"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => number && name && onAdd(number, name)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                Agregar
              </button>
              <button onClick={onCancel} className="flex-1 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg transition">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditTableForm = ({ table, onUpdate, onCancel }) => {
    const [number, setNumber] = useState(table.number);
    const [name, setName] = useState(table.name);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <h5 className="font-semibold text-gray-800 mb-4">Editar Mesa</h5>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Mesa</label>
              <input
                type="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Mesa</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => onUpdate(table.id, number, name)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                Guardar
              </button>
              <button onClick={onCancel} className="flex-1 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg transition">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // CLIENT VIEW WRAPPER - extrae tableNumber de URL params
  const ClientViewWrapper = () => {
    const { tableNumber } = useParams();

    useEffect(() => {
      setCurrentTable(parseInt(tableNumber));
      setClientTab('menu');
      setCart([]);
      setShowAccount(false);
    }, [tableNumber]);

    return <ClientView />;
  };

  // CLIENT VIEW - mantiene la funcionalidad anterior pero con datos dinámicos
  const ClientView = () => {
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tableOrders = orders.filter(o => o.tableNumber === currentTable);
    const currentOrder = tableOrders.find(o => o.status === 'En preparación' || o.status === 'Entregado');

    // Calculate time remaining for orders in preparation
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
      if (currentOrder && currentOrder.status === 'En preparación' && currentOrder.estimatedTime && currentOrder.startTime) {
        const interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - currentOrder.startTime) / 1000 / 60);
          const remaining = currentOrder.estimatedTime - elapsed;
          setTimeLeft(Math.max(0, remaining));
        }, 1000);

        return () => clearInterval(interval);
      }
    }, [currentOrder]);

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
                <p className="text-sm text-blue-100">Mesa {currentTable}</p>
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

                <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total a Pagar:</span>
                    <span className="text-blue-600">${accountTotal}</span>
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
                <p className="text-sm text-blue-100">Mesa {currentTable}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Banner */}
        {currentOrder && currentOrder.status === 'En preparación' && (
          <div className="bg-blue-500 text-white p-4 shadow-md">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ChefHat size={24} />
                <p className="font-bold text-lg">Tu pedido está en preparación</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock size={20} />
                <p className="text-xl font-bold">{timeLeft} minutos restantes</p>
              </div>
            </div>
          </div>
        )}

        {currentOrder && currentOrder.status === 'Entregado' && (
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
                const items = menuItems.filter(item => item.categoryId === category.id);
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
                        <div className="text-4xl">{item.image}</div>
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
                        <span className="text-gray-600">Subtotal: <span className="font-bold text-gray-800">${item.price * item.quantity}</span></span>
                      </div>
                    </div>
                  ))}

                  <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6">
                    <div className="flex justify-between items-center text-2xl font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">${cartTotal}</span>
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

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      addNotification('Debes iniciar sesión para acceder', 'error');
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NotificationContainer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage onRegisterSuccess={handleRegisterSuccess} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Navigate to="/admin/brand" replace />
          </ProtectedRoute>
        } />
        <Route path="/admin/brand" element={
          <ProtectedRoute>
            <AdminPanel tab="brand" />
          </ProtectedRoute>
        } />
        <Route path="/admin/menu" element={
          <ProtectedRoute>
            <AdminPanel tab="menu" />
          </ProtectedRoute>
        } />
        <Route path="/admin/tables" element={
          <ProtectedRoute>
            <AdminPanel tab="tables" />
          </ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute>
            <AdminPanel tab="orders" />
          </ProtectedRoute>
        } />
        <Route path="/:businessSlug/table/:tableNumber" element={
          <ClientView
            addNotification={addNotification}
          />
        } />
      </Routes>
      {showQRModal && business && <QRModal table={showQRModal} businessSlug={business.slug} onClose={() => setShowQRModal(null)} />}
    </>
  );
}

export default App;
