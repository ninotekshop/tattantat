package com.tattantat.app.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.subscription.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class SubscriptionUiState(val loading:Boolean=true,val plans:List<SubscriptionPlanPayload> = emptyList(),val active:SubscriptionPayload?=null,val error:String?=null,val message:String?=null)
@HiltViewModel class SubscriptionViewModel @Inject constructor(private val api:SubscriptionApi):ViewModel(){private val _state=MutableStateFlow(SubscriptionUiState());val state=_state.asStateFlow();init{refresh()};fun refresh()=viewModelScope.launch{runCatching{Pair(api.plans(),api.mine())}.onSuccess{(plans,mine)->_state.value=SubscriptionUiState(false,plans.data.orEmpty(),mine.data,if(plans.success)null else plans.message)}.onFailure{_state.value=SubscriptionUiState(false,error="Không thể tải gói Shop")}};fun purchase(planId:String)=viewModelScope.launch{_state.value=_state.value.copy(loading=true,error=null);runCatching{api.purchase(UUID.randomUUID().toString(),SubscriptionPurchaseRequest(planId))}.onSuccess{r->_state.value=_state.value.copy(loading=false,message=r.message?:"Đã tạo yêu cầu gói");refresh()}.onFailure{_state.value=_state.value.copy(loading=false,error="Không thể tạo yêu cầu gói Shop")}}}
