import SwiftUI
import Combine

// MARK: - Navigation Route
struct NavigationRoute: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let displayName: String
    let icon: String
    let requiresAuth: Bool
    let adminOnly: Bool
    
    init(name: String, displayName: String, icon: String, requiresAuth: Bool = false, adminOnly: Bool = false) {
        self.name = name
        self.displayName = displayName
        self.icon = icon
        self.requiresAuth = requiresAuth
        self.adminOnly = adminOnly
    }
}

// MARK: - Navigation State
struct NavigationState {
    var currentRoute: String?
    var previousRoute: String?
    var navigationHistory: [String]
    var isNavigating: Bool
    
    init() {
        self.currentRoute = nil
        self.previousRoute = nil
        self.navigationHistory = []
        self.isNavigating = false
    }
}

// MARK: - Navigation Manager
class NavigationManager: ObservableObject {
    static let shared = NavigationManager()
    
    @Published var navigationState = NavigationState()
    @Published var selectedTab = 0
    
    private let maxHistoryCount = 10
    
    // Define app routes
    let appRoutes: [NavigationRoute] = [
        NavigationRoute(name: "wardrobe", displayName: "Guarda-roupa", icon: "tshirt", requiresAuth: true),
        NavigationRoute(name: "discover", displayName: "Descobrir", icon: "sparkles", requiresAuth: true),
        NavigationRoute(name: "camera", displayName: "Adicionar", icon: "camera", requiresAuth: true),
        NavigationRoute(name: "community", displayName: "Comunidade", icon: "person.2", requiresAuth: true),
        NavigationRoute(name: "profile", displayName: "Perfil", icon: "person.circle", requiresAuth: true),
        NavigationRoute(name: "auth", displayName: "Autenticação", icon: "person.badge.key", requiresAuth: false)
    ]
    
    private init() {
        loadNavigationState()
    }
    
    // MARK: - Navigation Methods
    
    func navigate(to routeName: String, animated: Bool = true) {
        print("🔧 iOS Navigation: Navigating to \(routeName)")
        
        guard canNavigateToRoute(routeName) else {
            print("❌ iOS Navigation: Cannot navigate to \(routeName) - access denied")
            return
        }
        
        updateCurrentRoute(routeName)
        
        // Handle tab navigation
        if let tabIndex = getTabIndex(for: routeName) {
            withAnimation(animated ? .easeInOut(duration: 0.3) : nil) {
                selectedTab = tabIndex
            }
        }
        
        saveNavigationState()
        print("✅ iOS Navigation: Navigation to \(routeName) successful")
    }
    
    func goBack() {
        print("🔧 iOS Navigation: Going back")
        
        if let previousRoute = navigationState.previousRoute {
            navigate(to: previousRoute, animated: true)
        } else if !navigationState.navigationHistory.isEmpty {
            let lastRoute = navigationState.navigationHistory[navigationState.navigationHistory.count - 2]
            navigate(to: lastRoute, animated: true)
        } else {
            // Default to wardrobe if no history
            navigate(to: "wardrobe", animated: true)
        }
    }
    
    func reset(to routeName: String) {
        print("🔧 iOS Navigation: Resetting to \(routeName)")
        
        navigationState.navigationHistory.removeAll()
        navigationState.previousRoute = nil
        navigate(to: routeName, animated: false)
    }
    
    // MARK: - Route Management
    
    func getRoute(by name: String) -> NavigationRoute? {
        return appRoutes.first { $0.name == name }
    }
    
    func getAuthenticatedRoutes() -> [NavigationRoute] {
        return appRoutes.filter { $0.requiresAuth }
    }
    
    func getPublicRoutes() -> [NavigationRoute] {
        return appRoutes.filter { !$0.requiresAuth }
    }
    
    func canNavigateToRoute(_ routeName: String, isAuthenticated: Bool = true, isAdmin: Bool = false) -> Bool {
        guard let route = getRoute(by: routeName) else {
            return true // Allow unknown routes
        }
        
        if route.adminOnly && !isAdmin {
            return false
        }
        
        if route.requiresAuth && !isAuthenticated {
            return false
        }
        
        return true
    }
    
