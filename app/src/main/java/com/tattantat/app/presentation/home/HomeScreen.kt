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
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.rememberCoroutineScope
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import com.tattantat.app.R
import com.tattantat.app.domain.category.Category
import com.tattantat.app.domain.category.CategoryIcons
import com.tattantat.app.domain.product.Product
import com.tattantat.app.presentation.product.ProductViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onProduct: (String) -> Unit = {},
    onNotifications: () -> Unit = {},
    onExplore: () -> Unit = {},
    onCategoryClick: (Category) -> Unit = {},
    onSell: () -> Unit = {},
    onFavorites: () -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val productViewModel: ProductViewModel = hiltViewModel()
    val favoriteIds by productViewModel.favoriteIds.collectAsState()
    val coroutineScope = rememberCoroutineScope()
    var isRefreshing by remember { mutableStateOf(false) }

    // Parent Categories (5 per page)
    val parentCategories = remember(state.categories) {
        val parents = state.categories.filter { it.parentId == null }
        if (parents.isNotEmpty()) parents else state.categories
    }
    val categoryPages = remember(parentCategories) { parentCategories.chunked(5) }
    val categoryPagerState = rememberPagerState { categoryPages.size }

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = {
            coroutineScope.launch {
                isRefreshing = true
                viewModel.refresh()
                delay(800)
                isRefreshing = false
            }
        },
        modifier = Modifier.fillMaxSize()
    ) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(vertical = 12.dp)) {
            HomeHeader(onNotifications, onExplore, onFavorites)

            // 5 Parent Categories per page
            if (categoryPages.isNotEmpty()) {
                HorizontalPager(
                    state = categoryPagerState,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)
                ) { pageIndex ->
                    val pageItems = categoryPages.getOrNull(pageIndex).orEmpty()
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.Top
                    ) {
                        pageItems.forEach { cat ->
                            CategoryItem(cat, onClick = { onCategoryClick(cat) })
                        }
                    }
                }
                if (categoryPages.size > 1) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        repeat(categoryPages.size) { iteration ->
                            val color = if (categoryPagerState.currentPage == iteration) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant
                            Box(modifier = Modifier.padding(2.dp).size(6.dp).clip(CircleShape).background(color))
                        }
                    }
                }
            }

            SectionHeader("Sản phẩm gần bạn", "Xem tất cả", onExplore)
            ProductPager(
                products = state.nearby,
                favoriteIds = favoriteIds,
                onProductClick = onProduct,
                onFavoriteClick = { productViewModel.toggleFavorite(it) }
            )

            Spacer(Modifier.height(20.dp))

            SectionHeader("Mới đăng hôm nay", "Xem tất cả", onExplore)
            ProductPager(
                products = state.nearby.reversed(),
                favoriteIds = favoriteIds,
                onProductClick = onProduct,
                onFavoriteClick = { productViewModel.toggleFavorite(it) }
            )

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun ProductPager(
    products: List<Product>,
    favoriteIds: Set<String>,
    onProductClick: (String) -> Unit,
    onFavoriteClick: (String) -> Unit
) {
    val pages = remember(products) { products.chunked(2) }
    if (pages.isEmpty()) return
    val pagerState = rememberPagerState { pages.size }
    Column {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxWidth(),
            contentPadding = PaddingValues(horizontal = 16.dp),
            pageSpacing = 12.dp
        ) { pageIndex ->
            val pageItems = pages.getOrNull(pageIndex).orEmpty()
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                pageItems.forEach { product ->
                    Box(modifier = Modifier.weight(1f)) {
                        ProductCard(
                            product = product,
                            onClick = { onProductClick(product.id) },
                            isFavorite = product.id in favoriteIds,
                            onFavorite = { onFavoriteClick(product.id) }
                        )
                    }
                }
                if (pageItems.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
        if (pages.size > 1) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                horizontalArrangement = Arrangement.Center
            ) {
                repeat(minOf(pages.size, 8)) { iteration ->
                    val color = if (pagerState.currentPage == iteration) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant
                    Box(modifier = Modifier.padding(2.dp).size(6.dp).clip(CircleShape).background(color))
                }
            }
        }
    }
}

