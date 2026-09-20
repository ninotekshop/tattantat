package com.tattantat.app.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.account.AccountApi
import com.tattantat.app.data.remote.account.BankAccountPayload
import com.tattantat.app.data.remote.account.CancelPayoutRequest
import com.tattantat.app.data.remote.account.CreateBankAccountRequest
import com.tattantat.app.data.remote.account.PayoutRequest
import com.tattantat.app.data.remote.account.SellerPayoutPayload
import com.tattantat.app.data.remote.account.SellerRevenuePayload
import com.tattantat.app.data.remote.account.WalletPayload
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class WalletUiState(
    val wallet: WalletPayload = WalletPayload("0", "0", "0", "VND"),
    val revenue: SellerRevenuePayload? = null,
    val accounts: List<BankAccountPayload> = emptyList(),
    val payouts: List<SellerPayoutPayload> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
    val message: String? = null,
)

@HiltViewModel
class WalletViewModel @Inject constructor(private val api: AccountApi) : ViewModel() {
    private val _state = MutableStateFlow(WalletUiState())
    val state = _state.asStateFlow()

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        val wallet = async { runCatching { api.wallet().data }.getOrNull() }
        val revenue = async { runCatching { api.revenue().data }.getOrNull() }
        val accounts = async { runCatching { api.bankAccounts().data.orEmpty() }.getOrNull() }
        val payouts = async { runCatching { api.payouts().data.orEmpty() }.getOrNull() }
        val w = wallet.await(); val r = revenue.await(); val a = accounts.await(); val p = payouts.await()
        _state.value = WalletUiState(
            wallet = w ?: WalletPayload("0", "0", "0", "VND"), revenue = r,
            accounts = a.orEmpty(), payouts = p.orEmpty(), loading = false,
            error = if (w == null || r == null || a == null || p == null) "Không thể tải đầy đủ dữ liệu ví" else null,
        )
    }

    fun addAccount(bank: String, holder: String, number: String, isDefault: Boolean) = viewModelScope.launch {
        runCatching { api.addBankAccount(CreateBankAccountRequest(bank, holder, number, isDefault)).data ?: error("Không thể thêm tài khoản") }
            .onSuccess { refresh() }
            .onFailure { _state.value = _state.value.copy(error = "Không thể thêm tài khoản. Kiểm tra lại thông tin.") }
    }

    fun payout(amount: String, bankAccountId: String?) = viewModelScope.launch {
        runCatching { api.requestPayout(UUID.randomUUID().toString(), PayoutRequest(amount, bankAccountId)).data ?: error("Không thể tạo yêu cầu") }
            .onSuccess { _state.value = _state.value.copy(message = "Đã gửi yêu cầu rút tiền"); refresh() }
            .onFailure { _state.value = _state.value.copy(error = "Không thể rút tiền. Kiểm tra số dư khả dụng.") }
    }

    fun cancelPayout(payout: SellerPayoutPayload) = viewModelScope.launch {
        runCatching { api.cancelPayout(payout.id, UUID.randomUUID().toString(), CancelPayoutRequest()).data ?: error("Không thể hủy yêu cầu") }
            .onSuccess { _state.value = _state.value.copy(message = "Đã hủy yêu cầu rút tiền"); refresh() }
            .onFailure { _state.value = _state.value.copy(error = "Không thể hủy yêu cầu rút tiền") }
    }
}
