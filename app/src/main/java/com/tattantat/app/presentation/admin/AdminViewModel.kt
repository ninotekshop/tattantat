package com.tattantat.app.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.admin.AdminApi
import com.tattantat.app.data.remote.admin.AdminPayoutPayload
import com.tattantat.app.data.remote.admin.AdminRevenuePayload
import com.tattantat.app.data.remote.admin.CommercialQueuePayload
import com.tattantat.app.data.remote.admin.PayoutStatusRequest
import com.tattantat.app.data.remote.admin.ReconciliationPayload
import com.tattantat.app.data.remote.admin.ShippingPendingPayload
import com.tattantat.app.data.remote.admin.ShippingSettlementRequest
import com.tattantat.app.data.remote.admin.WalletReleasePendingPayload
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import java.time.LocalDate
import java.time.ZoneId
import javax.inject.Inject

data class AdminUiState(
    val loading: Boolean = true,
    val revenue: AdminRevenuePayload? = null,
    val queue: List<CommercialQueuePayload> = emptyList(),
    val payouts: List<AdminPayoutPayload> = emptyList(),
    val shipping: List<ShippingPendingPayload> = emptyList(),
    val walletReleases: List<WalletReleasePendingPayload> = emptyList(),
    val reconciliation: ReconciliationPayload? = null,
    val error: String? = null,
    val settlingId: String? = null,
    val reportLabel: String = "Toàn bộ thời gian",
    val reportFrom: String? = null,
    val reportTo: String? = null,
)

@HiltViewModel
class AdminViewModel @Inject constructor(private val api: AdminApi) : ViewModel() {
    private val _state = MutableStateFlow(AdminUiState())
    val state = _state.asStateFlow()

    init { refresh() }

    fun refresh(
        from: String? = _state.value.reportFrom,
        to: String? = _state.value.reportTo,
        label: String = _state.value.reportLabel,
    ) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        val revenue = async { runCatching { api.revenue(from, to).data }.getOrNull() }
        val queue = async { runCatching { api.commercialQueue().data.orEmpty() }.getOrNull() }
        val payouts = async { runCatching { api.payouts("REQUESTED").data.orEmpty() + api.payouts("PROCESSING").data.orEmpty() }.getOrNull() }
        val shipping = async { runCatching { api.pendingShipping().data.orEmpty() }.getOrNull() }
        val walletReleases = async { runCatching { api.pendingWalletReleases().data.orEmpty() }.getOrNull() }
        val reconciliation = async { runCatching { api.reconciliation().data }.getOrNull() }
        val r = revenue.await(); val q = queue.await(); val p = payouts.await(); val s = shipping.await(); val w = walletReleases.await(); val c = reconciliation.await()
        _state.value = AdminUiState(
            loading = false, revenue = r, queue = q ?: emptyList(), payouts = p ?: emptyList(), shipping = s ?: emptyList(), walletReleases = w ?: emptyList(), reconciliation = c,
            error = if (r == null || q == null || p == null || s == null || w == null || c == null) "Không thể tải đầy đủ dữ liệu quản trị" else null,
            reportLabel = label, reportFrom = from, reportTo = to,
        )
    }

    fun presetRange(label: String, days: Long) {
        val today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))
        refresh(
            from = "${today.minusDays(days - 1)}T00:00:00+07:00",
            to = "${today.plusDays(1)}T00:00:00+07:00",
            label = label,
        )
    }

    fun customRange(fromDate: String, toDate: String) {
        runCatching {
            val from = LocalDate.parse(fromDate.trim())
            val to = LocalDate.parse(toDate.trim())
            require(!to.isBefore(from))
            refresh("${from}T00:00:00+07:00", "${to.plusDays(1)}T00:00:00+07:00", "$fromDate đến $toDate")
        }.onFailure { _state.value = _state.value.copy(error = "Khoảng ngày không hợp lệ (YYYY-MM-DD)") }
    }

    fun settle(item: CommercialQueuePayload) = viewModelScope.launch {
        if (item.status != "PENDING" && item.status != "PENDING_PAYMENT") return@launch
        _state.value = _state.value.copy(settlingId = item.id, error = null)
        val result = runCatching {
            when (item.kind) {
                "PROMOTION" -> api.settlePromotion(item.id, UUID.randomUUID().toString())
                "SUBSCRIPTION" -> api.settleSubscription(item.id, UUID.randomUUID().toString())
                "ADVERTISING" -> api.settleAdvertising(item.id, UUID.randomUUID().toString())
                else -> error("Unsupported queue item")
            }
        }
        result.onSuccess { refresh() }.onFailure { _state.value = _state.value.copy(settlingId = null, error = "Không thể chốt thanh toán") }
    }

    fun transitionPayout(item: AdminPayoutPayload, status: String) = viewModelScope.launch {
        _state.value = _state.value.copy(settlingId = item.id, error = null)
        runCatching { api.updatePayout(item.id, UUID.randomUUID().toString(), PayoutStatusRequest(status)) }
            .onSuccess { refresh() }
            .onFailure { _state.value = _state.value.copy(settlingId = null, error = "Không thể cập nhật payout") }
    }

    fun settleShipping(item: ShippingPendingPayload, providerCost: String) = viewModelScope.launch {
        if (!providerCost.matches(Regex("^(0|[1-9]\\d{0,14})$"))) {
            _state.value = _state.value.copy(error = "Chi phí vận chuyển không hợp lệ")
            return@launch
        }
        _state.value = _state.value.copy(settlingId = item.id, error = null)
        runCatching { api.settleShipping(item.id, UUID.randomUUID().toString(), ShippingSettlementRequest(providerCost)) }
            .onSuccess { refresh() }
            .onFailure { _state.value = _state.value.copy(settlingId = null, error = "Không thể đối soát vận chuyển") }
    }

    fun releaseWallet(item: WalletReleasePendingPayload) = viewModelScope.launch {
        _state.value = _state.value.copy(settlingId = item.id, error = null)
        runCatching { api.releaseWallet(item.id, UUID.randomUUID().toString()) }
            .onSuccess { refresh() }
            .onFailure { _state.value = _state.value.copy(settlingId = null, error = "Không thể chuyển tiền vào ví khả dụng") }
    }
}
