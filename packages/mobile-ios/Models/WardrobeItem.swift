import Foundation
import SwiftUI

// MARK: - Wardrobe Item Model
struct WardrobeItem: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var category: ItemCategory
    var brand: String?
    var color: String
    var size: String
    var condition: ItemCondition
    var imageURL: String?
    var localImagePath: String?
    var tags: [String]
    var isFavorite: Bool
    var wearCount: Int
    var lastWorn: Date?
    var vufsId: String?
    var purchaseDate: Date?
    var purchasePrice: Double?
    var notes: String?
    var isPublic: Bool
    
    // Sync properties
    var lastModified: Date
    var needsSync: Bool
    var isDeleted: Bool
    
    init(
        id: String = UUID().uuidString,
        name: String,
        category: ItemCategory,
        brand: String? = nil,
        color: String,
        size: String,
        condition: ItemCondition = .good,
        imageURL: String? = nil,
        localImagePath: String? = nil,
        tags: [String] = [],
        isFavorite: Bool = false,
        wearCount: Int = 0,
        lastWorn: Date? = nil,
        vufsId: String? = nil,
        purchaseDate: Date? = nil,
        purchasePrice: Double? = nil,
        notes: String? = nil,
        isPublic: Bool = true
    ) {
        self.id = id
        self.name = name
        self.category = category
        self.brand = brand
        self.color = color
        self.size = size
        self.condition = condition
        self.imageURL = imageURL
        self.localImagePath = localImagePath
        self.tags = tags
        self.isFavorite = isFavorite
        self.wearCount = wearCount
        self.lastWorn = lastWorn
        self.vufsId = vufsId
        self.purchaseDate = purchaseDate
        self.purchasePrice = purchasePrice
        self.notes = notes
        self.isPublic = isPublic
        
        // Sync properties
        self.lastModified = Date()
        self.needsSync = true
        self.isDeleted = false
    }
}

// MARK: - Item Category
enum ItemCategory: String, CaseIterable, Codable {
    case tops = "tops"
    case bottoms = "bottoms"
    case dresses = "dresses"
    case outerwear = "outerwear"
    case shoes = "shoes"
    case accessories = "accessories"
    case underwear = "underwear"
    case activewear = "activewear"
    case sleepwear = "sleepwear"
    case bags = "bags"
    case jewelry = "jewelry"
    
    var displayName: String {
        switch self {
        case .tops: return "Blusas & Camisetas"
        case .bottoms: return "Calças & Saias"
        case .dresses: return "Vestidos"
        case .outerwear: return "Casacos & Jaquetas"
        case .shoes: return "Sapatos"
        case .accessories: return "Acessórios"
        case .underwear: return "Roupas Íntimas"
        case .activewear: return "Roupas Esportivas"
        case .sleepwear: return "Pijamas"
        case .bags: return "Bolsas"
        case .jewelry: return "Joias"
        }
    }
    
    var icon: String {
        switch self {
        case .tops: return "tshirt"
        case .bottoms: return "rectangle.stack"
        case .dresses: return "figure.dress.line.vertical.figure"
        case .outerwear: return "coat"
        case .shoes: return "shoe"
        case .accessories: return "eyeglasses"
        case .underwear: return "undergarment"
        case .activewear: return "figure.run"
        case .sleepwear: return "bed.double"
        case .bags: return "bag"
        case .jewelry: return "sparkles"
        }
    }
    
    var color: Color {
        switch self {
        case .tops: return .pink
        case .bottoms: return .blue
        case .dresses: return .purple
        case .outerwear: return .gray
        case .shoes: return .orange
        case .accessories: return .green
        case .underwear: return .red
        case .activewear: return .mint
        case .sleepwear: return .indigo
        case .bags: return .brown
        case .jewelry: return .yellow
        }
    }
}

// MARK: - Item Condition
enum ItemCondition: String, CaseIterable, Codable {
    case new = "new"
    case excellent = "excellent"
    case good = "good"
    case fair = "fair"
    case poor = "poor"
    
    var displayName: String {
        switch self {
        case .new: return "Novo"
        case .excellent: return "Excelente"
        case .good: return "Bom"
        case .fair: return "Regular"
        case .poor: return "Ruim"
        }
    }
    
