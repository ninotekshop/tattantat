package com.tattantat.app.presentation.profile

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable fun ProfileScreen() { Column(Modifier.fillMaxSize().padding(16.dp)) { Text("Người dùng Demo", style = MaterialTheme.typography.headlineSmall); Text("★ 0,0 · Tài khoản mới"); Spacer(Modifier.height(20.dp)); listOf("Tin đăng của tôi", "Sản phẩm yêu thích", "Đơn hàng", "Thông báo", "Đánh giá", "Cài đặt").forEach { ListItem(headlineContent = { Text(it) }); HorizontalDivider() } } }
