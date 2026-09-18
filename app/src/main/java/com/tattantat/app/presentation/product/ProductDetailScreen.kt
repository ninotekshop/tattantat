package com.tattantat.app.presentation.product

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.tattantat.app.domain.product.Product

@Composable fun ProductDetailScreen(product: Product?, onChat: () -> Unit, onBuy: () -> Unit) {
    if (product == null) { Box(Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) { Text("Không tìm thấy sản phẩm") }; return }
    Column(Modifier.fillMaxSize()) { AsyncImage(product.imageUrl, product.title, Modifier.fillMaxWidth().height(300.dp), contentScale = ContentScale.Crop); Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { Row { Text(product.title, Modifier.weight(1f), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold); IconButton({}) { Icon(Icons.Outlined.FavoriteBorder, "Yêu thích") }; IconButton({}) { Icon(Icons.Outlined.Share, "Chia sẻ") } }; Text(product.price, style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold); Text("Đã sử dụng tốt · ${product.location} · ${product.postedAt}"); HorizontalDivider(); Text("Mô tả", fontWeight = FontWeight.Bold); Text("Sản phẩm được người bán kiểm tra cẩn thận. Liên hệ trực tiếp để xem thêm ảnh và thỏa thuận."); HorizontalDivider(); Text("Người bán: ${product.sellerName}", fontWeight = FontWeight.Bold); Text("★ 4,9 · Người bán uy tín"); Spacer(Modifier.weight(1f)); Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) { OutlinedButton(onClick = onChat, Modifier.weight(1f)) { Text("Chat với người bán") }; Button(onClick = onBuy, Modifier.weight(1f)) { Text("Mua ngay") } } } }
}
