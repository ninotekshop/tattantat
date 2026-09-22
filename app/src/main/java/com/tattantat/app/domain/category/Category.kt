package com.tattantat.app.domain.category

import androidx.annotation.DrawableRes

data class Category(
    val id: String,
    val name: String,
    val emoji: String = "🏷️",
    val slug: String = "",
    val iconUrl: String? = null,
    @get:DrawableRes val iconRes: Int? = null,
    val parentId: String? = null,
)
