package com.vangarments.navigation

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import android.util.Log
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.State
import androidx.navigation.NavController
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.lang.ref.WeakReference

// Navigation Route data class
@Serializable
data class NavigationRoute(
    val name: String,
    val displayName: String,
    val icon: String,
    val requiresAuth: Boolean = false,
    val adminOnly: Boolean = false
)

// Navigation State data class
@Serializable
data class NavigationState(
    val currentRoute: String? = null,
    val previousRoute: String? = null,
    val navigationHistory: List<String> = emptyList(),
    val isNavigating: Boolean = false
)

class NavigationManager private constructor(private val context: Context) {
    
    companion object {
        private const val TAG = "NavigationManager"
        private const val PREFS_NAME = "navigation_prefs"
        private const val STATE_KEY = "navigation_state"
        private const val MAX_HISTORY_COUNT = 10
        
        @Volatile
        private var INSTANCE: NavigationManager? = null
        
        fun getInstance(context: Context): NavigationManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: NavigationManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
    
    // App routes definition
    val appRoutes = listOf(
        NavigationRoute("wardrobe", "Guarda-roupa", "shirt", requiresAuth = true),
        NavigationRoute("discover", "Descobrir", "sparkles", requiresAuth = true),
        NavigationRoute("camera", "Adicionar", "camera", requiresAuth = true),
        NavigationRoute("marketplace", "Marketplace", "storefront", requiresAuth = true),
        NavigationRoute("profile", "Perfil", "person", requiresAuth = true),
        NavigationRoute("auth", "Autenticação", "login", requiresAuth = false)
    )
    
    private val _navigationState = MutableStateFlow(NavigationState())
    val navigationState: StateFlow<NavigationState> = _navigationState.asStateFlow()
    
    private val _selectedTab = mutableStateOf(0)
    val selectedTab: State<Int> = _selectedTab
    
    private var navControllerRef: WeakReference<NavController>? = null
    private val sharedPrefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    init {
        loadNavigationState()
        Log.d(TAG, "NavigationManager initialized")
    }
    
    // Set NavController reference
    fun setNavController(navController: NavController) {
        navControllerRef = WeakReference(navController)
        Log.d(TAG, "NavController set")
    }
    
    // Navigate to a route
    fun navigate(routeName: String, animated: Boolean = true): Boolean {
        return try {
            Log.d(TAG, "Navigating to: $routeName")
            
            if (!canNavigateToRoute(routeName)) {
                Log.w(TAG, "Cannot navigate to $routeName - access denied")
                return false
            }
            
            updateCurrentRoute(routeName)
            
            // Handle tab navigation
            getTabIndex(routeName)?.let { tabIndex ->
                _selectedTab.value = tabIndex
            }
            
            // Navigate using NavController if available
            navControllerRef?.get()?.let { navController ->
                try {
                    navController.navigate(routeName)
                } catch (e: Exception) {
                    Log.e(TAG, "NavController navigation failed", e)
                }
            }
            
            saveNavigationState()
            Log.d(TAG, "Navigation to $routeName successful")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Navigation failed", e)
            false
        }
    }
    
    // Go back
    fun goBack(): Boolean {
        return try {
            Log.d(TAG, "Going back")
            
            val currentState = _navigationState.value
            val targetRoute = currentState.previousRoute 
                ?: currentState.navigationHistory.getOrNull(currentState.navigationHistory.size - 2)
                ?: "wardrobe" // Default fallback
            
            navigate(targetRoute, animated = true)
        } catch (e: Exception) {
            Log.e(TAG, "Go back failed", e)
            false
        }
    }
    
    // Reset navigation
    fun reset(routeName: String): Boolean {
        return try {
            Log.d(TAG, "Resetting to: $routeName")
            
            _navigationState.value = NavigationState(
                currentRoute = routeName,
                previousRoute = null,
                navigationHistory = listOf(routeName),
                isNavigating = false
            )
            
            getTabIndex(routeName)?.let { tabIndex ->
                _selectedTab.value = tabIndex
            }
            
            saveNavigationState()
            Log.d(TAG, "Reset to $routeName successful")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Reset failed", e)
            false
        }
    }
    
    // Route management
    fun getRoute(name: String): NavigationRoute? {
        return appRoutes.find { it.name == name }
    }
    
    fun getAuthenticatedRoutes(): List<NavigationRoute> {
        return appRoutes.filter { it.requiresAuth }
    }
    
    fun getPublicRoutes(): List<NavigationRoute> {
        return appRoutes.filter { !it.requiresAuth }
    }
    
    fun canNavigateToRoute(
        routeName: String, 
        isAuthenticated: Boolean = true, 
        isAdmin: Boolean = false
    ): Boolean {
        val route = getRoute(routeName) ?: return true // Allow unknown routes
        
        if (route.adminOnly && !isAdmin) return false
        if (route.requiresAuth && !isAuthenticated) return false
        
        return true
    }
    
    // Private methods
    private fun updateCurrentRoute(routeName: String) {
        val currentState = _navigationState.value
        val newHistory = (currentState.navigationHistory + routeName)
            .takeLast(MAX_HISTORY_COUNT)
        
        _navigationState.value = currentState.copy(
            previousRoute = currentState.currentRoute,
            currentRoute = routeName,
            navigationHistory = newHistory
        )
        
        Log.d(TAG, "Route updated from ${currentState.currentRoute} to $routeName")
    }
    
    private fun getTabIndex(routeName: String): Int? {
        return when (routeName) {
            "wardrobe" -> 0
            "discover" -> 1
            "camera" -> 2
            "marketplace" -> 3
            "profile" -> 4
            else -> null
        }
    }
    
    // Persistence
    private fun saveNavigationState() {
        try {
            val json = Json.encodeToString(_navigationState.value)
            sharedPrefs.edit().putString(STATE_KEY, json).apply()
            Log.d(TAG, "Navigation state saved")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save navigation state", e)
        }
    }
    
    private fun loadNavigationState() {
        try {
            val json = sharedPrefs.getString(STATE_KEY, null)
            if (json != null) {
                val state = Json.decodeFromString<NavigationState>(json)
                _navigationState.value = state
                
                // Update selected tab
                state.currentRoute?.let { currentRoute ->
                    getTabIndex(currentRoute)?.let { tabIndex ->
                        _selectedTab.value = tabIndex
                    }
                }
                
                Log.d(TAG, "Navigation state loaded - current route: ${state.currentRoute}")
            } else {
                Log.d(TAG, "No saved navigation state found")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load navigation state", e)
        }
    }
    
    // Deep link handling
    fun handleDeepLink(uri: Uri): Boolean {
        return try {
            Log.d(TAG, "Handling deep link: $uri")
            
            val pathSegments = uri.pathSegments
            if (pathSegments.isNotEmpty()) {
                val routeName = pathSegments[0]
                navigate(routeName, animated = true)
            } else {
                Log.w(TAG, "Invalid deep link - no path segments")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Deep link handling failed", e)
            false
        }
    }
    
    // Debug
    fun debugNavigation() {
        val state = _navigationState.value
        Log.d(TAG, "=== Navigation Debug Info ===")
        Log.d(TAG, "Current Route: ${state.currentRoute}")
        Log.d(TAG, "Previous Route: ${state.previousRoute}")
        Log.d(TAG, "History: ${state.navigationHistory}")
        Log.d(TAG, "Selected Tab: ${_selectedTab.value}")
        Log.d(TAG, "Available Routes: ${appRoutes.size}")
        Log.d(TAG, "NavController Available: ${navControllerRef?.get() != null}")
        Log.d(TAG, "=============================")
    }
}