@Composable
private fun HomeHeader(onNotifications: () -> Unit, onExplore: () -> Unit, onFavorites: () -> Unit = {}) = Column(Modifier.padding(horizontal = 16.dp)) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.weight(1f)) {
            Image(
                painter = painterResource(id = R.drawable.ic_app_logo_horizontal),
                contentDescription = "Tất Tần Tật",
                modifier = Modifier.height(36.dp),
                contentScale = ContentScale.Fit
            )
        }
        IconButton(onClick = onFavorites) { Icon(Icons.Outlined.FavoriteBorder, "Yêu thích") }
        IconButton(onClick = onNotifications) { Icon(Icons.Outlined.NotificationsNone, "Thông báo") }
    }
    OutlinedTextField(
        value = "", onValueChange = {},
        modifier = Modifier.fillMaxWidth().padding(top = 12.dp).clickable(onClick = onExplore),
        readOnly = true, singleLine = true,
        placeholder = { Text("Tìm kiếm mọi thứ bạn cần…") },
        leadingIcon = { Icon(Icons.Outlined.Search, null) },
        shape = RoundedCornerShape(14.dp)
    )
}

@Composable
private fun SectionHeader(title: String, action: String, onAction: () -> Unit) = Row(
    Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
    verticalAlignment = Alignment.CenterVertically
) {
    Text(title, Modifier.weight(1f), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
    Text(action, Modifier.clickable(onClick = onAction), color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelLarge)
}

@Composable
fun CategoryItem(category: Category, onClick: () -> Unit = {}) = Column(
    horizontalAlignment = Alignment.CenterHorizontally,
    modifier = Modifier.width(68.dp).clickable(onClick = onClick)
) {
    Box(Modifier.size(52.dp).clip(RoundedCornerShape(16.dp)).background(MaterialTheme.colorScheme.primaryContainer), contentAlignment = Alignment.Center) {
        val iconRes = category.iconRes ?: CategoryIcons.getDrawableRes(category.slug.ifBlank { category.id })
        Image(
            painter = painterResource(id = iconRes),
            contentDescription = category.name,
            modifier = Modifier.size(38.dp),
            contentScale = ContentScale.Fit
        )
    }
    Text(
        category.name,
        Modifier.padding(top = 6.dp),
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        style = MaterialTheme.typography.labelSmall,
        fontWeight = FontWeight.Medium
    )
}

@Composable
fun ProductCard(
    product: Product,
    onClick: () -> Unit = {},
    isFavorite: Boolean = false,
    onFavorite: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) = Card(
    onClick = onClick,
    shape = RoundedCornerShape(14.dp),
    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    modifier = modifier.fillMaxWidth()
) {
    Box {
        AsyncImage(
            model = product.imageUrl,
            contentDescription = product.title,
            modifier = Modifier.fillMaxWidth().height(130.dp),
            contentScale = ContentScale.Crop
        )
        if (onFavorite != null) {
            IconButton(onClick = onFavorite, Modifier.align(Alignment.TopEnd)) {
                Icon(
                    if (isFavorite) Icons.Outlined.Favorite else Icons.Outlined.FavoriteBorder,
                    contentDescription = "Yêu thích",
                    tint = if (isFavorite) Color.Red else Color.White
                )
            }
        }
    }
    Column(Modifier.padding(10.dp)) {
        Text(
            product.title,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
        Text(
            product.price,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.titleSmall,
            modifier = Modifier.padding(top = 4.dp)
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(top = 4.dp)
        ) {
            Icon(Icons.Outlined.LocationOn, null, Modifier.size(12.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.width(2.dp))
            Text(
                product.location,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
        ) {
            Text(
                product.postedAt,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f, fill = false)
            )
            var showMenu by remember { mutableStateOf(false) }
            Box {
                IconButton(
                    onClick = { showMenu = true },
                    modifier = Modifier.size(20.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.MoreVert,
                        contentDescription = "Tùy chọn",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )
                }
                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Báo cáo tin đăng") },
                        onClick = { showMenu = false }
                    )
                    DropdownMenuItem(
                        text = { Text("Chia sẻ tin đăng") },
                        onClick = { showMenu = false }
                    )
                }
            }
        }
    }
}
