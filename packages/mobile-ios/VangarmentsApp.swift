import SwiftUI

@main
struct VangarmentsApp: App {
    @StateObject private var authManager = AuthenticationManager()
    @StateObject private var wardrobeManager = WardrobeManager()
    @StateObject private var syncManager = SyncManager()
    @StateObject private var navigationManager = NavigationManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(wardrobeManager)
                .environmentObject(syncManager)
                .environmentObject(navigationManager)
                .onAppear {
                    setupApp()
                }
                .onOpenURL { url in
                    handleDeepLink(url)
                }
        }
    }
    
    private func setupApp() {
        // Configure app settings
        configureNetworking()
        configureAppearance()
        
        // Initialize managers
        authManager.checkAuthenticationStatus()
        syncManager.startPeriodicSync()
        
        // Setup navigation
        setupNavigation()
    }
    
    private func setupNavigation() {
        print("✅ iOS App: Navigation setup complete")
    }
    
    private func handleDeepLink(_ url: URL) {
        print("🔧 iOS App: Handling deep link - \(url)")
        let success = navigationManager.handleDeepLink(url)
        if !success {
            print("❌ iOS App: Failed to handle deep link")
        }
    }
    
    private func configureNetworking() {
        // Configure API base URL
        NetworkManager.shared.configure(
            baseURL: Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String ?? "https://api.vangarments.com"
        )
    }
    
    private func configureAppearance() {
        // Configure app-wide appearance
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBackground
        appearance.titleTextAttributes = [
            .foregroundColor: UIColor.label,
            .font: UIFont.systemFont(ofSize: 18, weight: .semibold)
        ]
        
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        
        // Configure tab bar appearance
        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithOpaqueBackground()
        tabBarAppearance.backgroundColor = UIColor.systemBackground
        
        UITabBar.appearance().standardAppearance = tabBarAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
    }
}

// MARK: - Content View
struct ContentView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    
    var body: some View {
        Group {
            if authManager.isAuthenticated {
                MainTabView()
            } else {
                AuthenticationView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authManager.isAuthenticated)
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    @EnvironmentObject var navigationManager: NavigationManager
    
    var body: some View {
        ZStack {
            EnhancedTabView()
            
            // Navigation debug overlay
            NavigationDebugView()
        }
        .onAppear {
            // Initialize with wardrobe if no current route
            if navigationManager.navigationState.currentRoute == nil {
                navigationManager.navigate(to: "wardrobe", animated: false)
            }
        }
    }
}

// MARK: - Authentication View
struct AuthenticationView: View {
    @State private var showingLogin = true
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 16) {
                    Image("VangarmentsLogo")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 80, height: 80)
                    
                    VStack(spacing: 8) {
                        Text("Vangarments")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        Text("Sua moda digital")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.top, 60)
                .padding(.bottom, 40)
                
                // Content
                if showingLogin {
                    LoginView(showingLogin: $showingLogin)
                } else {
                    RegisterView(showingLogin: $showingLogin)
                }
                
                Spacer()
            }
            .padding(.horizontal, 24)
            .background(
                LinearGradient(
                    colors: [
                        Color("PrimaryColor").opacity(0.1),
                        Color("AccentColor").opacity(0.05),
                        Color.clear
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
        }
    }
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(AuthenticationManager())
            .environmentObject(WardrobeManager())
            .environmentObject(SyncManager())
    }
}