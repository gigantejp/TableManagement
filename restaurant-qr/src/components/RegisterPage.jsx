import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, Building2, ArrowLeft } from 'lucide-react';
import * as authService from '../lib/authService';

const RegisterPage = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessTypeId: ''
  });

  useEffect(() => {
    loadBusinessTypes();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const loadBusinessTypes = async () => {
    try {
      const types = await authService.getBusinessTypes();
      setBusinessTypes(types);
    } catch (error) {
      console.error('Error loading business types:', error);
      setError('Error al cargar tipos de comercio');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check cooldown
    if (cooldown > 0) {
      setError(`Por favor espera ${cooldown} segundos antes de intentar nuevamente`);
      return;
    }

    // Validations
    if (!formData.businessName.trim()) {
      setError('El nombre del comercio es requerido');
      return;
    }

    if (!formData.email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!formData.businessTypeId) {
      setError('Debes seleccionar un tipo de comercio');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.signUp({
        email: formData.email,
        password: formData.password,
        businessName: formData.businessName,
        businessTypeId: parseInt(formData.businessTypeId)
      });

      console.log('Registration successful:', result);

      // Call success callback with user and business data
      if (onRegisterSuccess) {
        onRegisterSuccess(result.user, result.business);
      }

      // Redirect to admin panel
      navigate('/admin/brand');
    } catch (error) {
      console.error('Registration error:', error);

      // Set cooldown to prevent spam
      setCooldown(60);

      // Parse error message
      let errorMessage = 'Error al crear la cuenta. Intenta nuevamente.';

      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        errorMessage = 'Este email ya está registrado';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'El email no es válido';
      } else if (error.message.includes('Password')) {
        errorMessage = 'La contraseña no cumple con los requisitos';
      } else if (error.message.includes('security purposes') || error.message.includes('rate limit')) {
        errorMessage = 'Demasiados intentos. Por favor espera un minuto e intenta nuevamente.';
      } else if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = 'Demasiados intentos. Por favor espera unos minutos.';
      } else if (error.message) {
        // Only show the error message if it doesn't contain technical jargon
        if (!error.message.includes('seconds')) {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full mb-4">
            <Store size={24} />
            <span className="font-bold text-lg">Table Management</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Crea tu Cuenta
          </h2>
          <p className="text-gray-600">
            Registra tu negocio y comienza a digitalizar tu servicio
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Comercio
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Ej: Heladería Vanshelatto"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Comercio
              </label>
              <select
                name="businessTypeId"
                value={formData.businessTypeId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              >
                <option value="">Selecciona un tipo</option>
                {businessTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email del Administrador
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite la contraseña"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creando cuenta...
                </>
              ) : cooldown > 0 ? (
                <>
                  Espera {cooldown}s
                </>
              ) : (
                <>
                  <Store size={20} />
                  Crear Cuenta
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Inicia sesión
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 py-2 font-medium transition"
            >
              <ArrowLeft size={18} />
              Volver al inicio
            </Link>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Al crear una cuenta, aceptas nuestros Términos de Servicio y Política de Privacidad
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
