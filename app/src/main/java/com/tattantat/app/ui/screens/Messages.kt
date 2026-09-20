package com.tattantat.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
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
fun Messages() {
    Column(
        Modifier
            .fillMaxSize()
            .background(Bg)
    ) {
        Top("Tin nhắn")
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(
                listOf("Nguyễn Văn Minh", "Trần Thị Hoa", "Lê Quốc Bảo", "Phạm Thị Lan", "Hoàng Văn Nam")
            ) { n ->
                Card(
                    Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Row(Modifier.padding(14.dp)) {
                        Text("👤", fontSize = 30.sp)
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(n, fontWeight = FontWeight.Bold)
                            Text("Sản phẩm này còn không shop?", fontSize = 12.sp, color = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}
