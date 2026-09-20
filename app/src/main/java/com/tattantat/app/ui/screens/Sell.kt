package com.tattantat.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tattantat.app.ui.components.Field
import com.tattantat.app.ui.components.Top
import com.tattantat.app.ui.theme.Bg
import com.tattantat.app.ui.theme.Green

@Composable 
fun Sell() {
    Column(
        Modifier
            .fillMaxSize()
            .background(Bg)
    ) {
        Top("Đăng bán")
        Column(
            Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                Modifier
                    .fillMaxWidth()
                    .height(150.dp),
                shape = RoundedCornerShape(18.dp)
            ) {
                Column(
                    Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(Icons.Default.AddAPhoto, null, tint = Green)
                    Text("Thêm ảnh sản phẩm", fontWeight = FontWeight.Bold)
                    Text("Tối đa 12 ảnh", fontSize = 12.sp, color = Color.Gray)
                }
            }
            Field("Tiêu đề sản phẩm")
            Field("Giá bán")
            Field("Danh mục")
            Field("Mô tả chi tiết")
            Button(
                onClick = {},
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text("Đăng bán")
            }
        }
    }
}
