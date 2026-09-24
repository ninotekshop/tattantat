package com.tattantat.app.presentation.sell

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.Wallet
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.tattantat.app.data.remote.promotion.PromotionPackagePayload
import java.text.NumberFormat
import java.util.Locale

private fun promotionVnd(v: String) = NumberFormat.getNumberInstance(Locale("vi", "VN")).format(v.toLongOrNull() ?: 0L) + " đ"

@Composable
fun PromotionScreen(
    productId: String,
    onBackToMyListings: () -> Unit = {},
    vm: PromotionViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var currentStep by remember { mutableIntStateOf(1) } // 1: Select, 2: Payment Method, 3: Pay, 4: Success
    var selectedPackage by remember { mutableStateOf<PromotionPackagePayload?>(null) }
    var selectedPaymentMethod by remember { mutableStateOf("WALLET") } // "WALLET" or "VIETQR"

    Scaffold(
        topBar = {
            Surface(shadowElevation = 4.dp) {
                Column(Modifier.fillMaxWidth().padding(16.dp)) {
                    Text("Nâng cấp Đẩy tin / VIP", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    LinearProgressIndicator(
                        progress = { currentStep / 4f },
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                    )
                    Text(
                        text = "Bước $currentStep/4: " + when (currentStep) {
                            1 -> "Chọn gói nâng cấp"
                            2 -> "Chọn hình thức thanh toán"
                            3 -> "Xác nhận & Thanh toán"
                            4 -> "Hoàn tất"
                            else -> ""
                        },
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(bottom = 8.dp)) }

            when (currentStep) {
                1 -> { // Step 1: 2-column grid of promotion packages
                    Text("Danh sách các gói VIP & Đẩy tin:", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 12.dp))
                    if (state.loading) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    } else {
                        val packs = remember(state.packages) {
                            if (state.packages.isNotEmpty()) state.packages else listOf(
                                PromotionPackagePayload("vip_1", "VIP_1", "VIP Nổi bật 24h", "20000", 24, "PUSH"),
                                PromotionPackagePayload("vip_7", "VIP_7", "VIP Tuần 7 Ngày", "100000", 168, "TOP"),
                                PromotionPackagePayload("push_3", "PUSH_3", "Đẩy tin Nhanh 24h", "15000", 24, "PUSH"),
                                PromotionPackagePayload("top_home", "TOP_HOME", "Trang Chủ Banner 3D", "200000", 120, "BANNER")
                            )
                        }

                        LazyVerticalGrid(
                            columns = GridCells.Fixed(2),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(packs, key = { it.id }) { pack ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(180.dp)
                                        .clickable {
                                            selectedPackage = pack
                                            currentStep = 2
                                        },
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)),
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(12.dp).fillMaxSize(),
                                        verticalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column {
                                            Text(pack.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall, maxLines = 2)
                                            Text("${pack.duration_hours} giờ hiệu lực", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                        Column {
                                            Text(promotionVnd(pack.price.toString()), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                                            Button(
                                                onClick = {
                                                    selectedPackage = pack
                                                    currentStep = 2
                                                },
                                                modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                                                contentPadding = PaddingValues(0.dp)
                                            ) {
                                                Text("Chọn gói", fontSize = 12.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                2 -> { // Step 2: Payment Method Selection
                    selectedPackage?.let { pack ->
                        Column(
                            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Column(Modifier.padding(16.dp)) {
                                    Text("Gói đã chọn: ${pack.name}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                                    Text("Giá gói: ${promotionVnd(pack.price.toString())}", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                }
                            }

                            Text("Chọn hình thức thanh toán:", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (selectedPaymentMethod == "WALLET") MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                                modifier = Modifier.fillMaxWidth().clickable { selectedPaymentMethod = "WALLET" }
                            ) {
                                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Wallet, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Spacer(Modifier.width(12.dp))
                                    Column(Modifier.weight(1f)) {
                                        Text("Ví Tất Tần Tật", fontWeight = FontWeight.Bold)
                                        Text("Số dư khả dụng: 500.000 đ", style = MaterialTheme.typography.bodySmall)
                                    }
                                    RadioButton(selected = selectedPaymentMethod == "WALLET", onClick = { selectedPaymentMethod = "WALLET" })
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (selectedPaymentMethod == "VIETQR") MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                                modifier = Modifier.fillMaxWidth().clickable { selectedPaymentMethod = "VIETQR" }
                            ) {
                                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.QrCode, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Spacer(Modifier.width(12.dp))
                                    Column(Modifier.weight(1f)) {
                                        Text("Chuyển khoản VietQR Mã Quét", fontWeight = FontWeight.Bold)
                                        Text("MBBank - Quét QR nhanh tự động", style = MaterialTheme.typography.bodySmall)
                                    }
                                    RadioButton(selected = selectedPaymentMethod == "VIETQR", onClick = { selectedPaymentMethod = "VIETQR" })
                                }
                            }

                            Row(Modifier.fillMaxWidth().padding(top = 16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                OutlinedButton(onClick = { currentStep = 1 }) { Text("Quay lại") }
                                Button(onClick = { currentStep = 3 }) { Text("Tiếp tục thanh toán") }
                            }
                        }
                    }
                }
                3 -> { // Step 3: Payment & Activation
                    selectedPackage?.let { pack ->
                        Column(
                            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Text("Xác nhận & Thanh toán", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                            if (selectedPaymentMethod == "VIETQR") {
                                Text("Quét mã QR qua ứng dụng Ngân hàng của bạn:", style = MaterialTheme.typography.bodyMedium)
                                val qrUrl = "https://img.vietqr.io/image/MB-999999999-compact.png?amount=${pack.price}&addInfo=VIP_${productId}"
                                AsyncImage(
                                    model = qrUrl,
                                    contentDescription = "VietQR Code",
                                    modifier = Modifier.size(220.dp).clip(RoundedCornerShape(12.dp)).border(2.dp, MaterialTheme.colorScheme.primary, RoundedCornerShape(12.dp)),
                                    contentScale = ContentScale.Fit
                                )
                                Text("Ngân hàng: MBBank · STK: 999999999", fontWeight = FontWeight.Bold)
                                Text("Nội dung CK: VIP_${productId}", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                            } else {
                                Card(modifier = Modifier.fillMaxWidth()) {
                                    Column(Modifier.padding(16.dp)) {
                                        Text("Xác nhận trừ ${promotionVnd(pack.price.toString())} từ Số dư Ví Tất Tần Tật.", textAlign = TextAlign.Center)
                                    }
                                }
                            }

                            Button(
                                onClick = {
                                    vm.purchase(productId, pack.id)
                                    currentStep = 4
                                },
                                modifier = Modifier.fillMaxWidth().height(48.dp)
                            ) {
                                Text("Xác nhận đã thanh toán & Kích hoạt gói")
                            }
                        }
                    }
                }
                4 -> { // Step 4: Complete
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(64.dp))
                        Text("Kích hoạt gói VIP / Đẩy tin thành công! 🎉", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 12.dp))
                        Text("Tin đăng của bạn đã được ưu tiên hiển thị.", modifier = Modifier.padding(vertical = 12.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Button(
                            onClick = onBackToMyListings,
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Text("Quay về Quản lý tin đăng")
                        }
                    }
                }
            }
        }
    }
}
