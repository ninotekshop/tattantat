package com.tattantat.app.presentation.order

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.order.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class CheckoutUiState(val loading: Boolean = false, val quantity:Int = 1, val price: OrderPricePayload? = null, val error: String? = null, val orderCode: String? = null, val pendingOrder: CreatedOrderPayload? = null)
@HiltViewModel class OrderViewModel @Inject constructor(private val api: OrderApi) : ViewModel() {
    private val _state = MutableStateFlow(CheckoutUiState()); val state: StateFlow<CheckoutUiState> = _state.asStateFlow()
    fun loadPreview(productId: String, quantity:Int = _state.value.quantity) = viewModelScope.launch { _state.value = _state.value.copy(loading = true, quantity = quantity, error = null); runCatching { api.preview(productId, quantity) }.onSuccess { r -> _state.value = CheckoutUiState(quantity = quantity, price = r.data, error = if (r.success) null else r.message) }.onFailure { _state.value = CheckoutUiState(quantity = quantity, error = "Không thể lấy giá từ máy chủ. Vui lòng thử lại.") } }
    fun changeQuantity(productId:String,quantity:Int){if(quantity in 1..1000)loadPreview(productId,quantity)}
    fun submitCod(productId: String, quantity:Int) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        val existingOrder = _state.value.pendingOrder
        runCatching {
            // Once the server has reserved the listing, retry only the payment
            // request. Creating another order would be both misleading and fail
            // because the product is now RESERVED.
            val order = existingOrder ?: api.create(UUID.randomUUID().toString(), CreateOrderRequest(productId, quantity)).data
                ?: error("Không thể tạo đơn hàng")
            _state.value = _state.value.copy(pendingOrder = order)
            api.createCodPayment(UUID.randomUUID().toString(), CreatePaymentRequest(order.id)).data
                ?: error("Không thể tạo thanh toán COD")
            order
        }.onSuccess { order ->
            _state.value = CheckoutUiState(quantity = quantity, price = order.price, orderCode = order.orderCode)
        }.onFailure {
            val hasReservedOrder = _state.value.pendingOrder != null
            _state.value = _state.value.copy(
                loading = false,
                error = if (hasReservedOrder) "Đơn hàng đã được giữ. Hãy gửi lại yêu cầu COD để hoàn tất." else "Không thể tạo đơn hàng. Vui lòng thử lại.",
            )
        }
    }
}
