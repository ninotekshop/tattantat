package com.tattantat.app.presentation.search

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tattantat.app.presentation.home.ProductCard
import com.tattantat.app.presentation.product.ProductViewModel
import kotlinx.coroutines.delay

@Composable
fun SearchScreen(onProduct: (String) -> Unit, initialCategoryId: Long? = null, vm: ProductViewModel = hiltViewModel()) {
    var query by remember { mutableStateOf("") }
    var categoryId by remember(initialCategoryId) { mutableStateOf(initialCategoryId) }
    val results by vm.searchResults.collectAsState()
    val searching by vm.searching.collectAsState()
    val error by vm.searchError.collectAsState()
    val favoriteIds by vm.favoriteIds.collectAsState()
    val categories by vm.categories.collectAsState()

    // Debouncing keeps each keystroke from becoming a network request while
    // still returning authoritative, current listings from the backend.
    LaunchedEffect(query, categoryId) {
        delay(300)
        vm.search(query, categoryId)
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Tìm kiếm mọi thứ bạn cần…") },
            singleLine = true,
        )
        if (categories.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    FilterChip(selected = categoryId == null, onClick = { categoryId = null }, label = { Text("Tất cả") })
                }
                items(categories, key = { it.id }) { category ->
                    FilterChip(
                        selected = categoryId == category.id,
                        onClick = { categoryId = if (categoryId == category.id) null else category.id },
                        label = { Text(category.name) },
                    )
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        when {
            searching -> CircularProgressIndicator()
            error != null -> Text(error!!, color = MaterialTheme.colorScheme.error)
            results.isEmpty() -> Text(if (query.isBlank()) "Chưa có tin đăng để hiển thị" else "Không có kết quả phù hợp")
            else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(results, key = { it.id }) { product -> ProductCard(product, onClick = { onProduct(product.id) }, isFavorite = product.id in favoriteIds, onFavorite = { vm.toggleFavorite(product.id) }) }
            }
        }
    }
}
