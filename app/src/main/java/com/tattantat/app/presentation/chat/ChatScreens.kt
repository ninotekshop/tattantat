package com.tattantat.app.presentation.chat

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable fun ChatListScreen(onOpen: () -> Unit) { val chats = listOf("Minh Anh · iPhone 14 Pro Max", "Ngọc Hà · Máy ảnh Fujifilm"); LazyColumn(Modifier.fillMaxSize().padding(16.dp)) { item { Text("Tin nhắn", style = MaterialTheme.typography.headlineSmall); Spacer(Modifier.height(12.dp)) }; items(chats) { chat -> ListItem(headlineContent = { Text(chat) }, supportingContent = { Text("Bạn còn sản phẩm không ạ?") }, modifier = Modifier.fillMaxWidth(), trailingContent = { Text("10:24") }); HorizontalDivider(Modifier.padding(vertical = 4.dp)) } } }
@Composable fun ChatDetailScreen() { var text by remember { mutableStateOf("") }; val messages = remember { mutableStateListOf("Chào bạn, sản phẩm còn không?", "Còn bạn nhé, mình có thể gửi thêm ảnh.") }; Column(Modifier.fillMaxSize().padding(16.dp)) { Text("Minh Anh", style = MaterialTheme.typography.titleLarge); LazyColumn(Modifier.weight(1f).padding(vertical = 12.dp)) { items(messages) { Text(it, Modifier.padding(vertical = 8.dp)) } }; Row(verticalAlignment = Alignment.CenterVertically) { OutlinedTextField(text, { text = it }, Modifier.weight(1f), placeholder = { Text("Nhập tin nhắn") }); IconButton({ if(text.isNotBlank()) { messages += text; text = "" } }) { Text("Gửi") } } } }
