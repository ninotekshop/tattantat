package com.tattantat.app.presentation.chat

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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

@Composable
fun ChatListScreen(onOpen: (String) -> Unit, vm: ChatListViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Cuộc trò chuyện", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            TextButton(onClick = vm::refresh) { Text("Làm mới") }
        }
        if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            items(state.chats, key = { it.id }) { chat ->
                Surface(
                    onClick = { onOpen(chat.id) },
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // User Avatar
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = chat.other_name.take(1).uppercase(),
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(chat.other_name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
                            Text(
                                text = chat.last_message_at?.take(16) ?: "Nhấn để trao đổi ngay",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
            if (!state.loading && state.chats.isEmpty()) {
                item {
                    Box(Modifier.fillMaxWidth().padding(top = 48.dp), contentAlignment = Alignment.Center) {
                        Text("Chưa có cuộc trò chuyện nào.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatDetailScreen(
    chatId: String,
    onBack: () -> Unit = {},
    onProductClick: (String) -> Unit = {},
    vm: ChatDetailViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var text by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val context = LocalContext.current
    var viewingImageModalUrl by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(chatId) { vm.load(chatId) }
    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) {
            listState.animateScrollToItem(state.messages.size - 1)
        }
    }

    // Media pickers
    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { vm.send(chatId, "[Hình ảnh] $it") }
    }
    val videoPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { vm.send(chatId, "[Video] $it") }
    }

    val otherName = state.chatInfo?.other_name ?: "Người bán"
    var deletingMessageId by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier.size(38.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = otherName.take(1).uppercase(),
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text(otherName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text("Vừa truy cập", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        },
        bottomBar = {
            Surface(shadowElevation = 8.dp) {
                Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp)) {
                    // Quick Reply Chips (Horizontal Paging Row)
                    val quickReplies = listOf(
                        "📞 SĐT của tôi",
                        "Cảm ơn bạn",
                        "Tôi sẽ tham khảo thêm",
                        "Hẹn gặp bạn sau nhé",
                        "Sản phẩm này còn không ạ?",
                        "Cho tôi xin giá tốt nhất nhé"
                    )
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                    ) {
                        items(quickReplies) { chip ->
                            SuggestionChip(
                                onClick = {
                                    if (chip.startsWith("📞")) {
                                        vm.send(chatId, "📞 SĐT của tôi: 0912345678")
                                    } else {
                                        vm.send(chatId, chip)
                                    }
                                },
                                label = { Text(chip, fontSize = 12.sp) },
                                shape = RoundedCornerShape(16.dp)
                            )
                        }
                    }

                    // Input Bar with Media Actions
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = { imagePicker.launch("image/*") }) {
                            Icon(Icons.Default.Image, "Gửi ảnh", tint = MaterialTheme.colorScheme.primary)
                        }
                        IconButton(onClick = { videoPicker.launch("video/*") }) {
                            Icon(Icons.Default.Videocam, "Gửi video", tint = MaterialTheme.colorScheme.primary)
                        }
                        IconButton(onClick = {
                            vm.send(chatId, "📍 Vị trí GPS: Quy Nhơn, Bình Định (13.782, 109.219)")
                        }) {
                            Icon(Icons.Default.LocationOn, "Gửi GPS", tint = MaterialTheme.colorScheme.primary)
                        }

                        OutlinedTextField(
                            value = text,
                            onValueChange = { text = it },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text("Nhập tin nhắn…", fontSize = 14.sp) },
                            singleLine = true,
                            enabled = !state.sending,
                            shape = RoundedCornerShape(24.dp)
                        )

                        IconButton(
                            onClick = {
                                if (text.isNotBlank()) {
                                    vm.send(chatId, text)
                                    text = ""
                                }
                            },
                            enabled = text.isNotBlank() && !state.sending
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.Send,
                                contentDescription = "Gửi",
                                tint = if (text.isNotBlank()) MaterialTheme.colorScheme.primary else Color.Gray
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding)
        ) {
            // Attached Product Banner
            val product = state.attachedProduct
            if (product != null) {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f),
                    modifier = Modifier.fillMaxWidth().clickable { onProductClick(product.id) }
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AsyncImage(
                            model = product.imageUrl,
                            contentDescription = product.title,
                            modifier = Modifier.size(48.dp).clip(RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(Modifier.width(10.dp))
                        Column(Modifier.weight(1f)) {
                            Text("Đang trao đổi về tin đăng này:", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                            Text(product.title, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodyMedium)
                            Text(product.price, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
                        }
                        TextButton(onClick = { onProductClick(product.id) }) {
                            Text("Xem tin")
                        }
                    }
                }
            }

            if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())

            // Message Bubbles List
            LazyColumn(
                state = listState,
                modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(state.messages, key = { it.id }) { message ->
                    val mine = message.sender_id == state.ownUserId
                    val isMedia = message.content.startsWith("[Hình ảnh]") || message.content.startsWith("[Video]")

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        if (!mine) {
                            Box(
                                modifier = Modifier.size(28.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primaryContainer),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = otherName.take(1).uppercase(),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                            Spacer(Modifier.width(6.dp))
                        }

                        Surface(
                            shape = RoundedCornerShape(
                                topStart = 16.dp,
                                topEnd = 16.dp,
                                bottomStart = if (mine) 16.dp else 4.dp,
                                bottomEnd = if (mine) 4.dp else 16.dp
                            ),
                            color = if (isMedia) Color.Transparent else if (mine) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier
                                .widthIn(max = 280.dp)
                                .clickable {
                                    deletingMessageId = message.id
                                }
                        ) {
                            Column(Modifier.padding(if (isMedia) 0.dp else 10.dp)) {
                                val content = message.content
                                when {
                                    content.startsWith("[Hình ảnh]") -> {
                                        val imgUrl = content.removePrefix("[Hình ảnh]").trim()
                                        AsyncImage(
                                            model = imgUrl,
                                            contentDescription = "Hình ảnh gửi",
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(180.dp)
                                                .clip(RoundedCornerShape(8.dp))
                                                .clickable { viewingImageModalUrl = imgUrl },
                                            contentScale = ContentScale.Crop
                                        )
                                    }
                                    content.startsWith("[Video]") -> {
                                        val videoUrl = content.removePrefix("[Video]").trim()
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(160.dp)
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(Color.Black.copy(alpha = 0.8f))
                                                .clickable {
                                                    val intent = Intent(Intent.ACTION_VIEW).apply {
                                                        setDataAndType(Uri.parse(videoUrl), "video/*")
                                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                                    }
                                                    runCatching { context.startActivity(intent) }.onFailure {
                                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(videoUrl)))
                                                    }
                                                },
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.PlayArrow,
                                                contentDescription = "Phát Video",
                                                tint = Color.White,
                                                modifier = Modifier.size(52.dp)
                                            )
                                            Text(
                                                "Xem Video 🎥",
                                                color = Color.White,
                                                style = MaterialTheme.typography.labelMedium,
                                                modifier = Modifier.align(Alignment.BottomCenter).padding(8.dp)
                                            )
                                        }
                                    }
                                    content.startsWith("📍 Vị trí GPS") -> {
                                        val locText = content.removePrefix("📍 Vị trí GPS:").trim()
                                        Column(
                                            modifier = Modifier.padding(4.dp)
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(
                                                    Icons.Default.LocationOn,
                                                    contentDescription = "GPS",
                                                    tint = if (mine) Color.White else MaterialTheme.colorScheme.primary,
                                                    modifier = Modifier.size(24.dp)
                                                )
                                                Spacer(Modifier.width(6.dp))
                                                Text(
                                                    text = "Vị trí GPS",
                                                    color = if (mine) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 14.sp
                                                )
                                            }
                                            Text(
                                                text = locText,
                                                color = if (mine) Color.White.copy(alpha = 0.9f) else MaterialTheme.colorScheme.onSurfaceVariant,
                                                fontSize = 12.sp,
                                                modifier = Modifier.padding(vertical = 4.dp)
                                            )
                                            ElevatedButton(
                                                onClick = {
                                                    val mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + Uri.encode(locText)
                                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(mapsUrl)))
                                                },
                                                modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
                                            ) {
                                                Icon(Icons.Default.Map, contentDescription = null, modifier = Modifier.size(16.dp))
                                                Spacer(Modifier.width(4.dp))
                                                Text("Mở Google Maps", fontSize = 12.sp)
                                            }
                                        }
                                    }
                                    else -> {
                                        Text(
                                            text = content,
                                            color = if (mine) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                            fontSize = 14.sp
                                        )
                                    }
                                }
                                Text(
                                    text = message.created_at.takeLast(5).ifBlank { "Vừa xong" },
                                    fontSize = 10.sp,
                                    color = if (mine) Color.White.copy(alpha = 0.7f) else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                    modifier = Modifier.align(Alignment.End).padding(top = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Message Deletion Dialog
    deletingMessageId?.let { msgId ->
        AlertDialog(
            onDismissRequest = { deletingMessageId = null },
            title = { Text("Tùy chọn tin nhắn") },
            text = { Text("Bạn có muốn thu hồi hoặc xóa tin nhắn này không?") },
            confirmButton = {
                TextButton(onClick = {
                    vm.deleteMessage(chatId, msgId)
                    deletingMessageId = null
                }) {
                    Text("Thu hồi / Xóa", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { deletingMessageId = null }) {
                    Text("Hủy")
                }
            }
        )
    }

    // Modal view for sent images
    viewingImageModalUrl?.let { imgUrl ->
        Dialog(
            onDismissRequest = { viewingImageModalUrl = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(Modifier.fillMaxSize().background(Color.Black)) {
                AsyncImage(
                    model = imgUrl,
                    contentDescription = "Ảnh phóng to",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )
                IconButton(
                    onClick = { viewingImageModalUrl = null },
                    modifier = Modifier.align(Alignment.TopEnd).padding(16.dp).background(Color.Black.copy(alpha = 0.5f), CircleShape)
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Đóng", tint = Color.White)
                }
            }
        }
    }
}
