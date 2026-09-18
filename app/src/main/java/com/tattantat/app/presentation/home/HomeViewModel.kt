package com.tattantat.app.presentation.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.repository.FakeHomeRepository
import com.tattantat.app.domain.category.Category
import com.tattantat.app.domain.product.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

data class HomeUiState(val categories: List<Category> = emptyList(), val nearby: List<Product> = emptyList())

@HiltViewModel
class HomeViewModel @Inject constructor(repository: FakeHomeRepository) : ViewModel() {
    val state = combine(repository.observeCategories(), repository.observeNearbyProducts(), ::HomeUiState)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HomeUiState())
}
