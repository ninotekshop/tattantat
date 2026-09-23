package com.tattantat.app.presentation.navigation

import androidx.lifecycle.ViewModel
import com.tattantat.app.core.network.ApiResult
import com.tattantat.app.domain.auth.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class AppViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    suspend fun checkSession(): Boolean {
        return authRepository.restoreSession() is ApiResult.Success
    }
}