    // MARK: - Private Methods
    
    private func updateCurrentRoute(_ routeName: String) {
        let previousRoute = navigationState.currentRoute
        
        navigationState.previousRoute = previousRoute
        navigationState.currentRoute = routeName
        
        // Add to history
        navigationState.navigationHistory.append(routeName)
        
        // Limit history size
        if navigationState.navigationHistory.count > maxHistoryCount {
            navigationState.navigationHistory.removeFirst()
        }
        
        print("🔧 iOS Navigation: Route updated from \(previousRoute ?? "nil") to \(routeName)")
    }
    
    private func getTabIndex(for routeName: String) -> Int? {
        switch routeName {
        case "wardrobe":
            return 0
        case "discover":
            return 1
        case "camera":
            return 2
        case "community":
            return 3
        case "profile":
            return 4
        default:
            return nil
        }
    }
    
    // MARK: - Persistence
    
    private func saveNavigationState() {
        do {
            let data = try JSONEncoder().encode(NavigationStateData(from: navigationState))
            UserDefaults.standard.set(data, forKey: "navigationState")
            print("✅ iOS Navigation: State saved")
        } catch {
            print("❌ iOS Navigation: Failed to save state - \(error)")
        }
    }
    
    private func loadNavigationState() {
        guard let data = UserDefaults.standard.data(forKey: "navigationState") else {
            print("🔧 iOS Navigation: No saved state found")
            return
        }
        
        do {
            let stateData = try JSONDecoder().decode(NavigationStateData.self, from: data)
            navigationState = stateData.toNavigationState()
            
            // Update selected tab if current route is available
            if let currentRoute = navigationState.currentRoute,
               let tabIndex = getTabIndex(for: currentRoute) {
                selectedTab = tabIndex
            }
            
            print("✅ iOS Navigation: State loaded - current route: \(navigationState.currentRoute ?? "nil")")
        } catch {
            print("❌ iOS Navigation: Failed to load state - \(error)")
        }
    }
    
    // MARK: - Deep Link Handling
    
    func handleDeepLink(_ url: URL) -> Bool {
        print("🔧 iOS Navigation: Handling deep link - \(url)")
        
        let pathComponents = url.pathComponents.filter { $0 != "/" }
        
        guard !pathComponents.isEmpty else {
            print("❌ iOS Navigation: Invalid deep link - no path components")
            return false
        }
        
        let routeName = pathComponents[0]
        navigate(to: routeName, animated: true)
        
        return true
    }
    
    // MARK: - Debug
    
    func debugNavigation() {
        print("🔧 iOS Navigation Debug Info:")
        print("  Current Route: \(navigationState.currentRoute ?? "nil")")
        print("  Previous Route: \(navigationState.previousRoute ?? "nil")")
        print("  History: \(navigationState.navigationHistory)")
        print("  Selected Tab: \(selectedTab)")
        print("  Available Routes: \(appRoutes.count)")
    }
}

// MARK: - Codable Support
private struct NavigationStateData: Codable {
    let currentRoute: String?
    let previousRoute: String?
    let navigationHistory: [String]
    let isNavigating: Bool
    
    init(from state: NavigationState) {
        self.currentRoute = state.currentRoute
        self.previousRoute = state.previousRoute
        self.navigationHistory = state.navigationHistory
        self.isNavigating = state.isNavigating
    }
    
    func toNavigationState() -> NavigationState {
        var state = NavigationState()
        state.currentRoute = currentRoute
        state.previousRoute = previousRoute
        state.navigationHistory = navigationHistory
        state.isNavigating = isNavigating
        return state
    }
}

// MARK: - SwiftUI Environment
struct NavigationManagerKey: EnvironmentKey {
    static let defaultValue = NavigationManager.shared
}

extension EnvironmentValues {
    var navigationManager: NavigationManager {
        get { self[NavigationManagerKey.self] }
        set { self[NavigationManagerKey.self] = newValue }
    }
}