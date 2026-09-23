package com.tattantat.app.presentation.product

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.tattantat.app.domain.product.Product

@Composable
fun ProductDetailScreen(
    productId: String,
    fallback: Product? = null,
    onBack: () -> Unit = {},
    onChat: (String) -> Unit,
    onBuy: () -> Unit,
    vm: ProductViewModel = hiltViewModel(),
) {
    val openedChatId by vm.openedChatId.collectAsState()
    val chatError by vm.chatError.collectAsState()
    val detail by vm.detail.collectAsState()
    val loading by vm.detailLoading.collectAsState()
    val error by vm.detailError.collectAsState()
    val favoriteIds by vm.favoriteIds.collectAsState()
    val reportMessage by vm.reportMessage.collectAsState()
    var reporting by remember { mutableStateOf(false) }
    var blocking by remember { mutableStateOf(false) }
    val context = LocalContext.current

    LaunchedEffect(productId) { vm.loadDetail(productId) }
    LaunchedEffect(openedChatId) { openedChatId?.let { onChat(it); vm.consumedOpenedChat() } }
    val shown = detail ?: fallback

    if (shown == null) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            when {
                loading -> CircularProgressIndicator()
                else -> Text(error ?: "Không tìm thấy sản phẩm")
            }
        }
        return
    }

    val albumImages = remember(shown) {
        if (shown.images.isNotEmpty()) shown.images else listOf(shown.imageUrl)
    }
    val pagerState = rememberPagerState { albumImages.size }

    Scaffold(
        bottomBar = {
            Surface(
                shadowElevation = 8.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = { vm.openChat(shown.id) },
                        modifier = Modifier.weight(1f).height(48.dp)
                    ) {
                        Text("Chat với người bán", fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = onBuy,
                        modifier = Modifier.weight(1f).height(48.dp)
                    ) {
                        Text("Mua ngay", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
        ) {
            // Album Carousel
            Box(Modifier.fillMaxWidth().height(300.dp)) {
                HorizontalPager(
                    state = pagerState,
                    modifier = Modifier.fillMaxSize()
                ) { page ->
                    AsyncImage(
                        model = albumImages[page],
                        contentDescription = "${shown.title} - Ảnh ${page + 1}",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }

                // Back Button overlay
                IconButton(
                    onClick = onBack,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(12.dp)
                        .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Quay lại",
                        tint = Color.White
                    )
                }

                // Album counter overlay (e.g. 1/4)
                if (albumImages.size > 1) {
                    Surface(
                        color = Color.Black.copy(alpha = 0.6f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "${pagerState.currentPage + 1}/${albumImages.size}",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            // Product Details Content
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        shown.title,
                        Modifier.weight(1f),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton({ vm.toggleFavorite(shown.id) }) {
                        Icon(
                            if (shown.id in favoriteIds) Icons.Outlined.Favorite else Icons.Outlined.FavoriteBorder,
                            "Yêu thích",
                            tint = if (shown.id in favoriteIds) Color.Red else MaterialTheme.colorScheme.onSurface
                        )
                    }
                    IconButton({
                        context.startActivity(
                            Intent.createChooser(
                                Intent(Intent.ACTION_SEND).apply {
                                    type = "text/plain"
                                    putExtra(
                                        Intent.EXTRA_TEXT,
                                        "${shown.title} · ${shown.price}\n${shown.description.orEmpty()}\nTất Tần Tật"
                                    )
                                },
                                "Chia sẻ sản phẩm",
                            ),
                        )
                    }) {
                        Icon(Icons.Outlined.Share, "Chia sẻ")
                    }
                }

                Text(
                    shown.price,
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    "${shown.condition ?: "Chưa cập nhật"} · ${shown.location} · ${shown.postedAt}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                HorizontalDivider()

                Text("Mô tả chi tiết", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                Text(
                    shown.description?.takeIf { it.isNotBlank() } ?: "Người bán chưa thêm mô tả cho sản phẩm này.",
                    style = MaterialTheme.typography.bodyMedium
                )

                HorizontalDivider()

                Text("Thông tin người bán", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                Text("Người bán: ${shown.sellerName}", style = MaterialTheme.typography.bodyMedium)
                Text("★ 4,9 · Người bán uy tín", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    TextButton(onClick = { reporting = true }) { Text("Báo cáo tin đăng", color = MaterialTheme.colorScheme.error) }
                    TextButton(onClick = { blocking = true }) { Text("Chặn người bán") }
                }

                chatError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                reportMessage?.let { Text(it, color = MaterialTheme.colorScheme.primary) }

                Spacer(Modifier.height(16.dp))
            }
        }
    }

    if (reporting) {
        AlertDialog(
            onDismissRequest = { reporting = false },
            title = { Text("Báo cáo tin đăng") },
            text = { Text("Bạn xác nhận tin này có dấu hiệu lừa đảo hoặc vi phạm quy định?") },
            confirmButton = { TextButton(onClick = { vm.reportProduct(shown.id, "OTHER", null); reporting = false }) { Text("Gửi báo cáo") } },
            dismissButton = { TextButton(onClick = { reporting = false }) { Text("Hủy") } }
        )
    }
    if (blocking) {
        AlertDialog(
            onDismissRequest = { blocking = false },
            title = { Text("Chặn người bán?") },
            text = { Text("Bạn sẽ không nhận thêm liên hệ từ người bán này.") },
            confirmButton = { TextButton(onClick = { vm.blockSeller(shown.sellerId); blocking = false }) { Text("Chặn") } },
            dismissButton = { TextButton(onClick = { blocking = false }) { Text("Hủy") } }
        )
    }
}
