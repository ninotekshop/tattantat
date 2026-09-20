package com.tattantat.app.presentation.chat

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun ChatListScreen(onOpen: (String) -> Unit, vm: ChatListViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    LazyColumn(Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Text("Tin nhắn", style = MaterialTheme.typography.headlineSmall)
            TextButton(onClick = vm::refresh) { Text("Làm mới") }
            if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        }
        items(state.chats, key = { it.id }) { chat ->
            ListItem(
                headlineContent = { Text(chat.other_name) },
                supportingContent = { Text(chat.last_message_at?.take(16) ?: "Chưa có tin nhắn") },
                trailingContent = { TextButton(onClick = { onOpen(chat.id) }) { Text("Mở") } },
            )
            HorizontalDivider(Modifier.padding(vertical = 4.dp))
        }
        if (!state.loading && state.chats.isEmpty()) item { Text("Chưa có cuộc trò chuyện nào.", Modifier.padding(top = 24.dp)) }
    }
}

@Composable
fun ChatDetailScreen(chatId: String, vm: ChatDetailViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    var text by remember { mutableStateOf("") }
    LaunchedEffect(chatId) { vm.load(chatId) }
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Cuộc trò chuyện", style = MaterialTheme.typography.titleLarge)
        if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        LazyColumn(Modifier.weight(1f).padding(vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.messages, key = { it.id }) { message ->
                val mine = message.sender_id == state.ownUserId
                Text(
                    message.content,
                    modifier = Modifier.fillMaxWidth().padding(start = if (mine) 48.dp else 0.dp, end = if (mine) 0.dp else 48.dp),
                    color = if (mine) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                )
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(text, { text = it }, Modifier.weight(1f), placeholder = { Text("Nhập tin nhắn") }, enabled = !state.sending)
            TextButton(onClick = { vm.send(chatId, text); text = "" }, enabled = text.isNotBlank() && !state.sending) { Text(if (state.sending) "Đang gửi" else "Gửi") }
        }
    }
}
