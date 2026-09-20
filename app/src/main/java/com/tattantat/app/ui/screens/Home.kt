package com.tattantat.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tattantat.app.models.products
import com.tattantat.app.ui.components.Header
import com.tattantat.app.ui.theme.Dark

@Composable 
fun Home() {
    Column {
        Header()
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Card(
                    colors = CardDefaults.cardColors(Color(0xFFE9F8F0)),
                    shape = RoundedCornerShape(18.dp)
                ) {
                    Row(
                        Modifier.padding(18.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text("Mua bán dễ dàng", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Dark)
                            Text("Kết nối mọi người")
                            Spacer(Modifier.height(10.dp))
                            Button({}) { Text("Khám phá ngay") }
                        }
                        Text("📱\n💻\n📷", fontSize = 30.sp)
                    }
                }
            }
            item { Text("Danh mục", fontSize = 18.sp, fontWeight = FontWeight.Bold) }
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(listOf("📱\nĐiện thoại", "💻\nĐiện tử", "👕\nThời trang", "🚗\nXe cộ", "🏠\nNhà đất", "🔧\nDịch vụ", "🎮\nGiải trí")) { x ->
                        Card(Modifier.width(86.dp), shape = RoundedCornerShape(14.dp)) {
                            Text(x, Modifier.padding(10.dp), fontSize = 11.sp)
                        }
                    }
                }
            }
            item { Text("Sản phẩm nổi bật", fontSize = 18.sp, fontWeight = FontWeight.Bold) }
            items(products) { p ->
                Card(shape = RoundedCornerShape(16.dp)) {
                    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier
                                .size(70.dp)
                                .background(Color(0xFFF1F4F2), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(p.icon, fontSize = 32.sp)
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(p.title, fontWeight = FontWeight.SemiBold)
                            Text(p.price, color = Dark, fontWeight = FontWeight.Bold)
                            Text(p.location, fontSize = 11.sp, color = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}
