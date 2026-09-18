package com.tattantat.app.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.core.network.ApiResult
import com.tattantat.app.domain.auth.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(val loading: Boolean = false, val error: String? = null, val verificationId: String? = null, val authenticated: Boolean = false)

@HiltViewModel
class AuthViewModel @Inject constructor(private val repository: AuthRepository) : ViewModel() {
    private val _state = MutableStateFlow(AuthUiState()); val state: StateFlow<AuthUiState> = _state.asStateFlow()
    fun login(identity: String, password: String) = submit { repository.login(identity, password) }
    fun register(name: String, phone: String, password: String) { viewModelScope.launch { _state.value = AuthUiState(loading = true); when (val r = repository.register(name, phone, password)) { is ApiResult.Success -> _state.value = AuthUiState(verificationId = r.data); is ApiResult.Failure -> _state.value = AuthUiState(error = r.message) } } }
    fun verifyOtp(verificationId: String, code: String) = submit { repository.verifyOtp(verificationId, code) }
    fun clearError() { _state.value = _state.value.copy(error = null) }
    private fun submit(action: suspend () -> ApiResult<*>) { viewModelScope.launch { _state.value = _state.value.copy(loading = true, error = null); _state.value = when (val r = action()) { is ApiResult.Success<*> -> _state.value.copy(loading = false, authenticated = true); is ApiResult.Failure -> _state.value.copy(loading = false, error = r.message) } } }
}
