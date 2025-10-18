package com.vangarments.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState

// Enhanced Bottom Navigation Bar
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EnhancedBottomNavigationBar(
    navController: NavController,
    navigationManager: NavigationManager
) {
    val currentBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStackEntry?.destination?.route
    val selectedTab by navigationManager.selectedTab
    
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface
    ) {
        navigationManager.getAuthenticatedRoutes().forEachIndexed { index, route ->
            if (route.name != "auth") { // Skip auth route in bottom nav
                NavigationBarItem(
                    icon = {
                        Icon(
                            imageVector = getIconForRoute(route.name),
                            contentDescription = route.displayName
                        )
                    },
                    label = { Text(route.displayName) },
                    selected = selectedTab == index,
                    onClick = {
                        navigationManager.navigate(route.name)
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = MaterialTheme.colorScheme.primary,
                        selectedTextColor = MaterialTheme.colorScheme.primary,
                        unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
            }
        }
    }
}

// Navigation Top Bar with Back Button
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NavigationTopBar(
    title: String,
    showBackButton: Boolean = true,
    onBackClick: (() -> Unit)? = null,
    navigationManager: NavigationManager = NavigationManager.getInstance(LocalContext.current)
) {
    TopAppBar(
        title = {
            Text(
                text = title,
                fontWeight = FontWeight.SemiBold
            )
        },
        navigationIcon = {
            if (showBackButton) {
                IconButton(
                    onClick = {
                        if (onBackClick != null) {
                            onBackClick()
                        } else {
                            navigationManager.goBack()
                        }
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Voltar"
                    )
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface,
            navigationIconContentColor = MaterialTheme.colorScheme.onSurface
        )
    )
}

// Navigation Breadcrumb
@Composable
fun NavigationBreadcrumb(
    navigationManager: NavigationManager
) {
    val navigationState by navigationManager.navigationState.collectAsState()
    
    if (navigationState.navigationHistory.size > 1) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                navigationState.navigationHistory.forEachIndexed { index, routeName ->
                    if (index > 0) {
                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    val isLast = index == navigationState.navigationHistory.size - 1
                    val displayName = navigationManager.getRoute(routeName)?.displayName 
                        ?: routeName.replaceFirstChar { it.uppercase() }
                    
                    if (isLast) {
                        Text(
                            text = displayName,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        TextButton(
                            onClick = { navigationManager.navigate(routeName) },
                            contentPadding = PaddingValues(4.dp)
                        ) {
                            Text(
                                text = displayName,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        }
    }
}

// Navigation Debug Panel
@Composable
fun NavigationDebugPanel(
    navigationManager: NavigationManager,
    isVisible: Boolean,
    onDismiss: () -> Unit
) {
    if (isVisible) {
        val navigationState by navigationManager.navigationState.collectAsState()
        val selectedTab by navigationManager.selectedTab
        
        AlertDialog(
            onDismissRequest = onDismiss,
            title = {
                Text("Navigation Debug")
            },
            text = {
                LazyColumn {
                    item {
                        Text(
                            text = "Current State",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    
                    item {
                        DebugInfoRow("Current Route", navigationState.currentRoute ?: "None")
                        DebugInfoRow("Previous Route", navigationState.previousRoute ?: "None")
                        DebugInfoRow("Selected Tab", selectedTab.toString())
                        DebugInfoRow("Is Navigating", if (navigationState.isNavigating) "Yes" else "No")
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Text(
                            text = "Navigation History",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    
                    if (navigationState.navigationHistory.isEmpty()) {
                        item {
                            Text(
                                text = "No history",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        items(navigationState.navigationHistory.reversed()) { route ->
                            Text(
                                text = "• $route",
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }
                    }
                    
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Text(
                            text = "Available Routes",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    
                    items(navigationManager.appRoutes) { route ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp),
                            onClick = {
                                navigationManager.navigate(route.name)
                                onDismiss()
                            }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = getIconForRoute(route.name),
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                
                                Spacer(modifier = Modifier.width(12.dp))
                                
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = route.displayName,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        text = route.name,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                
                                if (route.requiresAuth) {
                                    Icon(
                                        imageVector = Icons.Default.Lock,
                                        contentDescription = "Requires Auth",
                                        modifier = Modifier.size(16.dp),
                                        tint = MaterialTheme.colorScheme.secondary
                                    )
                                }
                                
                                if (route.adminOnly) {
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(
                                        imageVector = Icons.Default.AdminPanelSettings,
                                        contentDescription = "Admin Only",
                                        modifier = Modifier.size(16.dp),
                                        tint = MaterialTheme.colorScheme.tertiary
                                    )
                                }
                            }
                        }
                    }
                    
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Text(
                            text = "Actions",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    navigationManager.debugNavigation()
                                },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Print Debug")
                            }
                            
                            Button(
                                onClick = {
                                    navigationManager.goBack()
                                    onDismiss()
                                },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Go Back")
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Button(
                            onClick = {
                                navigationManager.reset("wardrobe")
                                onDismiss()
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Reset to Wardrobe")
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = onDismiss) {
                    Text("Close")
                }
            }
        )
    }
}

// Helper Composables
@Composable
private fun DebugInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

// Icon mapping function
private fun getIconForRoute(routeName: String): ImageVector {
    return when (routeName) {
        "wardrobe" -> Icons.Default.Checkroom
        "discover" -> Icons.Default.Explore
        "camera" -> Icons.Default.CameraAlt
        "marketplace" -> Icons.Default.Store
        "profile" -> Icons.Default.Person
        "auth" -> Icons.Default.Login
        else -> Icons.Default.Home
    }
}