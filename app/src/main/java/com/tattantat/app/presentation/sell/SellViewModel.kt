package com.tattantat.app.presentation.sell

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.repository.RemoteProductRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject
import android.net.Uri
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import com.tattantat.app.data.remote.product.CategoryPayload

data class SellForm(val title: String = "", val price: String = "", val categoryId: Long? = null, val category: String = "Đang tải", val categories: List<CategoryPayload> = emptyList(), val condition: String = "Đã sử dụng tốt", val conditionCode: String = "USED_GOOD", val description: String = "", val images: List<Uri> = emptyList(), val published: Boolean = false, val error: String? = null, val loading: Boolean = false)
@HiltViewModel class SellViewModel @Inject constructor(private val products: RemoteProductRepository) : ViewModel() {
    private val _form = MutableStateFlow(SellForm()); val form = _form.asStateFlow()
    init { viewModelScope.launch { runCatching { products.categories() }.onSuccess { categories -> val first = categories.firstOrNull(); _form.value = _form.value.copy(categories = categories, categoryId = first?.id, category = first?.name ?: "Chưa có danh mục") }.onFailure { _form.value = _form.value.copy(error = "Không thể tải danh mục") } } }
    fun update(transform: (SellForm) -> SellForm) { _form.value = transform(_form.value) }
    fun addImage(uri: Uri) { if (_form.value.images.size < 10) _form.value = _form.value.copy(images = _form.value.images + uri) }
    fun addImages(uris: List<Uri>) { val existing = _form.value.images; _form.value = _form.value.copy(images = (existing + uris).distinct().take(10)) }
    fun removeImage(uri: Uri) { _form.value = _form.value.copy(images = _form.value.images - uri) }
    fun selectCategory(category: CategoryPayload) { _form.value = _form.value.copy(categoryId = category.id, category = category.name) }
    fun selectCondition(code: String, label: String) { _form.value = _form.value.copy(conditionCode = code, condition = label) }
    fun publish() { val form = _form.value; val categoryId = form.categoryId ?: run { _form.value = form.copy(error = "Hãy chọn danh mục"); return }; viewModelScope.launch { _form.value = form.copy(loading = true, error = null); products.create(form.title, form.price.toLong(), form.description, form.images, categoryId, form.conditionCode).onSuccess { _form.value = form.copy(published = true) }.onFailure { _form.value = form.copy(error = it.message ?: "Không thể đăng tin") } } }
}
