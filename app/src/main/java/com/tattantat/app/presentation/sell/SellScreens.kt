package com.tattantat.app.presentation.sell

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.tattantat.app.domain.product.Product
import com.tattantat.app.presentation.home.ProductCard

@Composable
fun SellScreen(onMyListings: () -> Unit, vm: SellViewModel = hiltViewModel()) {
    val form by vm.form.collectAsState()
    var currentStep by remember { mutableIntStateOf(1) } // 1 to 7
    var showDeleteDraftDialog by remember { mutableStateOf(false) }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) {
        vm.addImages(it)
    }

    if (form.published) {
        PublishSuccess(onMyListings)
        return
    }

    Scaffold(
        topBar = {
            Surface(shadowElevation = 4.dp) {
                Column(Modifier.fillMaxWidth().padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Đăng bán tin mới", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        TextButton(onClick = { showDeleteDraftDialog = true }) {
                            Text("🗑️ Xóa bản nháp", color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                        }
                    }
                    LinearProgressIndicator(
                        progress = { currentStep / 7f },
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                    )
                    Text(
                        text = "Bước $currentStep/7: ${getStepTitle(currentStep)}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        },
        bottomBar = {
            Surface(shadowElevation = 8.dp) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    if (currentStep > 1) {
                        OutlinedButton(
                            onClick = { currentStep -= 1 },
                            modifier = Modifier.weight(1f).height(48.dp)
                        ) {
                            Text("Quay lại")
                        }
                        Spacer(Modifier.width(12.dp))
                    }

                    if (currentStep < 7) {
                        Button(
                            onClick = { currentStep += 1 },
                            enabled = isStepValid(currentStep, form),
                            modifier = Modifier.weight(1f).height(48.dp)
                        ) {
                            Text("Tiếp theo")
                        }
                    } else {
                        Button(
                            onClick = vm::publish,
                            enabled = !form.loading && form.title.isNotBlank() && form.price.isNotBlank(),
                            modifier = Modifier.weight(1f).height(48.dp)
                        ) {
                            Text(if (form.loading) "Đang đăng…" else "Hoàn tất & Đăng tin")
                        }
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            when (currentStep) {
                1 -> { // Step 1: Parent Category
                    Text("Chọn danh mục chính", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    form.categories.forEach { category ->
                        OutlinedButton(
                            onClick = {
                                vm.selectCategory(category)
                                currentStep = 2
                            },
                            modifier = Modifier.fillMaxWidth().height(52.dp)
                        ) {
                            Text(category.name, fontWeight = FontWeight.Medium)
                        }
                    }
                }
                2 -> { // Step 2: Subcategory
                    Text("Danh mục đã chọn: ${form.category.ifBlank { "Tất cả" }}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text("Chấp nhận danh mục này để tiếp tục nhập thông tin sản phẩm.", style = MaterialTheme.typography.bodyMedium)
                }
                3 -> { // Step 3: Details (Title, Condition, Description)
                    Text("Thông tin chi tiết", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Field(form.title, { vm.update { f -> f.copy(title = it) } }, "Tên sản phẩm *")

                    Text("Tình trạng sản phẩm", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(
                            "NEW" to "Mới 100%",
                            "LIKE_NEW" to "Như mới (99%)",
                            "USED_GOOD" to "Đã sử dụng (Còn tốt)",
                            "USED_FAIR" to "Đã sử dụng (Khá)"
                        ).forEach { (code, label) ->
                            FilterChip(
                                selected = form.condition == label || form.condition == code,
                                onClick = { vm.selectCondition(code, label) },
                                label = { Text(label, fontSize = 12.sp) }
                            )
                        }
                    }

                    OutlinedTextField(
                        value = form.description,
                        onValueChange = { vm.update { f -> f.copy(description = it) } },
                        modifier = Modifier.fillMaxWidth().height(120.dp),
                        label = { Text("Mô tả chi tiết sản phẩm") }
                    )
                }
                4 -> { // Step 4: Images & Videos
                    Text("Hình ảnh & Video sản phẩm", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    OutlinedButton(
                        onClick = { picker.launch("image/*") },
                        modifier = Modifier.fillMaxWidth().height(50.dp)
                    ) {
                        Text("+ Tải lên ảnh / video sản phẩm (${form.images.size}/10)")
                    }

                    if (form.images.isNotEmpty()) {
                        Text("Ảnh đã chọn (${form.images.size}):", style = MaterialTheme.typography.bodySmall)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(form.images, key = { it.toString() }) { uri ->
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    AsyncImage(
                                        model = uri,
                                        contentDescription = "Ảnh",
                                        modifier = Modifier.size(90.dp).clip(RoundedCornerShape(8.dp)),
                                        contentScale = ContentScale.Crop
                                    )
                                    TextButton(onClick = { vm.removeImage(uri) }) {
                                        Text("Xóa", fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }
                5 -> { // Step 5: Price & Location
                    Text("Giá bán & Vị trí", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Field(
                        value = form.price,
                        update = { vm.update { f -> f.copy(price = it.filter(Char::isDigit)) } },
                        label = "Giá bán (VNĐ) *",
                        type = KeyboardType.Number
                    )
                    OutlinedTextField(
                        value = "Quy Nhơn, Bình Định",
                        onValueChange = {},
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Khu vực / Địa chỉ giao dịch") },
                        enabled = false
                    )
                }
                6 -> { // Step 6: Contact Info
                    Text("Thông tin người bán & liên hệ", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    OutlinedTextField(
                        value = "Người dùng Demo",
                        onValueChange = {},
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Tên người đăng") },
                        enabled = false
                    )
                    OutlinedTextField(
                        value = "0912345678",
                        onValueChange = {},
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Số điện thoại liên hệ") },
                        enabled = false
                    )
                }
                7 -> { // Step 7: Preview & Complete
                    Text("Xác nhận & Xem trước tin đăng", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(form.title.ifBlank { "Tên sản phẩm" }, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                            Text("${form.price} đ", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.headlineSmall)
                            Text("Danh mục: ${form.category}", style = MaterialTheme.typography.bodyMedium)
                            Text("Tình trạng: ${form.condition}", style = MaterialTheme.typography.bodyMedium)
                            Text("Mô tả: ${form.description.ifBlank { "Chưa có mô tả" }}", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }

            form.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        }
    }

    if (showDeleteDraftDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDraftDialog = false },
            title = { Text("Xóa bản nháp?") },
            text = { Text("Bạn có chắc chắn muốn xóa toàn bộ thông tin nháp đã nhập?") },
            confirmButton = {
                TextButton(onClick = {
                    vm.update { f ->
                        f.copy(
                            title = "",
                            price = "",
                            description = "",
                            images = emptyList(),
                            category = "",
                            categoryId = null
                        )
                    }
                    currentStep = 1
                    showDeleteDraftDialog = false
                }) {
                    Text("Xóa bản nháp", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDraftDialog = false }) {
                    Text("Hủy")
                }
            }
        )
    }
}

private fun getStepTitle(step: Int): String = when (step) {
    1 -> "Chọn Danh mục chính"
    2 -> "Xác nhận Danh mục con"
    3 -> "Thông tin chi tiết"
    4 -> "Hình ảnh & Video"
    5 -> "Giá bán & Vị trí"
    6 -> "Thông tin liên hệ"
    7 -> "Xem trước & Hoàn tất"
    else -> ""
}

private fun isStepValid(step: Int, form: SellForm): Boolean = when (step) {
    1, 2 -> form.categoryId != null || form.category.isNotBlank()
    3 -> form.title.isNotBlank()
    5 -> form.price.isNotBlank()
    else -> true
}

@Composable
private fun PublishSuccess(onMyListings: () -> Unit) = Column(
    modifier = Modifier.fillMaxSize().padding(24.dp),
    verticalArrangement = Arrangement.Center,
    horizontalAlignment = Alignment.CenterHorizontally
) {
    Text("Đăng bán thành công! 🎉", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
    Text("Tin của bạn đã được duyệt và đăng công khai.", modifier = Modifier.padding(vertical = 12.dp))
    Button(onClick = onMyListings, modifier = Modifier.fillMaxWidth()) {
        Text("Xem tin đăng của tôi")
    }
}

@Composable
fun MyListingsScreen(
    onPromote: (String) -> Unit = {},
    onAdvertise: (String) -> Unit = {},
    onEdit: (String) -> Unit = {},
    vm: MyListingsViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Quản lý tin đăng của tôi", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                TextButton(onClick = vm::refresh, enabled = !state.loading) {
                    Text("Làm mới")
                }
            }
        }

        when {
            state.loading -> {
                item {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            }
            state.error != null -> {
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(state.error!!, color = MaterialTheme.colorScheme.error)
                        Button(onClick = vm::refresh) { Text("Thử lại") }
                    }
                }
            }
            state.items.isEmpty() -> {
                item {
                    Text("Bạn chưa có tin đăng nào. Hãy tạo tin đầu tiên từ mục Đăng bán.")
                }
            }
            else -> {
                items(state.items, key = { it.id }) { item ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            ProductCard(item)
                            val statusText = when (item.status) {
                                "HIDDEN" -> "Đang ẩn – người mua không thể thấy tin này"
                                "RESERVED" -> "Đã có người đặt – đang xử lý đơn hàng"
                                "SOLD" -> "Đã bán"
                                else -> "Đang hiển thị công khai"
                            }
                            Text(
                                statusText,
                                style = MaterialTheme.typography.bodySmall,
                                color = if (item.status == "ACTIVE") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                fontWeight = FontWeight.Bold
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                TextButton(onClick = { onEdit(item.id) }) {
                                    Text("Chỉnh sửa", fontSize = 12.sp, maxLines = 1, softWrap = false)
                                }
                                TextButton(onClick = { onPromote(item.id) }, enabled = item.status == "ACTIVE") {
                                    Text("Đẩy tin", fontSize = 12.sp, maxLines = 1, softWrap = false)
                                }
                                TextButton(onClick = { onAdvertise(item.id) }, enabled = item.status == "ACTIVE") {
                                    Text("Quảng cáo", fontSize = 12.sp, maxLines = 1, softWrap = false)
                                }
                                TextButton(
                                    onClick = { vm.setVisibility(item.id, if (item.status == "HIDDEN") "ACTIVE" else "HIDDEN") }
                                ) {
                                    Text(
                                        text = if (item.status == "HIDDEN") "Hiện tin" else "Ẩn tin",
                                        fontSize = 12.sp,
                                        maxLines = 1,
                                        softWrap = false
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Field(
    value: String,
    update: (String) -> Unit,
    label: String,
    type: KeyboardType = KeyboardType.Text
) = OutlinedTextField(
    value = value,
    onValueChange = update,
    modifier = Modifier.fillMaxWidth(),
    label = { Text(label) },
    singleLine = true,
    keyboardOptions = KeyboardOptions(keyboardType = type)
)
