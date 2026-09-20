package com.tattantat.app.presentation.notification

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun NotificationsScreen(vm: NotificationsViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Thông báo", style = MaterialTheme.typography.headlineSmall)
        TextButton(onClick = vm::readAll, enabled = state.items.any { !it.is_read }) { Text("Đánh dấu tất cả đã đọc") }
        if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        LazyColumn {
            items(state.items, key = { it.id }) { item ->
                ListItem(
                    headlineContent = { Text(item.title, color = if (item.is_read) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.primary) },
                    supportingContent = { Text(item.content) },
                    trailingContent = { Text(item.created_at.take(10)) },
                    modifier = Modifier.fillMaxWidth(),
                )
                if (!item.is_read) TextButton(onClick = { vm.read(item) }) { Text("Đánh dấu đã đọc") }
            }
            if (!state.loading && state.items.isEmpty()) item { Text("Chưa có thông báo.") }
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    }
}
