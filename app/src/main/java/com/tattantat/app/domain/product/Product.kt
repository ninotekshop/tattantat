package com.tattantat.app.domain.product

data class Product(
    val id: String, val title: String, val price: String, val location: String,
    val postedAt: String, val sellerName: String, val imageUrl: String, val isFavorite: Boolean = false,
    val description: String? = null, val condition: String? = null, val status: String = "ACTIVE", val sellerId: String = "",
    val categoryId: Long? = null, val images: List<String> = emptyList()
)