    var color: Color {
        switch self {
        case .new: return .green
        case .excellent: return .mint
        case .good: return .yellow
        case .fair: return .orange
        case .poor: return .red
        }
    }
    
    var description: String {
        switch self {
        case .new: return "Nunca usado, com etiquetas"
        case .excellent: return "Usado poucas vezes, sem defeitos"
        case .good: return "Usado normalmente, pequenos sinais de uso"
        case .fair: return "Sinais visíveis de uso, mas funcional"
        case .poor: return "Muito usado, defeitos visíveis"
        }
    }
}

// MARK: - VUFS (Virtual Universal Fashion System)
struct VUFSData: Codable {
    let id: String
    let itemType: String
    let brand: String?
    let color: String
    let size: String
    let material: String?
    let season: String?
    let style: String?
    let createdAt: Date
    
    var formattedId: String {
        return "VUFS-\(id.prefix(8).uppercased())"
    }
}

// MARK: - Outfit Model
struct Outfit: Identifiable, Codable {
    let id: String
    var name: String
    var items: [String] // Item IDs
    var occasion: String?
    var season: String?
    var weather: String?
    var notes: String?
    var imageURL: String?
    var isPublic: Bool
    var likes: Int
    var createdAt: Date
    var lastModified: Date
    
    init(
        id: String = UUID().uuidString,
        name: String,
        items: [String] = [],
        occasion: String? = nil,
        season: String? = nil,
        weather: String? = nil,
        notes: String? = nil,
        imageURL: String? = nil,
        isPublic: Bool = true,
        likes: Int = 0
    ) {
        self.id = id
        self.name = name
        self.items = items
        self.occasion = occasion
        self.season = season
        self.weather = weather
        self.notes = notes
        self.imageURL = imageURL
        self.isPublic = isPublic
        self.likes = likes
        self.createdAt = Date()
        self.lastModified = Date()
    }
}

// MARK: - Extensions
extension WardrobeItem {
    var displayImage: String {
        return localImagePath ?? imageURL ?? "placeholder-item"
    }
    
    var conditionBadgeColor: Color {
        return condition.color
    }
    
    var categoryBadgeColor: Color {
        return category.color
    }
    
    mutating func markAsWorn() {
        wearCount += 1
        lastWorn = Date()
        lastModified = Date()
        needsSync = true
    }
    
    mutating func toggleFavorite() {
        isFavorite.toggle()
        lastModified = Date()
        needsSync = true
    }
    
    mutating func updateImage(localPath: String) {
        localImagePath = localPath
        lastModified = Date()
        needsSync = true
    }
    
    func generateVUFSId() -> String {
        let categoryCode = category.rawValue.prefix(3).uppercased()
        let colorCode = color.prefix(3).uppercased()
        let sizeCode = size.replacingOccurrences(of: " ", with: "")
        let timestamp = String(Int(Date().timeIntervalSince1970))
        
        return "VUFS-\(categoryCode)-\(colorCode)-\(sizeCode)-\(timestamp.suffix(4))"
    }
}

// MARK: - Sample Data
extension WardrobeItem {
    static let sampleItems: [WardrobeItem] = [
        WardrobeItem(
            name: "Blusa Básica Branca",
            category: .tops,
            brand: "Zara",
            color: "Branco",
            size: "M",
            condition: .excellent,
            tags: ["básico", "casual", "trabalho"],
            isFavorite: true,
            wearCount: 15,
            vufsId: "VUFS-TOP-WHT-M-1234"
        ),
        WardrobeItem(
            name: "Calça Jeans Skinny",
            category: .bottoms,
            brand: "Levi's",
            color: "Azul",
            size: "38",
            condition: .good,
            tags: ["jeans", "casual", "versátil"],
            wearCount: 8,
            vufsId: "VUFS-BOT-BLU-38-5678"
        ),
        WardrobeItem(
            name: "Vestido Floral Midi",
            category: .dresses,
            brand: "Farm",
            color: "Estampado",
            size: "P",
            condition: .new,
            tags: ["floral", "feminino", "verão"],
            isFavorite: true,
            wearCount: 3,
            vufsId: "VUFS-DRE-FLO-P-9012"
        )
    ]
}