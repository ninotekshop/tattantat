package com.tattantat.app.presentation.product

import android.content.Intent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material3.Button
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.tattantat.app.domain.product.Product

@Composable
fun ProductDetailScreen(
    productId: String,
    fallback: Product? = null,
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

    Column(Modifier.fillMaxSize()) {
        AsyncImage(shown.imageUrl, shown.title, Modifier.fillMaxWidth().height(300.dp), contentScale = ContentScale.Crop)
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row {
                Text(shown.title, Modifier.weight(1f), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                IconButton({ vm.toggleFavorite(shown.id) }) { Icon(if (shown.id in favoriteIds) Icons.Outlined.Favorite else Icons.Outlined.FavoriteBorder, "Yêu thích") }
                IconButton({
                    context.startActivity(
                        Intent.createChooser(
                            Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_TEXT, "${shown.title} · ${shown.price}\n${shown.description.orEmpty()}\nTất Tần Tật")
                            },
                            "Chia sẻ sản phẩm",
                        ),
                    )
                }) { Icon(Icons.Outlined.Share, "Chia sẻ") }
            }
            Text(shown.price, style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            Text("${shown.condition ?: "Chưa cập nhật"} · ${shown.location} · ${shown.postedAt}")
            HorizontalDivider()
            Text("Mô tả", fontWeight = FontWeight.Bold)
            Text(shown.description?.takeIf { it.isNotBlank() } ?: "Người bán chưa thêm mô tả cho sản phẩm này.")
            HorizontalDivider()
            Text("Người bán: ${shown.sellerName}", fontWeight = FontWeight.Bold)
            Text("★ 4,9 · Người bán uy tín")
            TextButton(onClick = { reporting = true }) { Text("Báo cáo tin đăng") }
            TextButton(onClick = { blocking = true }) { Text("Chặn người bán") }
            chatError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            reportMessage?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            Spacer(Modifier.weight(1f))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(onClick = { vm.openChat(shown.id) }, Modifier.weight(1f)) { Text("Chat với người bán") }
                Button(onClick = onBuy, Modifier.weight(1f)) { Text("Mua ngay") }
            }
        }
    }
    if (reporting) AlertDialog(onDismissRequest = { reporting = false }, title = { Text("Báo cáo tin đăng") }, text = { Text("Bạn xác nhận tin này có dấu hiệu lừa đảo hoặc vi phạm quy định?") }, confirmButton = { TextButton(onClick = { vm.reportProduct(shown.id, "OTHER", null); reporting = false }) { Text("Gửi báo cáo") } }, dismissButton = { TextButton(onClick = { reporting = false }) { Text("Hủy") } })
    if (blocking) AlertDialog(onDismissRequest = { blocking = false }, title = { Text("Chặn người bán?") }, text = { Text("Bạn sẽ không nhận thêm liên hệ từ người bán này.") }, confirmButton = { TextButton(onClick = { vm.blockSeller(shown.sellerId); blocking = false }) { Text("Chặn") } }, dismissButton = { TextButton(onClick = { blocking = false }) { Text("Hủy") } })
}
