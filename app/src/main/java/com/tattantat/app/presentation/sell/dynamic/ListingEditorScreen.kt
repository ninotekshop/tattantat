package com.tattantat.app.presentation.sell.dynamic

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.listing.ListingApi
import com.tattantat.app.presentation.sell.EditListingScreen
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.Retrofit

data class ListingEditorState(val loading:Boolean=true,val listingId:String?=null,val error:String?=null)

@HiltViewModel
class ListingEditorViewModel @Inject constructor(retrofit:Retrofit):ViewModel(){
    private val api=retrofit.create(ListingApi::class.java)
    private val mutable=MutableStateFlow(ListingEditorState())
    val state=mutable.asStateFlow()
    fun load(productId:String){
        mutable.value=ListingEditorState()
        viewModelScope.launch{
            try{
                val response=api.byProduct(productId)
                check(response.success&&response.data!=null){"Không thể tải tin đăng."}
                mutable.value=ListingEditorState(loading=false,listingId=response.data.listingId)
            }catch(cause:Exception){
                if(cause is CancellationException)throw cause
                mutable.value=ListingEditorState(loading=false,error="Không thể tải biểu mẫu. Kiểm tra kết nối và quyền sở hữu tin.")
            }
        }
    }
}

@Composable
fun ListingEditorScreen(id:String,onDone:()->Unit,vm:ListingEditorViewModel=hiltViewModel()){
    val state by vm.state.collectAsState()
    LaunchedEffect(id){vm.load(id)}
    when{
        state.loading->Column(Modifier.padding(24.dp)){CircularProgressIndicator();Text("Đang tải biểu mẫu…")}
        state.error!=null->Column(Modifier.padding(24.dp)){
            Text(state.error!!,color=MaterialTheme.colorScheme.error)
            Button(onClick={vm.load(id)}){Text("Thử lại")}
            TextButton(onClick=onDone){Text("Quay lại")}
        }
        state.listingId!=null->DynamicListingScreen(onMyListings=onDone,initialDraftId=state.listingId)
        else->EditListingScreen(id,onDone)
    }
}
