package com.tattantat.app.domain.product

data class Product(
    val id: String, val title: String, val price: String, val location: String,
    val postedAt: String, val sellerName: String, val imageUrl: String, val isFavorite: Boolean = false
)
