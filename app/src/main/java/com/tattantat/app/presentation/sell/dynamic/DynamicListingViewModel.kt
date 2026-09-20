package com.tattantat.app.presentation.sell.dynamic

import android.content.Context
import android.net.Uri
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.core.security.TokenStore
import com.tattantat.app.data.remote.auth.ApiEnvelope
import com.tattantat.app.data.remote.listing.*
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import retrofit2.HttpException
import retrofit2.Retrofit
import java.util.UUID
import javax.inject.Inject

data class DynamicListingState(
    val loading:Boolean=true,val busy:Boolean=false,val saving:Boolean=false,val conflict:Boolean=false,
    val categories:List<ListingCategory> = emptyList(),val drafts:List<ListingSummary> = emptyList(),val categoryId:String="",
    val template:ListingTemplate?=null,val draft:ListingDraft?=null,val data:ListingFormData=ListingFormData(),val media:List<ListingMedia> = emptyList(),
    val step:Int=0,val saveStatus:String="",val error:String?=null,val errors:Map<String,String> = emptyMap(),val publishedId:String?=null,
)

@HiltViewModel
class DynamicListingViewModel @Inject constructor(
    retrofit:Retrofit,private val tokenStore:TokenStore,private val savedState:SavedStateHandle,
    @ApplicationContext private val context:Context,
):ViewModel(){
    private val api=retrofit.create(ListingApi::class.java)
    private val mutable=MutableStateFlow(DynamicListingState());val state=mutable.asStateFlow()
    private val lock=Mutex()
    private var debounce:Job?=null
    private var lastSaved:ListingFormData?=null
    private var revision=0
    private var sessionToken:String?=null
    private var publishKey:Pair<Int,String>?=null
    init { refresh() }

    private fun <T> ApiEnvelope<T>.value():T {check(success){message?:"Máy chủ từ chối yêu cầu."};return data?:error("Máy chủ chưa trả dữ liệu.")}
    private fun failure(cause:Throwable){
        if(cause is CancellationException)throw cause
        val status=(cause as? HttpException)?.code()
        val body=if(cause is HttpException)runCatching{JSONObject(cause.response()?.errorBody()?.string().orEmpty())}.getOrNull() else null
        val fields=body?.optJSONObject("errors")?.let{obj->obj.keys().asSequence().associateWith{obj.optString(it)}}?:emptyMap()
        val message=when(status){401->"Phiên đăng nhập hết hạn. Hãy đăng nhập lại.";409->body?.optString("message")?:"Bản nháp đã thay đổi ở thiết bị khác. Hãy tải lại.";else->body?.optString("message")?.takeIf{it.isNotBlank()}?:if(cause is java.io.IOException)"Không thể kết nối máy chủ. Dữ liệu chưa lưu vẫn ở màn hình này." else cause.message?:"Không thể thực hiện thao tác."}
        mutable.value=mutable.value.copy(error=message,errors=fields,conflict=mutable.value.conflict||status==409,saveStatus=if(mutable.value.saving)"Chưa lưu được" else mutable.value.saveStatus)
    }
    private suspend fun checkSession(){check(sessionToken!=null&&tokenStore.accessToken()==sessionToken){"Phiên tài khoản đã thay đổi. Hãy mở lại màn hình đăng tin."}}
    private fun action(block:suspend ()->Unit){
        if(mutable.value.busy)return
        mutable.value=mutable.value.copy(busy=true,error=null)
        viewModelScope.launch{try{lock.withLock{checkSession();block()}}catch(cause:Throwable){failure(cause)}finally{mutable.value=mutable.value.copy(busy=false)}}
    }
    fun refresh(){
        if(mutable.value.busy)return
        mutable.value=mutable.value.copy(loading=true,busy=true,error=null)
        viewModelScope.launch{try{lock.withLock{
            sessionToken=tokenStore.accessToken()
            val categories=api.categories().value()
            checkSession()
            val drafts=api.mine().value()
            mutable.value=mutable.value.copy(categories=categories,drafts=drafts)
            val id=savedState.get<String>("listingDraftId")
            if(id!=null&&mutable.value.draft==null)accept(api.draft(id).value())
        }}catch(cause:Throwable){failure(cause)}finally{mutable.value=mutable.value.copy(loading=false,busy=false)}}
    }
    fun category(id:String){
        if(mutable.value.draft!=null)return
        action{val template=api.template(id).value();mutable.value=mutable.value.copy(categoryId=id,template=template)}
    }
    private fun accept(draft:ListingDraft){
        check(draft.owner){"Bạn không có quyền sửa tin này."}
        debounce?.cancel();lastSaved=draft.data;revision=draft.revision;publishKey=null
        savedState["listingDraftId"]=draft.id
        mutable.value=mutable.value.copy(draft=draft,template=draft.template,data=draft.data,media=draft.media,categoryId=draft.categoryId,step=1,conflict=false,errors=emptyMap(),error=null,saveStatus="Đã tải bản nháp",publishedId=null)
    }
    fun resume(id:String)=action{if(!mutable.value.conflict)saveLocked();accept(api.draft(id).value())}
    fun reload()=action{mutable.value.draft?.let{accept(api.draft(it.id).value())}}
    fun change(transform:(ListingFormData)->ListingFormData){
        if(mutable.value.busy||mutable.value.conflict||mutable.value.step==6)return
        mutable.value=mutable.value.copy(data=transform(mutable.value.data),errors=emptyMap(),saveStatus="Có thay đổi chưa lưu")
        debounce?.cancel()
        debounce=viewModelScope.launch{delay(1200); // Do not cancel an in-flight HTTP save when another keystroke arrives.
            viewModelScope.launch{try{lock.withLock{saveLocked()}}catch(cause:Throwable){failure(cause)}}
        }
    }
    fun field(key:String,value:Any?)=change{it.copy(values=it.values+(key to value))}
    private suspend fun saveLocked(){
        val s=mutable.value;val draft=s.draft?:return
        if(s.data==lastSaved)return
        check(!s.conflict){"Hãy tải lại bản nháp trước khi lưu."};checkSession()
        mutable.value=mutable.value.copy(saving=true,saveStatus="Đang lưu…")
        try{val result=api.save(draft.id,SaveDraft(revision,s.data)).value();revision=result.revision;lastSaved=s.data;mutable.value=mutable.value.copy(saveStatus=if(mutable.value.data==s.data)"Đã lưu trên máy chủ" else "Có thay đổi chưa lưu")}
        catch(cause:Throwable){mutable.value=mutable.value.copy(saveStatus="Chưa lưu được");throw cause}
        finally{mutable.value=mutable.value.copy(saving=false)}
    }
    fun save()=action{saveLocked()}
    fun saveAndLeave(onSaved:()->Unit)=action{saveLocked();onSaved()}
    fun back(){if(!mutable.value.busy)mutable.value=mutable.value.copy(step=(mutable.value.step-1).coerceAtLeast(0),error=null)}
    fun next()=action{
        val s=mutable.value
        if(s.step==0){
            if(s.draft!=null){mutable.value=s.copy(step=1);return@action}
            check(s.categoryId.isNotBlank()&&s.template!=null){"Hãy chọn danh mục."}
            val previousCategory=savedState.get<String>("createCategory")
            if(previousCategory!=s.categoryId){savedState["createCategory"]=s.categoryId;savedState["createKey"]=UUID.randomUUID().toString()}
            val key=savedState.get<String>("createKey")?:UUID.randomUUID().toString().also{savedState["createKey"]=it}
            accept(api.create(CreateDraft(s.categoryId,key)).value());return@action
        }
        val template=s.template?:return@action
        val errors=ListingRules.errors(s.data,template,s.step)
        if(errors.isNotEmpty()){mutable.value=mutable.value.copy(errors=errors,error=errors.values.first());return@action}
        saveLocked()
        if(s.step==5){
            if(publishKey?.first!=revision)publishKey=revision to UUID.randomUUID().toString()
            val result=api.publish(s.draft!!.id,publishKey!!.second,PublishDraft(revision)).value()
            mutable.value=mutable.value.copy(step=6,publishedId=result.productId,saveStatus="Đã đăng tin")
            savedState.remove<String>("listingDraftId")
        }else mutable.value=mutable.value.copy(step=s.step+1,error=null)
    }
    fun newListing()=action{saveLocked();savedState.remove<String>("listingDraftId");savedState.remove<String>("createKey");savedState.remove<String>("createCategory");lastSaved=null;mutable.value=DynamicListingState(loading=false,busy=true,categories=mutable.value.categories,drafts=api.mine().value())}
    fun upload(uris:List<Uri>,kind:String,square:Boolean)=action{
        val draft=mutable.value.draft?:return@action
        check(kind in listOf("images","videos"))
        val count=if(kind=="images")mutable.value.data.images.size else mutable.value.data.videos.size
        check(count+uris.size<=if(kind=="images")20 else 3){if(kind=="images")"Tối đa 20 ảnh." else "Tối đa 3 video."}
        for((index,uri) in uris.withIndex()){
            mutable.value=mutable.value.copy(saveStatus="Đang tải tệp ${index+1}/${uris.size}…")
            val file=withContext(Dispatchers.IO){ListingUpload.prepare(context,uri,kind,square)}
            val part=MultipartBody.Part.createFormData("file",file.name,file.bytes.toRequestBody(file.mime.toMediaType()))
            val media=api.upload(draft.id,kind,part).value()
            val data=mutable.value.data
            mutable.value=mutable.value.copy(media=mutable.value.media+media,data=if(kind=="images")data.copy(images=data.images+media.id) else data.copy(videos=data.videos+media.id))
            saveLocked()
        }
    }
    fun move(kind:String,id:String,offset:Int)=change{data->
        val ids=(if(kind=="images")data.images else data.videos).toMutableList();val from=ids.indexOf(id);val to=from+offset
        if(from in ids.indices&&to in ids.indices){val temp=ids[from];ids[from]=ids[to];ids[to]=temp}
        if(kind=="images")data.copy(images=ids) else data.copy(videos=ids)
    }
    fun recover(item:ListingMedia)=change{data->if(item.kind=="images"&&data.images.size<20)data.copy(images=(data.images+item.id).distinct()) else if(item.kind=="videos"&&data.videos.size<3)data.copy(videos=(data.videos+item.id).distinct()) else data}
    fun remove(item:ListingMedia)=action{
        val draft=mutable.value.draft?:return@action;val data=mutable.value.data
        val values=data.values.filterNot{(key,value)->value==item.id&&mutable.value.template?.fields?.any{it.key==key&&it.type in listOf("image","video")}==true}
        mutable.value=mutable.value.copy(data=data.copy(images=data.images-item.id,videos=data.videos-item.id,values=values));saveLocked()
        try{api.removeMedia(draft.id,item.id).value();mutable.value=mutable.value.copy(media=mutable.value.media.filterNot{it.id==item.id})}
        catch(cause:HttpException){if(cause.code()==409)mutable.value=mutable.value.copy(error="Đã bỏ khỏi bản nháp. Tệp cũ được giữ cho tin công khai đến khi đăng bản cập nhật.") else throw cause}
    }
}
