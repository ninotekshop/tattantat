package com.tattantat.app.presentation.product

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import java.text.NumberFormat
import java.util.Locale

@Composable
fun FavoritesScreen(onProduct: (String) -> Unit = {}, vm: FavoritesViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Sản phẩm yêu thích", style = MaterialTheme.typography.headlineSmall)
        TextButton(onClick = vm::refresh) { Text("Làm mới") }
        if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        LazyColumn {
            items(state.products, key = { it.id }) { product ->
                ListItem(
                    modifier = Modifier.clickable { onProduct(product.id) },
                    headlineContent = { Text(product.title) },
                    supportingContent = { Text("${product.price} · ${product.location}") },
                    trailingContent = { TextButton(onClick = { vm.remove(product) }) { Text("Bỏ thích") } },
                )
            }
            if (!state.loading && state.products.isEmpty()) item { Text("Chưa có sản phẩm yêu thích.") }
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    }
}
