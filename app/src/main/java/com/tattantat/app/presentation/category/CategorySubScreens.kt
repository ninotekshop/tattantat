package com.tattantat.app.presentation.category

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tattantat.app.domain.category.Category
import com.tattantat.app.domain.category.CategoryIcons
import com.tattantat.app.presentation.home.HomeViewModel
import com.tattantat.app.presentation.home.ProductCard
import com.tattantat.app.presentation.product.ProductViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubCategoriesScreen(
    parentId: String,
    onBack: () -> Unit,
    onSubCategoryClick: (Category) -> Unit,
    homeViewModel: HomeViewModel = hiltViewModel()
) {
    val state by homeViewModel.state.collectAsState()
    val parentCat = state.categories.find { it.id == parentId || it.slug == parentId }
    val subCategories = remember(state.categories, parentId) {
        state.categories.filter { it.parentId == parentId || (parentCat != null && it.parentId == parentCat.id) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(parentCat?.name ?: "Danh mục con", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        }
    ) { padding ->
        if (subCategories.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Không tìm thấy danh mục con.")
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                contentPadding = PaddingValues(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize().padding(padding)
            ) {
                items(subCategories) { cat ->
                    Card(
                        onClick = { onSubCategoryClick(cat) },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                    ) {
                        Column(
                            Modifier.fillMaxWidth().padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            val iconRes = cat.iconRes ?: CategoryIcons.getDrawableRes(cat.slug.ifBlank { cat.id })
                            Image(
                                painter = painterResource(id = iconRes),
                                contentDescription = cat.name,
                                modifier = Modifier.size(48.dp),
                                contentScale = ContentScale.Fit
                            )
                            Spacer(Modifier.height(8.dp))
                            Text(
                                cat.name,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Medium,
                                textAlign = TextAlign.Center,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CategoryProductsScreen(
    categoryId: String,
    categoryName: String,
    onBack: () -> Unit,
    onProductClick: (String) -> Unit,
    productViewModel: ProductViewModel = hiltViewModel()
) {
    val products by productViewModel.products.collectAsState()
    val favoriteIds by productViewModel.favoriteIds.collectAsState()
    val categoryProducts = remember(products, categoryId) {
        val catIdLong = categoryId.toLongOrNull()
        products.filter { p -> catIdLong == null || p.categoryId == catIdLong }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(categoryName.ifBlank { "Danh sách sản phẩm" }, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        }
    ) { padding ->
        if (categoryProducts.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Chưa có tin đăng nào trong danh mục này.")
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize().padding(padding)
            ) {
                items(categoryProducts, key = { it.id }) { product ->
                    ProductCard(
                        product = product,
                        onClick = { onProductClick(product.id) },
                        isFavorite = product.id in favoriteIds,
                        onFavorite = { productViewModel.toggleFavorite(product.id) }
                    )
                }
            }
        }
    }
}
