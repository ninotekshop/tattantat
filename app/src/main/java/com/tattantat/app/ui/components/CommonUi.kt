package com.tattantat.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.NotificationsNone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tattantat.app.ui.theme.Dark
import com.tattantat.app.ui.theme.Green

@Composable 
fun Header() {
    Column(
        Modifier
            .background(Color.White)
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(42.dp)
                    .background(Green, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text("T", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text("Tất Tần Tật", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Dark)
                Text("Mua bán mọi thứ, gần bạn", fontSize = 11.sp, color = Color.Gray)
            }
            Icon(Icons.Default.NotificationsNone, null)
        }
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(
            value = "",
            onValueChange = {},
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Bạn đang tìm gì?") },
            leadingIcon = { Icon(Icons.Default.Search, null) },
            shape = RoundedCornerShape(14.dp),
            singleLine = true
        )
    }
}

@Composable 
fun Top(title: String) {
    Row(
        Modifier
            .fillMaxWidth()
            .background(Color.White)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Default.ArrowBack, null)
        Spacer(Modifier.width(12.dp))
        Text(title, fontSize = 20.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable 
fun Field(s: String) {
    OutlinedTextField(
        value = "",
        onValueChange = {},
        modifier = Modifier.fillMaxWidth(),
        placeholder = { Text(s) },
        shape = RoundedCornerShape(14.dp)
    )
}
