package com.tattantat.app.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.admin.AdminApi
import com.tattantat.app.data.remote.admin.PricingRulePayload
import com.tattantat.app.data.remote.admin.PricingVersionRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdminPricingUiState(val loading:Boolean=true,val rules:List<PricingRulePayload> = emptyList(),val saving:Boolean=false,val error:String?=null,val message:String?=null)
@HiltViewModel class AdminPricingViewModel @Inject constructor(private val api:AdminApi):ViewModel(){private val _state=MutableStateFlow(AdminPricingUiState());val state=_state.asStateFlow();init{refresh()};fun refresh()=viewModelScope.launch{_state.value=_state.value.copy(loading=true,error=null);runCatching{api.pricingRules().data.orEmpty()}.onSuccess{_state.value=AdminPricingUiState(false,it)}.onFailure{_state.value=AdminPricingUiState(false,error="Không thể tải biểu phí")}};fun save(code:String,percent:Int,reason:String)=viewModelScope.launch{if(percent !in 0..100||reason.trim().length<3){_state.value=_state.value.copy(error="Mức phí hoặc lý do không hợp lệ");return@launch};_state.value=_state.value.copy(saving=true,error=null,message=null);runCatching{api.createPricingVersion(code,PricingVersionRequest(percent*100,reason.trim()))}.onSuccess{_state.value=_state.value.copy(saving=false,message="Đã tạo phiên bản biểu phí mới");refresh()}.onFailure{_state.value=_state.value.copy(saving=false,error="Không thể cập nhật biểu phí")}}}
