package com.tattantat.app.presentation.category

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tattantat.app.domain.category.Category

@Composable fun CategoryScreen() { val categories = listOf(Category("phone", "Điện thoại", "📱"), Category("laptop", "Laptop", "💻"), Category("fashion", "Thời trang", "👕"), Category("home", "Nhà cửa", "🛋️"), Category("vehicle", "Xe cộ", "🛵"), Category("other", "Khác", "⋯")); LazyVerticalGrid(GridCells.Fixed(3), Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) { items(categories) { category -> Card { Column(Modifier.fillMaxWidth().padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(category.emoji, style = MaterialTheme.typography.headlineMedium); Text(category.name) } } } } }
