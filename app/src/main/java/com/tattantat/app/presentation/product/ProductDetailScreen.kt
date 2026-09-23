package com.tattantat.app.presentation.product

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.tattantat.app.domain.product.Product
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

@OptIn(ExperimentalFoundationApi::class)
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
    var viewingImageIndex by remember { mutableStateOf<Int?>(null) }
    var showDownloadConfirmUrl by remember { mutableStateOf<String?>(null) }
    
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

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

    val isFav = shown.id in favoriteIds
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
                        modifier = Modifier.weight(1f).height(48.dp),
                        contentPadding = PaddingValues(horizontal = 4.dp)
                    ) {
                        Text(
                            text = "Chat với người bán",
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            fontSize = 12.sp,
                            softWrap = false,
                            overflow = TextOverflow.Ellipsis
                        )
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
                        modifier = Modifier
                            .fillMaxSize()
                            .combinedClickable(
                                onClick = { viewingImageIndex = page },
                                onLongClick = { showDownloadConfirmUrl = albumImages[page] }
                            ),
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
                            if (isFav) Icons.Outlined.Favorite else Icons.Outlined.FavoriteBorder,
                            "Yêu thích",
                            tint = if (isFav) Color.Red else MaterialTheme.colorScheme.onSurface
                        )
                    }
                    IconButton({
                        val shareUrl = "https://tattantat.vn/products/${shown.id}"
                        val shareText = "${shown.title}\nGiá: ${shown.price}\nXem chi tiết tại: $shareUrl"
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, shown.title)
                            putExtra(Intent.EXTRA_TEXT, shareText)
                        }
                        context.startActivity(Intent.createChooser(shareIntent, "Chia sẻ tin đăng"))
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

                val conditionVi = formatConditionVietnamese(shown.condition)
                Text(
                    "$conditionVi · ${shown.location} · ${shown.postedAt}",
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

    // Full Screen Image Viewer Dialog
    if (viewingImageIndex != null) {
        val modalPagerState = rememberPagerState(initialPage = viewingImageIndex ?: 0) { albumImages.size }
        Dialog(
            onDismissRequest = { viewingImageIndex = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black)
            ) {
                HorizontalPager(
                    state = modalPagerState,
                    modifier = Modifier.fillMaxSize()
                ) { page ->
                    AsyncImage(
                        model = albumImages[page],
                        contentDescription = "Ảnh phóng to ${page + 1}",
                        modifier = Modifier
                            .fillMaxSize()
                            .combinedClickable(
                                onClick = {},
                                onLongClick = { showDownloadConfirmUrl = albumImages[page] }
                            ),
                        contentScale = ContentScale.Fit
                    )
                }

                // Top Controls
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .align(Alignment.TopCenter),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { viewingImageIndex = null },
                        modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), CircleShape)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Đóng", tint = Color.White)
                    }

                    Text(
                        text = "${modalPagerState.currentPage + 1}/${albumImages.size}",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )

                    IconButton(
                        onClick = { showDownloadConfirmUrl = albumImages[modalPagerState.currentPage] },
                        modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), CircleShape)
                    ) {
                        Icon(Icons.Default.Download, contentDescription = "Tải ảnh", tint = Color.White)
                    }
                }
            }
        }
    }

    // Confirm Download Dialog
    showDownloadConfirmUrl?.let { url ->
        AlertDialog(
            onDismissRequest = { showDownloadConfirmUrl = null },
            title = { Text("Tải ảnh về máy?") },
            text = { Text("Bạn có muốn lưu bức ảnh này vào thư viện hình ảnh của thiết bị?") },
            confirmButton = {
                TextButton(onClick = {
                    saveImageToGallery(context, url, coroutineScope)
                    showDownloadConfirmUrl = null
                }) {
                    Text("Tải về")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDownloadConfirmUrl = null }) {
                    Text("Hủy")
                }
            }
        )
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

fun formatConditionVietnamese(condition: String?): String {
    if (condition.isNullOrBlank()) return "Chưa cập nhật"
    return when (condition.uppercase()) {
        "NEW", "NEW_FULLBOX" -> "Mới 100%"
        "LIKE_NEW", "USED_LIKE_NEW" -> "Như mới (99%)"
        "USED_GOOD", "GOOD" -> "Đã sử dụng (Còn tốt)"
        "USED_FAIR", "FAIR" -> "Đã sử dụng (Khá)"
        "REFURBISHED" -> "Đã tân trang / Sửa chữa"
        else -> condition
    }
}

private fun saveImageToGallery(context: Context, imageUrl: String, coroutineScope: CoroutineScope) {
    coroutineScope.launch(Dispatchers.IO) {
        try {
            val url = URL(imageUrl)
            val connection = url.openConnection() as HttpURLConnection
            connection.doInput = true
            connection.connect()
            val input = connection.inputStream
            val bitmap = BitmapFactory.decodeStream(input)

            val filename = "TTT_${System.currentTimeMillis()}.jpg"
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/TatTanTat")
                }
            }

            val resolver = context.contentResolver
            val imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
            if (imageUri != null) {
                resolver.openOutputStream(imageUri)?.use { out ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, out)
                }
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Đã lưu ảnh vào thư viện!", Toast.LENGTH_SHORT).show()
                }
            } else {
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Không thể lưu ảnh", Toast.LENGTH_SHORT).show()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            withContext(Dispatchers.Main) {
                Toast.makeText(context, "Lỗi tải ảnh: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
