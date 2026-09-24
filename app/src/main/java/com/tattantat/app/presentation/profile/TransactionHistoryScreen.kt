package com.tattantat.app.presentation.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class TransactionItem(
    val id: String,
    val title: String,
    val amount: String,
    val date: String,
    val status: String,
    val type: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionHistoryScreen(onBack: () -> Unit = {}) {
    var selectedTab by remember { mutableIntStateOf(0) }

    val pushTransactions = listOf(
        TransactionItem("t1", "Mua gói VIP Nổi Bật 24h", "-20.000 đ", "23/09/2026 14:30", "Thành công", "PUSH"),
        TransactionItem("t2", "Gói Đẩy tin Nhanh 3 Lần", "-15.000 đ", "20/09/2026 09:15", "Thành công", "PUSH"),
        TransactionItem("t3", "Gói VIP Tuần 7 Ngày", "-100.000 đ", "10/09/2026 18:00", "Thành công", "PUSH")
    )

    val adsTransactions = listOf(
        TransactionItem("a1", "Quảng cáo Banner Trang Chủ 3D", "-200.000 đ", "22/09/2026 10:00", "Thành công", "ADS"),
        TransactionItem("a2", "Quảng cáo Ưu tiên Tìm kiếm", "-50.000 đ", "15/09/2026 16:45", "Thành công", "ADS")
    )

    val sellTransactions = listOf(
        TransactionItem("s1", "Nhận tiền bán iPhone 15 Pro Max", "+21.500.000 đ", "21/09/2026 11:20", "Đã vào ví", "SELL"),
        TransactionItem("s2", "Rút tiền về ngân hàng MBBank", "-5.000.000 đ", "18/09/2026 15:10", "Hoàn tất", "SELL"),
        TransactionItem("s3", "Nhận tiền bán Xe Honda SH 150i", "+68.000.000 đ", "12/09/2026 08:30", "Đã vào ví", "SELL")
    )

    val currentList = when (selectedTab) {
        0 -> pushTransactions
        1 -> adsTransactions
        else -> sellTransactions
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Lịch sử giao dịch", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding)
        ) {
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Đẩy tin & VIP", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Quảng cáo", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = { Text("Bán sản phẩm", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                )
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(currentList, key = { it.id }) { item ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.padding(14.dp).fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(Modifier.weight(1f)) {
                                Text(item.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
                                Text(item.date, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    item.amount,
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = if (item.amount.startsWith("+")) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                                )
                                Text(item.status, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
                }
            }
        }
    }
}
