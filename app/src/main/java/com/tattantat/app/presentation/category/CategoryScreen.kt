package com.tattantat.app.presentation.category

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.tattantat.app.domain.category.Category
import com.tattantat.app.domain.category.CategoryIcons

@Composable
fun CategoryScreen(onCategorySelected: (String) -> Unit = {}) {
    val categories = listOf(
        Category("nha-dat", "Nhà đất", "🏠", slug = "nha-dat"),
        Category("xe-co", "Xe cộ", "🛵", slug = "xe-co"),
        Category("do-cong-nghe", "Đồ công nghệ", "💻", slug = "do-cong-nghe"),
        Category("nha-cua-doi-song", "Nhà cửa & Đời sống", "🛋️", slug = "nha-cua-doi-song"),
        Category("thoi-trang-ca-nhan", "Thời trang", "👕", slug = "thoi-trang-ca-nhan"),
        Category("me-va-be", "Mẹ & Bé", "🍼", slug = "me-va-be"),
        Category("the-thao-giai-tri", "Thể thao & Giải trí", "⚽", slug = "the-thao-giai-tri"),
        Category("thu-cung", "Thú cưng", "🐶", slug = "thu-cung"),
        Category("viec-lam", "Việc làm", "💼", slug = "viec-lam"),
        Category("dich-vu", "Dịch vụ", "🛠️", slug = "dich-vu"),
        Category("thuc-pham", "Thực phẩm", "🍎", slug = "thuc-pham"),
        Category("may-moc-cong-nghiep", "Máy móc", "⚙️", slug = "may-moc-cong-nghiep"),
        Category("tang-mien-phi", "Tặng miễn phí", "🎁", slug = "tang-mien-phi"),
        Category("khac", "Khác", "⋯", slug = "khac")
    )

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text(
            "Tất cả danh mục",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        LazyVerticalGrid(
            GridCells.Fixed(3),
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(categories) { category ->
                Card(
                    onClick = { onCategorySelected(category.slug.ifBlank { category.id }) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Column(
                        Modifier.fillMaxWidth().padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        val iconRes = category.iconRes ?: CategoryIcons.getDrawableRes(category.slug.ifBlank { category.id })
                        Image(
                            painter = painterResource(id = iconRes),
                            contentDescription = category.name,
                            modifier = Modifier.size(52.dp),
                            contentScale = ContentScale.Fit
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            category.name,
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
