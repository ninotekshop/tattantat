package com.tattantat.app.presentation.profile
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.account.AccountApi
import com.tattantat.app.data.remote.account.UpdateProfileRequest
import com.tattantat.app.domain.auth.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
data class ProfileState(val name:String="",val contact:String="",val pendingBalance:String="0",val availableBalance:String="0",val heldBalance:String="0",val role:String="USER",val saving:Boolean=false,val loggingOut:Boolean=false,val error:String?=null,val message:String?=null)
@HiltViewModel class ProfileViewModel @Inject constructor(private val api:AccountApi,private val auth:AuthRepository):ViewModel(){private val _state=MutableStateFlow(ProfileState());val state=_state.asStateFlow();init{refresh()};fun refresh()=viewModelScope.launch{val me=runCatching{api.me().data}.getOrNull();val wallet=runCatching{api.wallet().data}.getOrNull();_state.value=ProfileState(me?.full_name.orEmpty(),me?.phone?:me?.email.orEmpty(),wallet?.pendingBalance?:"0",wallet?.availableBalance?:"0",wallet?.heldBalance?:"0",me?.role?:"USER",error=if(me==null)"Không thể tải hồ sơ"else null)};fun updateName(name:String)=viewModelScope.launch{if(name.trim().length<2){_state.value=_state.value.copy(error="Tên cần ít nhất 2 ký tự");return@launch};_state.value=_state.value.copy(saving=true,error=null);runCatching{api.updateProfile(UpdateProfileRequest(fullName=name.trim())).data?:error("Không thể cập nhật")}.onSuccess{refresh()}.onFailure{_state.value=_state.value.copy(saving=false,error="Không thể cập nhật hồ sơ")}};fun logout(onComplete:()->Unit)=viewModelScope.launch{_state.value=_state.value.copy(loggingOut=true,error=null);auth.logout();onComplete()}}
