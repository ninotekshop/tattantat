package com.tattantat.app.presentation.sell

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.advertising.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import java.util.UUID

data class AdvertisingUiState(val loading:Boolean=false,val campaigns:List<CampaignPayload> = emptyList(),val error:String?=null,val message:String?=null)
@HiltViewModel class AdvertisingViewModel @Inject constructor(private val api:AdvertisingApi):ViewModel(){private val _state=MutableStateFlow(AdvertisingUiState());val state=_state.asStateFlow();init{refresh()};fun refresh()=viewModelScope.launch{runCatching{api.campaigns()}.onSuccess{r->_state.value=_state.value.copy(campaigns=r.data.orEmpty())}};fun create(productId:String,budget:String)=viewModelScope.launch{_state.value=_state.value.copy(loading=true,error=null);runCatching{api.create(UUID.randomUUID().toString(),CreateCampaignRequest(productId,budget=budget))}.onSuccess{r->_state.value=_state.value.copy(loading=false,campaigns=listOfNotNull(r.data)+_state.value.campaigns,message=r.message?:"Đã tạo campaign chờ thanh toán")}.onFailure{_state.value=_state.value.copy(loading=false,error="Không thể tạo campaign")}}}
