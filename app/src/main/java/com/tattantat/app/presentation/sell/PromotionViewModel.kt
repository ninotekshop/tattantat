package com.tattantat.app.presentation.sell

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.promotion.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class PromotionUiState(val loading:Boolean=true,val packages:List<PromotionPackagePayload> = emptyList(),val error:String?=null,val message:String?=null)
@HiltViewModel class PromotionViewModel @Inject constructor(private val api:PromotionApi):ViewModel(){private val _state=MutableStateFlow(PromotionUiState());val state=_state.asStateFlow();init{viewModelScope.launch{runCatching{api.packages()}.onSuccess{r->_state.value=PromotionUiState(false,r.data.orEmpty(),if(r.success)null else r.message)}.onFailure{_state.value=PromotionUiState(false,error="Không thể tải gói Đẩy tin")}}};fun purchase(productId:String,packageId:String)=viewModelScope.launch{_state.value=_state.value.copy(loading=true,error=null);runCatching{api.purchase(UUID.randomUUID().toString(),PromotionPurchaseRequest(productId,packageId))}.onSuccess{r->_state.value=_state.value.copy(loading=false,message=r.message?:"Đã tạo yêu cầu thanh toán")}.onFailure{_state.value=_state.value.copy(loading=false,error="Không thể tạo yêu cầu Đẩy tin")}}}
