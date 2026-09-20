package com.tattantat.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tattantat.app.ui.components.Top
import com.tattantat.app.ui.theme.Bg

@Composable 
fun Categories() {
    Column(
        Modifier
            .fillMaxSize()
            .background(Bg)
    ) {
        Top("Danh mục")
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(
                listOf(
                    "📱 Điện thoại & Máy tính",
                    "💻 Điện tử & Điện gia dụng",
                    "👕 Thời trang & Làm đẹp",
                    "🚗 Xe cộ",
                    "🏠 Nhà đất - Bất động sản",
                    "🔧 Dịch vụ",
                    "🛋️ Đồ dùng gia đình",
                    "🎮 Thể thao - Giải trí"
                )
            ) { x ->
                Card(
                    Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Row(Modifier.padding(16.dp)) {
                        Text(x, Modifier.weight(1f))
                        Icon(Icons.Default.ChevronRight, null)
                    }
                }
            }
        }
    }
}
