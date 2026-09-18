package com.tattantat.app.presentation.sell

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.tattantat.app.domain.product.Product
import com.tattantat.app.presentation.home.ProductCard

@Composable fun SellScreen(onMyListings: () -> Unit, vm: SellViewModel = viewModel()) { val form by vm.form.collectAsState(); if (form.published) { PublishSuccess(onMyListings); return }; Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) { Text("Đăng bán", style = MaterialTheme.typography.headlineSmall); Text("Đăng tin nhanh trong vài bước") ; OutlinedButton(onClick = {}) { Text("+ Thêm ảnh sản phẩm") }; Field(form.title, { vm.update { f -> f.copy(title = it) } }, "Tên sản phẩm"); Field(form.price, { vm.update { f -> f.copy(price = it.filter(Char::isDigit)) } }, "Giá (đ)", KeyboardType.Number); Text("Danh mục: ${form.category}"); Text("Tình trạng: ${form.condition}"); OutlinedTextField(form.description, { vm.update { f -> f.copy(description = it) } }, Modifier.fillMaxWidth().height(110.dp), label = { Text("Mô tả ngắn") }); Button(onClick = vm::publish, enabled = form.title.isNotBlank() && form.price.isNotBlank(), modifier = Modifier.fillMaxWidth()) { Text("Đăng bán") }; TextButton(onClick = onMyListings, modifier = Modifier.fillMaxWidth()) { Text("Xem tin đăng của tôi") } } }
@Composable private fun PublishSuccess(onMyListings: () -> Unit) = Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) { Text("Đăng bán thành công!", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary); Text("Tin của bạn đang chờ được hiển thị.", modifier = Modifier.padding(vertical = 12.dp)); Button(onClick = onMyListings, modifier = Modifier.fillMaxWidth()) { Text("Xem tin đăng của tôi") } }
@Composable fun MyListingsScreen() { val items = listOf(Product("mine", "Tai nghe Sony WH-1000XM5", "5.500.000 đ", "Quy Nhơn", "Vừa đăng", "Bạn", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800")); Column(Modifier.fillMaxSize().padding(16.dp)) { Text("Tin đăng của tôi", style = MaterialTheme.typography.headlineSmall); Spacer(Modifier.height(12.dp)); items.forEach { ProductCard(it) } } }
@Composable private fun Field(value: String, update: (String) -> Unit, label: String, type: KeyboardType = KeyboardType.Text) = OutlinedTextField(value, update, Modifier.fillMaxWidth(), label = { Text(label) }, singleLine = true, keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = type))
