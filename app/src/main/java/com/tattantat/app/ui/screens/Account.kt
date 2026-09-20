package com.tattantat.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tattantat.app.ui.components.Top
import com.tattantat.app.ui.theme.Bg

@Composable 
fun Account() {
    Column(
        Modifier
            .fillMaxSize()
            .background(Bg)
    ) {
        Top("Tài khoản")
        Column(
            Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Card(shape = RoundedCornerShape(18.dp)) {
                Row(Modifier.padding(18.dp)) {
                    Text("👤", fontSize = 42.sp)
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Nguyễn Văn Minh", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                        Text("@nguyenminh", fontSize = 12.sp, color = Color.Gray)
                    }
                }
            }
            listOf(
                "Đơn hàng của tôi",
                "Tin đã đăng",
                "Sản phẩm yêu thích",
                "Cài đặt tài khoản",
                "Hỗ trợ khách hàng"
            ).forEach { t ->
                Card(
                    Modifier
                        .fillMaxWidth()
                        .clickable {},
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Row(Modifier.padding(16.dp)) {
                        Text(t, Modifier.weight(1f))
                        Icon(Icons.Default.ChevronRight, null)
                    }
                }
            }
        }
    }
}
