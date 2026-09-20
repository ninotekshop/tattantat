package com.tattantat.app.presentation.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.account.AccountApi
import com.tattantat.app.data.remote.account.SellerReviewPayload
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SellerReviewsState(val loading:Boolean=true,val items:List<SellerReviewPayload> = emptyList(),val error:String?=null)
@HiltViewModel class SellerReviewsViewModel @Inject constructor(private val api:AccountApi):ViewModel(){private val _state=MutableStateFlow(SellerReviewsState());val state=_state.asStateFlow();init{refresh()};fun refresh()=viewModelScope.launch{runCatching{api.sellerReviews().data.orEmpty()}.onSuccess{_state.value=SellerReviewsState(false,it)}.onFailure{_state.value=SellerReviewsState(false,error="Không thể tải đánh giá")}}}
@Composable fun SellerReviewsScreen(vm:SellerReviewsViewModel=hiltViewModel()){val state by vm.state.collectAsState();Column(Modifier.fillMaxSize().padding(16.dp)){Text("Đánh giá của tôi",style=MaterialTheme.typography.headlineSmall);state.items.firstOrNull()?.let{Text("★ ${it.average_rating}/5",style=MaterialTheme.typography.titleLarge,color=MaterialTheme.colorScheme.primary)};TextButton(onClick=vm::refresh){Text("Làm mới")};if(state.loading)LinearProgressIndicator(Modifier.fillMaxWidth());state.error?.let{Text(it,color=MaterialTheme.colorScheme.error)};LazyColumn{items(state.items,key={it.id}){review->ListItem(headlineContent={Text("${review.buyer_name} · ${review.rating}/5 sao")},supportingContent={Text(review.comment?.takeIf{it.isNotBlank()}?:"Không có nhận xét")})};if(!state.loading&&state.items.isEmpty())item{Text("Chưa có đánh giá nào.")}}}}
