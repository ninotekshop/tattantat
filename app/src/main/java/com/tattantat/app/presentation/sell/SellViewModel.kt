package com.tattantat.app.presentation.sell

import androidx.lifecycle.ViewModel
import com.tattantat.app.domain.product.Product
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

data class SellForm(val title: String = "", val price: String = "", val category: String = "Điện thoại", val condition: String = "Đã sử dụng tốt", val description: String = "", val published: Boolean = false)
class SellViewModel : ViewModel() {
    private val _form = MutableStateFlow(SellForm()); val form = _form.asStateFlow()
    fun update(transform: (SellForm) -> SellForm) { _form.value = transform(_form.value) }
    fun publish() { _form.value = _form.value.copy(published = true) }
}
