package com.tattantat.app.presentation.sell

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowForwardIos
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.tattantat.app.presentation.home.ProductCard
import java.text.NumberFormat
import java.util.Locale

fun formatPriceVndInput(rawDigits: String): String {
    val digits = rawDigits.filter { it.isDigit() }
    if (digits.isBlank()) return ""
    val amount = digits.toLongOrNull() ?: return digits
    return String.format(Locale("vi", "VN"), "%,d", amount).replace(",", ".")
}

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
                        value = formatPriceVndInput(form.price),
                        update = { input -> vm.update { f -> f.copy(price = input.filter(Char::isDigit)) } },
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
                            Text("${formatPriceVndInput(form.price)} đ", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.headlineSmall)
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyListingsScreen(
    onPromote: (String) -> Unit = {},
    onAdvertise: (String) -> Unit = {},
    onEdit: (String) -> Unit = {},
    vm: MyListingsViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }
    var searchQuery by remember { mutableStateOf("") }
    var isMultiSelectMode by remember { mutableStateOf(false) }
    var selectedIds by remember { mutableStateOf(setOf<String>()) }
    var showDeleteConfirmDialog by remember { mutableStateOf(false) }
    var singleDeleteId by remember { mutableStateOf<String?>(null) }

    val tabs = listOf(
        "ĐANG HIỂN THỊ (${state.items.count { it.status == "ACTIVE" }})",
        "HẾT HẠN (0)",
        "BỊ TỪ CHỐI (0)",
        "CẦN THANH TOÁN (0)",
        "TIN NHÁP (0)",
        "CHỜ DUYỆT (0)",
        "ĐÃ ẨN (${state.items.count { it.status == "HIDDEN" }})"
    )

    val filteredItems = remember(state.items, selectedTab, searchQuery) {
        val listByTab = when (selectedTab) {
            0 -> state.items.filter { it.status == "ACTIVE" }
            6 -> state.items.filter { it.status == "HIDDEN" }
            else -> emptyList()
        }
        if (searchQuery.isBlank()) listByTab
        else listByTab.filter { it.title.contains(searchQuery, ignoreCase = true) }
    }

    Scaffold(
        topBar = {
            Surface(
                color = Color(0xFFFFC107),
                shadowElevation = 4.dp
            ) {
                Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Quản lý tin đăng", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Color.Black)
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Icon(Icons.Default.Search, contentDescription = "Tìm kiếm", tint = Color.Black, modifier = Modifier.size(24.dp))
                            BadgedBox(badge = { Badge { Text("6") } }) {
                                Icon(Icons.Default.Notifications, contentDescription = "Thông báo", tint = Color.Black, modifier = Modifier.size(24.dp))
                            }
                            BadgedBox(badge = { Badge { Text("2") } }) {
                                Icon(Icons.AutoMirrored.Filled.Chat, contentDescription = "Tin nhắn", tint = Color.Black, modifier = Modifier.size(24.dp))
                            }
                        }
                    }

                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(top = 10.dp)
                    ) {
                        item {
                            SuggestionChip(
                                onClick = {},
                                label = { Text("🏷️ Ưu Đãi", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                                shape = RoundedCornerShape(16.dp),
                                colors = SuggestionChipDefaults.suggestionChipColors(containerColor = Color.White)
                            )
                        }
                        item {
                            SuggestionChip(
                                onClick = {},
                                label = { Text("PRO Gói PRO", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                                shape = RoundedCornerShape(16.dp),
                                colors = SuggestionChipDefaults.suggestionChipColors(containerColor = Color.Black, labelColor = Color.White)
                            )
                        }
                        item {
                            SuggestionChip(
                                onClick = {},
                                label = { Text("👥 Danh sách liên hệ", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                                shape = RoundedCornerShape(16.dp),
                                colors = SuggestionChipDefaults.suggestionChipColors(containerColor = Color.White)
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 14.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier.size(44.dp).clip(CircleShape).background(Color.Black),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("N", color = Color(0xFFFFC107), fontWeight = FontWeight.Bold, fontSize = 20.sp)
                            }
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text("Ninotek", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                                Text("+ Tạo cửa hàng", color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("🪙 0", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Spacer(Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier.size(20.dp).clip(CircleShape).background(Color(0xFF2E7D32)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                }
                            }
                        }
                    }
                }
            }

            item {
                ScrollableTabRow(
                    selectedTabIndex = selectedTab,
                    edgePadding = 0.dp,
                    indicator = { tabPositions ->
                        TabRowDefaults.SecondaryIndicator(
                            Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                            color = Color(0xFFFFC107)
                        )
                    }
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            text = {
                                Text(
                                    title,
                                    fontSize = 11.sp,
                                    fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
                                    color = if (selectedTab == index) Color.Black else Color.Gray
                                )
                            }
                        )
                    }
                }
            }

            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Tìm tin đăng của bạn…", fontSize = 13.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp).fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier.size(40.dp).clip(CircleShape).background(Color(0xFF2E7D32)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Speed, contentDescription = null, tint = Color.White)
                        }
                        Spacer(Modifier.width(10.dp))
                        Column(Modifier.weight(1f)) {
                            Text("Tối ưu hoá tin đăng", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                            Text("Giúp tin đăng của bạn hiệu quả hơn mỗi ngày", fontSize = 11.sp, color = Color.Gray)
                        }
                        OutlinedButton(onClick = {}) {
                            Text("Xem thêm", fontSize = 12.sp)
                        }
                    }
                }
            }

            if (filteredItems.isNotEmpty()) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedButton(onClick = { isMultiSelectMode = !isMultiSelectMode }) {
                            Text(if (isMultiSelectMode) "Thoát chọn nhiều" else "Chọn nhiều để xóa")
                        }
                        if (isMultiSelectMode) {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                TextButton(onClick = {
                                    selectedIds = if (selectedIds.size == filteredItems.size) emptySet() else filteredItems.map { it.id }.toSet()
                                }) {
                                    Text(if (selectedIds.size == filteredItems.size) "Bỏ chọn" else "Chọn tất cả")
                                }
                                if (selectedIds.isNotEmpty()) {
                                    Button(
                                        onClick = { showDeleteConfirmDialog = true },
                                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                                    ) {
                                        Text("Xóa (${selectedIds.size})")
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (state.loading) {
                item {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            } else if (filteredItems.isEmpty()) {
                item {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        Text("Không có tin đăng nào trong danh mục này.", color = Color.Gray)
                    }
                }
            } else {
                items(filteredItems, key = { it.id }) { item ->
                    var showCardMenu by remember { mutableStateOf(false) }

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row {
                                if (isMultiSelectMode) {
                                    Checkbox(
                                        checked = item.id in selectedIds,
                                        onCheckedChange = { checked ->
                                            selectedIds = if (checked) selectedIds + item.id else selectedIds - item.id
                                        }
                                    )
                                    Spacer(Modifier.width(6.dp))
                                }

                                AsyncImage(
                                    model = item.imageUrl,
                                    contentDescription = item.title,
                                    modifier = Modifier.size(90.dp).clip(RoundedCornerShape(8.dp)),
                                    contentScale = ContentScale.Crop
                                )

                                Spacer(Modifier.width(10.dp))

                                Column(Modifier.weight(1f)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.Top
                                    ) {
                                        Text(
                                            item.title,
                                            fontWeight = FontWeight.Bold,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis,
                                            style = MaterialTheme.typography.bodyMedium,
                                            modifier = Modifier.weight(1f)
                                        )

                                        Box {
                                            IconButton(
                                                onClick = { showCardMenu = true },
                                                modifier = Modifier.size(24.dp)
                                            ) {
                                                Icon(Icons.Default.MoreVert, contentDescription = "Tùy chọn")
                                            }
                                            DropdownMenu(
                                                expanded = showCardMenu,
                                                onDismissRequest = { showCardMenu = false }
                                            ) {
                                                DropdownMenuItem(
                                                    text = { Text("Chia sẻ tin đăng") },
                                                    onClick = {
                                                        showCardMenu = false
                                                    }
                                                )
                                                DropdownMenuItem(
                                                    text = { Text("Xóa tin đăng", color = MaterialTheme.colorScheme.error) },
                                                    onClick = {
                                                        showCardMenu = false
                                                        singleDeleteId = item.id
                                                    }
                                                )
                                            }
                                        }
                                    }

                                    Text(
                                        item.price,
                                        color = Color(0xFFD32F2F),
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.titleMedium,
                                        modifier = Modifier.padding(top = 2.dp)
                                    )

                                    Text("Ngày đăng: ${item.postedAt}", fontSize = 11.sp, color = Color.Gray)
                                    Text("Ngày hết hạn: ${item.expiresAt}", fontSize = 11.sp, color = Color.Gray)

                                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 2.dp)) {
                                        Text("Hạng tin đăng ", fontSize = 11.sp, color = Color.Gray)
                                        Surface(
                                            color = Color(0xFFE8F5E9),
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(item.rank, color = Color(0xFF2E7D32), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                                        }
                                    }
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp).fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceAround,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("Lượt xem", fontSize = 11.sp, color = Color.Gray)
                                        Text("${item.viewsCount}", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    }

                                    Icon(Icons.Default.ArrowForwardIos, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color.Gray)

                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("Khách", fontSize = 11.sp, color = Color.Gray)
                                        Text("${item.leadsCount}", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    }
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(item.pagePosition, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color.Gray)
                            }

                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color(0xFFE3F2FD),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp).fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(Modifier.weight(1f)) {
                                        Text("Chia sẻ tin qua các nền tảng khác", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                        Text("Tăng tiếp cận với chia sẻ chỉ một chạm", fontSize = 10.sp, color = Color.Gray)
                                    }
                                    Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                TextButton(onClick = { onEdit(item.id) }) {
                                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                                    Spacer(Modifier.width(2.dp))
                                    Text("Chỉnh sửa", fontSize = 11.sp, maxLines = 1, softWrap = false)
                                }

                                TextButton(onClick = {}) {
                                    Text("Xem khách (Mới)", fontSize = 11.sp, maxLines = 1, softWrap = false)
                                }

                                Button(
                                    onClick = { onPromote(item.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                                    shape = RoundedCornerShape(20.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text("⚡ Bán nhanh hơn", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showDeleteConfirmDialog || singleDeleteId != null) {
        AlertDialog(
            onDismissRequest = {
                showDeleteConfirmDialog = false
                singleDeleteId = null
            },
            title = { Text("Xác nhận xóa tin đăng") },
            text = {
                val count = if (singleDeleteId != null) 1 else selectedIds.size
                Text("Bạn có chắc chắn muốn xóa $count tin đăng đã chọn?")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val idsToDelete = if (singleDeleteId != null) listOf(singleDeleteId!!) else selectedIds.toList()
                        vm.deleteListings(idsToDelete)
                        selectedIds = emptySet()
                        showDeleteConfirmDialog = false
                        singleDeleteId = null
                    }
                ) {
                    Text("Xóa tin", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showDeleteConfirmDialog = false
                        singleDeleteId = null
                    }
                ) {
                    Text("Hủy")
                }
            }
        )
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
