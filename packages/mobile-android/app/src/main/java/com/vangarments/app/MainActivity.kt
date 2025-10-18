package com.vangarments.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.lifecycleScope
import com.vangarments.app.data.local.VangarmentsDatabase
import com.vangarments.app.data.repository.AuthRepository
import com.vangarments.app.data.repository.WardrobeRepository
import com.vangarments.app.presentation.navigation.VangarmentsNavigation
import com.vangarments.app.presentation.theme.VangarmentsTheme
import com.vangarments.app.presentation.viewmodel.AuthViewModel
import com.vangarments.app.presentation.viewmodel.WardrobeViewModel
import com.vangarments.app.utils.NetworkManager
import com.vangarments.app.utils.SyncManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var database: VangarmentsDatabase
    
    @Inject
    lateinit var authRepository: AuthRepository
    
    @Inject
    lateinit var wardrobeRepository: WardrobeRepository
    
    @Inject
    lateinit var networkManager: NetworkManager
    
    @Inject
    lateinit var syncManager: SyncManager
    
    private val authViewModel: AuthViewModel by viewModels()
    private val wardrobeViewModel: WardrobeViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen
        installSplashScreen()
        
        super.onCreate(savedInstanceState)
        
        // Initialize app components
        initializeApp()
        
        setContent {
            VangarmentsTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    VangarmentsApp(
                        authViewModel = authViewModel,
                        wardrobeViewModel = wardrobeViewModel
                    )
                }
            }
        }
    }
    
    private fun initializeApp() {
        lifecycleScope.launch {
            // Initialize network manager
            networkManager.initialize()
            
            // Check authentication status
            authViewModel.checkAuthenticationStatus()
            
            // Start periodic sync if authenticated
            if (authViewModel.isAuthenticated.value) {
                syncManager.startPeriodicSync()
            }
            
            // Initialize wardrobe data
            wardrobeViewModel.loadWardrobeItems()
        }
    }
    
    override fun onResume() {
        super.onResume()
        // Resume sync when app comes to foreground
        if (authViewModel.isAuthenticated.value) {
            lifecycleScope.launch {
                syncManager.syncNow()
            }
        }
    }
    
    override fun onPause() {
        super.onPause()
        // Pause sync when app goes to background
        syncManager.pauseSync()
    }
}

@Composable
fun VangarmentsApp(
    authViewModel: AuthViewModel,
    wardrobeViewModel: WardrobeViewModel
) {
    val isAuthenticated by authViewModel.isAuthenticated.collectAsState()
    val isLoading by authViewModel.isLoading.collectAsState()
    
    VangarmentsNavigation(
        isAuthenticated = isAuthenticated,
        isLoading = isLoading,
        authViewModel = authViewModel,
        wardrobeViewModel = wardrobeViewModel
    )
}