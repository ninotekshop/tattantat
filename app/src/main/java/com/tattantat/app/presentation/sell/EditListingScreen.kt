package com.tattantat.app.presentation.sell
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.repository.RemoteProductRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import coil.compose.AsyncImage
data class EditListingState(val loading:Boolean=true,val saving:Boolean=false,val title:String="",val price:String="",val description:String="",val condition:String="USED_GOOD",val images:List<Uri> = emptyList(),val error:String?=null,val saved:Boolean=false)
@HiltViewModel class EditListingViewModel @Inject constructor(private val products:RemoteProductRepository):ViewModel(){private val _state=MutableStateFlow(EditListingState());val state=_state.asStateFlow();fun load(id:String)=viewModelScope.launch{runCatching{products.mine().first{it.id==id}}.onSuccess{_state.value=EditListingState(false,title=it.title,price=it.price.filter(Char::isDigit),description=it.description.orEmpty(),condition=it.condition?:"USED_GOOD")}.onFailure{_state.value=EditListingState(false,error="Không thể tải tin đăng")}};fun update(f:(EditListingState)->EditListingState){_state.value=f(_state.value)};fun save(id:String)=viewModelScope.launch{val s=_state.value;val p=s.price.toLongOrNull();if(s.title.isBlank()||p==null){_state.value=s.copy(error="Hãy nhập tên và giá hợp lệ");return@launch};_state.value=s.copy(saving=true,error=null);runCatching{products.updateListing(id,s.title,p,s.description,s.condition,null,s.images)}.onSuccess{_state.value=_state.value.copy(saving=false,saved=true)}.onFailure{_state.value=_state.value.copy(saving=false,error="Không thể cập nhật tin đăng")}}}
@Composable fun EditListingScreen(id:String,onDone:()->Unit,vm:EditListingViewModel=hiltViewModel()){val s by vm.state.collectAsState();val picker=rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()){uris->vm.update{it.copy(images=uris.take(10))}};LaunchedEffect(id){vm.load(id)};LaunchedEffect(s.saved){if(s.saved)onDone()};Column(Modifier.fillMaxSize().padding(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){Text("Chỉnh sửa tin đăng",style=MaterialTheme.typography.headlineSmall);if(s.loading)CircularProgressIndicator() else {OutlinedTextField(s.title,{value->vm.update{state->state.copy(title=value)}},label={Text("Tên sản phẩm")},modifier=Modifier.fillMaxWidth());OutlinedTextField(s.price,{value->vm.update{state->state.copy(price=value.filter(Char::isDigit))}},label={Text("Giá")},modifier=Modifier.fillMaxWidth());OutlinedTextField(s.description,{value->vm.update{state->state.copy(description=value)}},label={Text("Mô tả")},modifier=Modifier.fillMaxWidth(),minLines=3);OutlinedButton(onClick={picker.launch("image/*")}){Text(if(s.images.isEmpty())"Thay ảnh" else "Thay ảnh (${s.images.size}/10)")};if(s.images.isNotEmpty()){Text("Ảnh mới sẽ thay toàn bộ ảnh hiện có sau khi lưu.",style=MaterialTheme.typography.bodySmall);LazyRow(horizontalArrangement=Arrangement.spacedBy(8.dp)){items(s.images,key={it.toString()}){uri->Column{AsyncImage(uri,"Ảnh mới",Modifier.size(92.dp),contentScale=ContentScale.Crop);TextButton(onClick={vm.update{state->state.copy(images=state.images.filterNot{it==uri})}}){Text("Bỏ")}}}}};Text("Tình trạng");Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){listOf("NEW" to "Mới","LIKE_NEW" to "Gần như mới","USED_GOOD" to "Tốt","USED_FAIR" to "Đã dùng").forEach{(code,label)->FilterChip(selected=s.condition==code,onClick={vm.update{state->state.copy(condition=code)}},label={Text(label)})}};s.error?.let{Text(it,color=MaterialTheme.colorScheme.error)};Button(onClick={vm.save(id)},enabled=!s.saving,modifier=Modifier.fillMaxWidth()){Text(if(s.saving)"Đang lưu..." else "Lưu thay đổi")}}}}
