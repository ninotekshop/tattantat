package com.tattantat.app.models

data class Product(
    val title: String,
    val price: String,
    val location: String,
    val icon: String
)

val products = listOf(
    Product("iPhone 14 Pro 128GB (99%)", "12.500.000đ", "Quy Nhơn · 2,3 km", "📱"),
    Product("MacBook Air M1 2020", "11.000.000đ", "Quy Nhơn · 1,8 km", "💻"),
    Product("Honda Vision 2022", "28.000.000đ", "Quy Nhơn · 4,2 km", "🏍️"),
    Product("Sofa vải 3 chỗ", "4.500.000đ", "Quy Nhơn · 3,1 km", "🛋️")
)
