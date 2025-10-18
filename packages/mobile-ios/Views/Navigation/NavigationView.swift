import SwiftUI

// MARK: - Enhanced Tab View with Navigation
struct EnhancedTabView: View {
    @EnvironmentObject var navigationManager: NavigationManager
    @EnvironmentObject var authManager: AuthenticationManager
    
    var body: some View {
        TabView(selection: $navigationManager.selectedTab) {
            WardrobeView()
                .tabItem {
                    Image(systemName: "tshirt")
                    Text("Guarda-roupa")
                }
                .tag(0)
                .onAppear {
                    navigationManager.navigate(to: "wardrobe", animated: false)
                }
            
            DiscoverView()
                .tabItem {
                    Image(systemName: "sparkles")
                    Text("Descobrir")
                }
                .tag(1)
                .onAppear {
                    navigationManager.navigate(to: "discover", animated: false)
                }
            
            CameraView()
                .tabItem {
                    Image(systemName: "camera")
                    Text("Adicionar")
                }
                .tag(2)
                .onAppear {
                    navigationManager.navigate(to: "camera", animated: false)
                }
            
            CommunityView()
                .tabItem {
                    Image(systemName: "person.2")
                    Text("Comunidade")
                }
                .tag(3)
                .onAppear {
                    navigationManager.navigate(to: "community", animated: false)
                }
            
            ProfileView()
                .tabItem {
                    Image(systemName: "person.circle")
                    Text("Perfil")
                }
                .tag(4)
                .onAppear {
                    navigationManager.navigate(to: "profile", animated: false)
                }
        }
        .accentColor(Color("PrimaryColor"))
        .onAppear {
            setupTabBarAppearance()
        }
    }
    
    private func setupTabBarAppearance() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBackground
        
        // Configure selected state
        appearance.stackedLayoutAppearance.selected.iconColor = UIColor(named: "PrimaryColor")
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: UIColor(named: "PrimaryColor") ?? UIColor.systemBlue
        ]
        
        // Configure normal state
        appearance.stackedLayoutAppearance.normal.iconColor = UIColor.systemGray
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: UIColor.systemGray
        ]
        
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
}

// MARK: - Navigation Bar with Back Button
struct NavigationBarView: View {
    @EnvironmentObject var navigationManager: NavigationManager
    let title: String
    let showBackButton: Bool
    let onBackTapped: (() -> Void)?
    
    init(title: String, showBackButton: Bool = true, onBackTapped: (() -> Void)? = nil) {
        self.title = title
        self.showBackButton = showBackButton
        self.onBackTapped = onBackTapped
    }
    
    var body: some View {
        HStack {
            if showBackButton {
                Button(action: {
                    if let onBackTapped = onBackTapped {
                        onBackTapped()
                    } else {
                        navigationManager.goBack()
                    }
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 16, weight: .medium))
                        Text("Voltar")
                            .font(.system(size: 16, weight: .medium))
                    }
                    .foregroundColor(Color("PrimaryColor"))
                }
            }
            
            Spacer()
            
            Text(title)
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.primary)
            
            Spacer()
            
            if showBackButton {
                // Invisible spacer to center the title
                HStack(spacing: 4) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .medium))
                    Text("Voltar")
                        .font(.system(size: 16, weight: .medium))
                }
                .opacity(0)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            Color(.systemBackground)
                .shadow(color: .black.opacity(0.1), radius: 1, x: 0, y: 1)
        )
    }
}

// MARK: - Navigation Debug View
struct NavigationDebugView: View {
    @EnvironmentObject var navigationManager: NavigationManager
    @State private var showDebugInfo = false
    
    var body: some View {
        if ProcessInfo.processInfo.environment["DEBUG"] == "1" {
            VStack {
                Spacer()
                
                HStack {
                    Spacer()
                    
                    Button(action: {
                        showDebugInfo.toggle()
                    }) {
                        Image(systemName: "info.circle.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.blue)
                            .background(Color.white)
                            .clipShape(Circle())
                            .shadow(radius: 2)
                    }
                    .padding(.trailing, 16)
                    .padding(.bottom, 100) // Above tab bar
                }
            }
            .sheet(isPresented: $showDebugInfo) {
                NavigationDebugSheet()
            }
        }
    }
}

// MARK: - Navigation Debug Sheet
struct NavigationDebugSheet: View {
    @EnvironmentObject var navigationManager: NavigationManager
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            List {
                Section("Current State") {
                    HStack {
                        Text("Current Route")
                        Spacer()
                        Text(navigationManager.navigationState.currentRoute ?? "None")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Previous Route")
                        Spacer()
                        Text(navigationManager.navigationState.previousRoute ?? "None")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Selected Tab")
                        Spacer()
                        Text("\(navigationManager.selectedTab)")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Is Navigating")
                        Spacer()
                        Text(navigationManager.navigationState.isNavigating ? "Yes" : "No")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section("Navigation History") {
                    if navigationManager.navigationState.navigationHistory.isEmpty {
                        Text("No history")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(navigationManager.navigationState.navigationHistory.reversed(), id: \.self) { route in
                            Text(route)
                        }
                    }
                }
                
                Section("Available Routes") {
                    ForEach(navigationManager.appRoutes) { route in
                        HStack {
                            Image(systemName: route.icon)
                                .foregroundColor(Color("PrimaryColor"))
                            
                            VStack(alignment: .leading) {
                                Text(route.displayName)
                                    .font(.system(size: 16, weight: .medium))
                                
                                Text(route.name)
                                    .font(.system(size: 12))
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            if route.requiresAuth {
                                Image(systemName: "lock.fill")
                                    .font(.system(size: 12))
                                    .foregroundColor(.orange)
                            }
                            
                            if route.adminOnly {
                                Image(systemName: "crown.fill")
                                    .font(.system(size: 12))
                                    .foregroundColor(.purple)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            navigationManager.navigate(to: route.name)
                            dismiss()
                        }
                    }
                }
                
                Section("Actions") {
                    Button("Print Debug Info") {
                        navigationManager.debugNavigation()
                    }
                    
                    Button("Go Back") {
                        navigationManager.goBack()
                        dismiss()
                    }
                    
                    Button("Reset to Wardrobe") {
                        navigationManager.reset(to: "wardrobe")
                        dismiss()
                    }
                }
            }
            .navigationTitle("Navigation Debug")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Navigation Breadcrumb
struct NavigationBreadcrumb: View {
    @EnvironmentObject var navigationManager: NavigationManager
    
    var body: some View {
        if navigationManager.navigationState.navigationHistory.count > 1 {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(Array(navigationManager.navigationState.navigationHistory.enumerated()), id: \.offset) { index, routeName in
                        HStack(spacing: 4) {
                            if index > 0 {
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12))
                                    .foregroundColor(.secondary)
                            }
                            
                            Button(action: {
                                navigationManager.navigate(to: routeName)
                            }) {
                                Text(getDisplayName(for: routeName))
                                    .font(.system(size: 14, weight: index == navigationManager.navigationState.navigationHistory.count - 1 ? .semibold : .regular))
                                    .foregroundColor(index == navigationManager.navigationState.navigationHistory.count - 1 ? .primary : Color("PrimaryColor"))
                            }
                            .disabled(index == navigationManager.navigationState.navigationHistory.count - 1)
                        }
                    }
                }
                .padding(.horizontal, 16)
            }
            .padding(.vertical, 8)
            .background(Color(.systemGray6))
        }
    }
    
    private func getDisplayName(for routeName: String) -> String {
        return navigationManager.getRoute(by: routeName)?.displayName ?? routeName.capitalized
    }
}