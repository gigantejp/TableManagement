import { supabase } from './supabase'

// =====================================================
// AUTHENTICATION SERVICES
// =====================================================

/**
 * Register a new business and user
 */
export const signUp = async ({ email, password, businessName, businessTypeId }) => {
  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No se pudo crear el usuario')

    // 2. Generate business slug from name
    const { data: slugData, error: slugError } = await supabase
      .rpc('generate_business_slug', { business_name: businessName })

    if (slugError) throw slugError

    const businessSlug = slugData

    // 3. Create business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert([{
        id: businessSlug,
        slug: businessSlug,
        name: businessName,
        business_type_id: businessTypeId,
        owner_user_id: authData.user.id,
        logo: getDefaultLogoForType(businessTypeId),
        tagline: '',
        description: '',
        is_active: true
      }])
      .select()
      .single()

    if (businessError) throw businessError

    return {
      user: authData.user,
      business,
      session: authData.session
    }
  } catch (error) {
    console.error('Error in signUp:', error)
    throw error
  }
}

/**
 * Sign in with email and password
 */
export const signIn = async ({ email, password }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Get user's business
    const business = await getUserBusiness(data.user.id)

    return {
      user: data.user,
      business,
      session: data.session
    }
  } catch (error) {
    console.error('Error in signIn:', error)
    throw error
  }
}

/**
 * Sign out
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get current session
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Get user's business
 */
export const getUserBusiness = async (userId) => {
  const { data, error } = await supabase
    .rpc('get_user_business', { user_id: userId })

  if (error) throw error
  return data && data.length > 0 ? data[0] : null
}

/**
 * Get all business types
 */
export const getBusinessTypes = async () => {
  const { data, error } = await supabase
    .from('business_types')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

/**
 * Get default logo emoji for business type
 */
function getDefaultLogoForType(businessTypeId) {
  const logos = {
    1: '🍦', // Heladería
    2: '🍕', // Pizzería
    3: '🍽️', // Restaurante
    4: '☕', // Cafetería
    5: '🍺'  // Bar
  }
  return logos[businessTypeId] || '🏪'
}

/**
 * Get default tagline for business type
 */
export function getDefaultTaglineForType(businessTypeId) {
  const taglines = {
    1: 'Heladería artesanal de calidad',
    2: 'Pizzería tradicional',
    3: 'Restaurante gourmet',
    4: 'Cafetería de especialidad',
    5: 'Bar y bebidas'
  }
  return taglines[businessTypeId] || 'Tu negocio digital'
}

/**
 * Reset password
 */
export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  if (error) throw error
}

/**
 * Update password
 */
export const updatePassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  if (error) throw error
}
