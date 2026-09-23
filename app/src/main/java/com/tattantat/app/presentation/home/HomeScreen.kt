package com.tattantat.app.presentation.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.tattantat.app.domain.category.Category
import com.tattantat.app.domain.category.CategoryIcons
import com.tattantat.app.domain.product.Product
import com.tattantat.app.presentation.product.ProductViewModel

@Composable
fun HomeScreen(
    onProduct: (String) -> Unit = {},
    onNotifications: () -> Unit = {},
    onExplore: () -> Unit = {},
    onCategory: (Long) -> Unit = {},
    onSell: () -> Unit = {},
    onFavorites: () -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val productViewModel: ProductViewModel = hiltViewModel()
    val favoriteIds by productViewModel.favoriteIds.collectAsState()
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(vertical = 12.dp)) {
        HomeHeader(onNotifications, onExplore, onFavorites)
        PromoBanner(onSell)
        SectionHeader("Danh mục nổi bật", "Xem tất cả", onExplore)
        LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            items(state.categories) { CategoryItem(it, onClick = { it.id.toLongOrNull()?.let(onCategory) }) }
        }
        Spacer(Modifier.height(20.dp))
        SectionHeader("Sản phẩm gần bạn", "Xem tất cả", onExplore)
        LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            items(state.nearby) { ProductCard(it, onClick = { onProduct(it.id) }, isFavorite = it.id in favoriteIds, onFavorite = { productViewModel.toggleFavorite(it.id) }) }
        }
        Spacer(Modifier.height(20.dp))
        SectionHeader("Mới đăng hôm nay", "Xem tất cả", onExplore)
        LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            items(state.nearby.reversed()) { ProductCard(it, onClick = { onProduct(it.id) }, isFavorite = it.id in favoriteIds, onFavorite = { productViewModel.toggleFavorite(it.id) }) }
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable private fun HomeHeader(onNotifications: () -> Unit, onExplore: () -> Unit, onFavorites: () -> Unit = {}) = Column(Modifier.padding(horizontal = 16.dp)) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text("Tất Tần Tật", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Text("Mua gì cũng có - Bán gì cũng dễ", style = MaterialTheme.typography.labelSmall)
        }
        IconButton(onClick = onFavorites) { Icon(Icons.Outlined.FavoriteBorder, "Yêu thích") }
        IconButton(onClick = onNotifications) { Icon(Icons.Outlined.NotificationsNone, "Thông báo") }
    }
    OutlinedTextField(value = "", onValueChange = {}, modifier = Modifier.fillMaxWidth().padding(top = 12.dp).clickable(onClick = onExplore), readOnly = true, singleLine = true,
        placeholder = { Text("Tìm kiếm mọi thứ bạn cần…") }, leadingIcon = { Icon(Icons.Outlined.Search, null) }, shape = RoundedCornerShape(14.dp))
}

@Composable private fun PromoBanner(onSell: () -> Unit) = Card(Modifier.fillMaxWidth().padding(16.dp).clickable(onClick = onSell), shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
    Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) { Text("Dọn nhà, bán nhanh", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium); Text("Đăng tin miễn phí chỉ trong vài phút") }
        Text("ĐĂNG BÁN", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
    }
}

@Composable private fun SectionHeader(title: String, action: String, onAction: () -> Unit) = Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
    Text(title, Modifier.weight(1f), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
    Text(action, Modifier.clickable(onClick = onAction), color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelLarge)
}

@Composable fun CategoryItem(category: Category, onClick: () -> Unit = {}) = Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(72.dp).clickable(onClick = onClick)) {
    Box(Modifier.size(56.dp).clip(RoundedCornerShape(16.dp)).background(MaterialTheme.colorScheme.primaryContainer), contentAlignment = Alignment.Center) {
        val iconRes = category.iconRes ?: CategoryIcons.getDrawableRes(category.slug.ifBlank { category.id })
        Image(
            painter = painterResource(id = iconRes),
            contentDescription = category.name,
            modifier = Modifier.size(42.dp),
            contentScale = ContentScale.Fit
        )
    }
    Text(category.name, Modifier.padding(top = 6.dp), maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.labelSmall)
}

@Composable fun ProductCard(product: Product, onClick: () -> Unit = {}, isFavorite: Boolean = false, onFavorite: (() -> Unit)? = null) = Card(Modifier.width(174.dp).clickable(onClick = onClick), shape = RoundedCornerShape(14.dp), elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)) {
    Box { AsyncImage(product.imageUrl, product.title, Modifier.fillMaxWidth().height(142.dp), contentScale = ContentScale.Crop); if(onFavorite != null) IconButton(onClick = onFavorite, Modifier.align(Alignment.TopEnd)) { Icon(if(isFavorite) Icons.Outlined.Favorite else Icons.Outlined.FavoriteBorder, "Yêu thích", tint = Color.White) } }
    Column(Modifier.padding(10.dp)) { Text(product.title, maxLines = 2, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodyMedium); Text(product.price, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 6.dp)); Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Outlined.LocationOn, null, Modifier.size(14.dp)); Text(product.location, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.labelSmall) }; Text(product.postedAt, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
}
