package com.tattantat.app.presentation.search

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tattantat.app.domain.product.Product
import com.tattantat.app.presentation.home.ProductCard

@Composable fun SearchScreen(products: List<Product>, onProduct: (String) -> Unit) { var query by remember { mutableStateOf("") }; val result = products.filter { it.title.contains(query, true) }; Column(Modifier.fillMaxSize().padding(16.dp)) { OutlinedTextField(query, { query = it }, Modifier.fillMaxWidth(), label = { Text("Tìm kiếm mọi thứ bạn cần…") }, singleLine = true); Spacer(Modifier.height(12.dp)); if (result.isEmpty()) Text("Không có kết quả phù hợp") else LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) { items(result) { ProductCard(it, onClick = { onProduct(it.id) }) } } } }
