package com.vangarments.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.*

@Entity(tableName = "wardrobe_items")
@TypeConverters(Converters::class)
data class WardrobeItem(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val category: ItemCategory,
    val brand: String? = null,
    val color: String,
    val size: String,
    val condition: ItemCondition = ItemCondition.GOOD,
    val imageUrl: String? = null,
    val localImagePath: String? = null,
    val tags: List<String> = emptyList(),
    val isFavorite: Boolean = false,
    val wearCount: Int = 0,
    val lastWorn: Date? = null,
    val vufsId: String? = null,
    val purchaseDate: Date? = null,
    val purchasePrice: Double? = null,
    val notes: String? = null,
    val isPublic: Boolean = true,
    
    // Sync properties
    val lastModified: Date = Date(),
    val needsSync: Boolean = true,
    val isDeleted: Boolean = false
) {
    fun generateVufsId(): String {
        val categoryCode = category.name.take(3).uppercase()
        val colorCode = color.take(3).uppercase()
        val sizeCode = size.replace(" ", "")
        val timestamp = System.currentTimeMillis().toString().takeLast(4)
        
        return "VUFS-$categoryCode-$colorCode-$sizeCode-$timestamp"
    }
    
    fun markAsWorn(): WardrobeItem {
        return copy(
            wearCount = wearCount + 1,
            lastWorn = Date(),
            lastModified = Date(),
            needsSync = true
        )
    }
    
    fun toggleFavorite(): WardrobeItem {
        return copy(
            isFavorite = !isFavorite,
            lastModified = Date(),
            needsSync = true
        )
    }
    
    fun updateImage(localPath: String): WardrobeItem {
        return copy(
            localImagePath = localPath,
            lastModified = Date(),
            needsSync = true
        )
    }
}

enum class ItemCategory(val displayName: String, val icon: String) {
    TOPS("Blusas & Camisetas", "ic_tshirt"),
    BOTTOMS("Calças & Saias", "ic_pants"),
    DRESSES("Vestidos", "ic_dress"),
    OUTERWEAR("Casacos & Jaquetas", "ic_jacket"),
    SHOES("Sapatos", "ic_shoe"),
    ACCESSORIES("Acessórios", "ic_accessories"),
    UNDERWEAR("Roupas Íntimas", "ic_underwear"),
    ACTIVEWEAR("Roupas Esportivas", "ic_activewear"),
    SLEEPWEAR("Pijamas", "ic_sleepwear"),
    BAGS("Bolsas", "ic_bag"),
    JEWELRY("Joias", "ic_jewelry");
    
    companion object {
        fun fromString(value: String): ItemCategory {
            return values().find { it.name.equals(value, ignoreCase = true) } ?: TOPS
        }
    }
}

enum class ItemCondition(val displayName: String, val description: String) {
    NEW("Novo", "Nunca usado, com etiquetas"),
    EXCELLENT("Excelente", "Usado poucas vezes, sem defeitos"),
    GOOD("Bom", "Usado normalmente, pequenos sinais de uso"),
    FAIR("Regular", "Sinais visíveis de uso, mas funcional"),
    POOR("Ruim", "Muito usado, defeitos visíveis");
    
    companion object {
        fun fromString(value: String): ItemCondition {
            return values().find { it.name.equals(value, ignoreCase = true) } ?: GOOD
        }
    }
}

@Entity(tableName = "outfits")
@TypeConverters(Converters::class)
data class Outfit(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val itemIds: List<String> = emptyList(),
    val occasion: String? = null,
    val season: String? = null,
    val weather: String? = null,
    val notes: String? = null,
    val imageUrl: String? = null,
    val isPublic: Boolean = true,
    val likes: Int = 0,
    val createdAt: Date = Date(),
    val lastModified: Date = Date()
)

data class VufsData(
    val id: String,
    val itemType: String,
    val brand: String?,
    val color: String,
    val size: String,
    val material: String?,
    val season: String?,
    val style: String?,
    val createdAt: Date
) {
    val formattedId: String
        get() = "VUFS-${id.take(8).uppercase()}"
}

// Type converters for Room database
class Converters {
    private val gson = Gson()
    
    @TypeConverter
    fun fromStringList(value: List<String>): String {
        return gson.toJson(value)
    }
    
    @TypeConverter
    fun toStringList(value: String): List<String> {
        val listType = object : TypeToken<List<String>>() {}.type
        return gson.fromJson(value, listType) ?: emptyList()
    }
    
    @TypeConverter
    fun fromDate(date: Date?): Long? {
        return date?.time
    }
    
    @TypeConverter
    fun toDate(timestamp: Long?): Date? {
        return timestamp?.let { Date(it) }
    }
    
    @TypeConverter
    fun fromItemCategory(category: ItemCategory): String {
        return category.name
    }
    
    @TypeConverter
    fun toItemCategory(categoryName: String): ItemCategory {
        return ItemCategory.fromString(categoryName)
    }
    
    @TypeConverter
    fun fromItemCondition(condition: ItemCondition): String {
        return condition.name
    }
    
    @TypeConverter
    fun toItemCondition(conditionName: String): ItemCondition {
        return ItemCondition.fromString(conditionName)
    }
}

// Sample data for testing
object SampleData {
    val sampleItems = listOf(
        WardrobeItem(
            name = "Blusa Básica Branca",
            category = ItemCategory.TOPS,
            brand = "Zara",
            color = "Branco",
            size = "M",
            condition = ItemCondition.EXCELLENT,
            tags = listOf("básico", "casual", "trabalho"),
            isFavorite = true,
            wearCount = 15,
            vufsId = "VUFS-TOP-WHT-M-1234"
        ),
        WardrobeItem(
            name = "Calça Jeans Skinny",
            category = ItemCategory.BOTTOMS,
            brand = "Levi's",
            color = "Azul",
            size = "38",
            condition = ItemCondition.GOOD,
            tags = listOf("jeans", "casual", "versátil"),
            wearCount = 8,
            vufsId = "VUFS-BOT-BLU-38-5678"
        ),
        WardrobeItem(
            name = "Vestido Floral Midi",
            category = ItemCategory.DRESSES,
            brand = "Farm",
            color = "Estampado",
            size = "P",
            condition = ItemCondition.NEW,
            tags = listOf("floral", "feminino", "verão"),
            isFavorite = true,
            wearCount = 3,
            vufsId = "VUFS-DRE-FLO-P-9012"
        ),
        WardrobeItem(
            name = "Tênis Branco Couro",
            category = ItemCategory.SHOES,
            brand = "Adidas",
            color = "Branco",
            size = "37",
            condition = ItemCondition.EXCELLENT,
            tags = listOf("esportivo", "casual", "conforto"),
            wearCount = 12,
            vufsId = "VUFS-SHO-WHT-37-3456"
        )
    )
}