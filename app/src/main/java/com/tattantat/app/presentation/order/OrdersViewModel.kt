package com.tattantat.app.presentation.order

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.order.OrderApi
import com.tattantat.app.data.remote.order.OrderSummaryPayload
import com.tattantat.app.data.remote.order.OrderStatusRequest
import com.tattantat.app.data.remote.order.RefundRequest
import com.tattantat.app.data.remote.order.RefundPayload
import com.tattantat.app.data.remote.order.OrderFinancialSnapshotPayload
import com.tattantat.app.data.remote.order.CreateReviewRequest
import com.tattantat.app.data.remote.account.AccountApi
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class OrdersUiState(val loading: Boolean = true, val orders: List<OrderSummaryPayload> = emptyList(), val userId:String="", val refunds: Map<String, List<RefundPayload>> = emptyMap(), val financialSnapshots: Map<String, OrderFinancialSnapshotPayload> = emptyMap(), val loadingRefundId: String? = null, val loadingPriceId: String? = null, val error: String? = null)
@HiltViewModel class OrdersViewModel @Inject constructor(private val api: OrderApi, private val accountApi: AccountApi) : ViewModel() {
    private val _state = MutableStateFlow(OrdersUiState()); val state = _state.asStateFlow()
    init { refresh() }
    fun refresh() = viewModelScope.launch { _state.value = _state.value.copy(loading = true, error = null); runCatching { Pair(api.list(),accountApi.me()) }.onSuccess { (orders,me) -> _state.value = OrdersUiState(loading = false, orders = orders.data.orEmpty(), userId = me.data?.id.orEmpty(), error = if (orders.success) null else orders.message) }.onFailure { _state.value = OrdersUiState(loading = false, error = "Không thể tải đơn hàng") } }
    fun transition(order:OrderSummaryPayload,status:String)=viewModelScope.launch{runCatching{api.updateStatus(order.id,OrderStatusRequest(status))}.onSuccess{refresh()}.onFailure{_state.value=_state.value.copy(error="Không thể cập nhật trạng thái đơn")}}
    fun complete(order:OrderSummaryPayload)=viewModelScope.launch{runCatching{api.complete(order.id)}.onSuccess{refresh()}.onFailure{_state.value=_state.value.copy(error="Không thể hoàn tất đơn hàng")}}
    fun review(order: OrderSummaryPayload, rating: Int, comment: String?) = viewModelScope.launch {
        runCatching { api.review(order.id, CreateReviewRequest(rating, comment?.trim()?.ifBlank { null })) }
            .onSuccess { refresh() }
            .onFailure { _state.value = _state.value.copy(error = "Không thể gửi đánh giá. Mỗi đơn chỉ được đánh giá một lần.") }
    }
    fun refund(order: OrderSummaryPayload, amount: String?, reason: String?) = viewModelScope.launch {
        runCatching { api.refund(order.id, UUID.randomUUID().toString(), RefundRequest(amount, reason)) }
            .onSuccess { refresh() }
            .onFailure { _state.value = _state.value.copy(error = "Không thể hoàn tiền. Kiểm tra trạng thái và số tiền của đơn.") }
    }
    fun loadRefunds(order: OrderSummaryPayload) = viewModelScope.launch {
        _state.value = _state.value.copy(loadingRefundId = order.id, error = null)
        runCatching { api.refunds(order.id).data.orEmpty() }
            .onSuccess { _state.value = _state.value.copy(refunds = _state.value.refunds + (order.id to it), loadingRefundId = null) }
            .onFailure { _state.value = _state.value.copy(loadingRefundId = null, error = "Không thể tải lịch sử hoàn tiền") }
    }
    fun loadPrice(order: OrderSummaryPayload) = viewModelScope.launch {
        _state.value = _state.value.copy(loadingPriceId = order.id, error = null)
        runCatching { api.price(order.id).data ?: error("Không có dữ liệu giá") }
            .onSuccess { _state.value = _state.value.copy(financialSnapshots = _state.value.financialSnapshots + (order.id to it), loadingPriceId = null) }
            .onFailure { _state.value = _state.value.copy(loadingPriceId = null, error = "Không thể tải chi tiết tài chính đơn") }
    }
}
