package com.tattantat.app.presentation.sell.dynamic

import android.net.Uri
import android.widget.MediaController
import android.widget.VideoView
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.tattantat.app.data.remote.listing.*

private val steps=listOf("Danh mục","Thông tin","Ảnh & video","Giá & vị trí","Liên hệ","Xem trước","Hoàn tất")

@Composable
fun DynamicListingScreen(onMyListings:()->Unit,initialDraftId:String?=null,vm:DynamicListingViewModel=hiltViewModel()){
    val s by vm.state.collectAsState()
    var initialOpened by rememberSaveable(initialDraftId){mutableStateOf(false)}
    LaunchedEffect(initialDraftId,s.loading,s.busy){if(initialDraftId!=null&&!initialOpened&&!s.loading&&!s.busy){initialOpened=true;vm.resume(initialDraftId)}}
    val listState=rememberLazyListState()
    var reloadDialog by remember{mutableStateOf(false)}
    var newDialog by remember{mutableStateOf(false)}
    var mapDialog by remember{mutableStateOf(false)}
    var square by rememberSaveable{mutableStateOf(false)}
    var preview by remember{mutableStateOf<ListingMedia?>(null)}
    val imagePicker=rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()){vm.upload(it,"images",square)}
    val videoPicker=rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()){vm.upload(it,"videos",false)}
    val enabled=!s.busy&&!s.conflict&&!s.loading
    LaunchedEffect(s.step){listState.scrollToItem(0)}
    BackHandler(s.step in 1..5){if(!s.busy)vm.back()}
    Column(Modifier.fillMaxSize().imePadding().padding(horizontal=16.dp),verticalArrangement=Arrangement.spacedBy(8.dp)){
        Text("Đăng tin miễn phí",style=MaterialTheme.typography.headlineSmall,modifier=Modifier.padding(top=12.dp))
        Text("Bước ${s.step+1}/7 · ${steps[s.step]}",style=MaterialTheme.typography.titleMedium)
        LinearProgressIndicator(progress={(s.step+1)/7f},modifier=Modifier.fillMaxWidth())
        if(s.saveStatus.isNotBlank())Text(s.saveStatus,style=MaterialTheme.typography.bodySmall)
        if(s.loading)CircularProgressIndicator()
        s.error?.let{Text(it,color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodySmall)}
        if(s.conflict)OutlinedButton(onClick={reloadDialog=true},enabled=!s.busy){Text("Tải lại bản nháp từ máy chủ")}
        if(!s.loading&&s.categories.isEmpty())OutlinedButton(onClick=vm::refresh,enabled=!s.busy){Text("Tải lại danh mục")}
        LazyColumn(state=listState,modifier=Modifier.weight(1f).fillMaxWidth(),verticalArrangement=Arrangement.spacedBy(12.dp),contentPadding=PaddingValues(vertical=8.dp)){
            item{
                when(s.step){
                    0->Column(verticalArrangement=Arrangement.spacedBy(10.dp)){
                        if(s.draft!=null){Text("Danh mục: ${s.categories.find{it.id==s.categoryId}?.name.orEmpty()}");Text("Danh mục của bản nháp được giữ cố định để bảo toàn dữ liệu.");OutlinedButton(onClick={newDialog=true},enabled=enabled){Text("Tạo tin mới, giữ bản nháp này")}}
                        else{
                            Text("Bạn muốn đăng gì?",style=MaterialTheme.typography.titleMedium)
                            s.categories.filter{it.isGroup}.forEach{category->OutlinedButton(onClick={vm.category(category.id)},enabled=enabled,modifier=Modifier.fillMaxWidth()){Text(category.name)}}
                            val selected=s.categories.find{it.id==s.categoryId}
                            selected?.let{Text("Đang chọn: ${it.name}",color=MaterialTheme.colorScheme.primary);it.parentId?.let{parent->TextButton(onClick={vm.category(parent)},enabled=enabled){Text("↑ Danh mục cha")}}}
                            s.categories.filter{it.parentId==s.categoryId}.forEach{category->OutlinedButton(onClick={vm.category(category.id)},enabled=enabled,modifier=Modifier.fillMaxWidth()){Text(category.name)}}
                            s.template?.let{Text("Biểu mẫu ${it.name} · phiên bản ${it.version}",style=MaterialTheme.typography.bodySmall)}
                            if(s.drafts.isNotEmpty()){HorizontalDivider();Text("Tiếp tục tin đã lưu",style=MaterialTheme.typography.titleMedium)}
                            s.drafts.forEach{draft->OutlinedButton(onClick={vm.resume(draft.id)},enabled=enabled,modifier=Modifier.fillMaxWidth()){Column{Text(draft.title?.takeIf{it.isNotBlank()}?:"Tin chưa có tiêu đề");Text(if(draft.status=="PUBLISHED")"Đã đăng · chỉnh sửa" else "Bản nháp",style=MaterialTheme.typography.bodySmall)}}}
                        }
                    }
                    1->Column(verticalArrangement=Arrangement.spacedBy(12.dp)){
                        ListingText("Tiêu đề *",s.data.title,{value->vm.change{it.copy(title=value)}},enabled,s.errors["title"],maxLength=200)
                        ListingChoice("Tình trạng *",s.data.condition,ListingRules.conditions.map{FieldOption(it.key,it.value)},enabled){value->vm.change{it.copy(condition=value)}}
                        s.template?.let{template->template.fields.filter{it.type !in listOf("image","video")&&ListingRules.visible(it,s.data.values,template.fields)}.forEach{field->key(field.key){DynamicListingField(field,s.data.values[field.key],s.media,enabled,s.errors["values.${field.key}"]){vm.field(field.key,it)}}}}
                        ListingText("Mô tả chi tiết *",s.data.description,{value->vm.change{it.copy(description=value)}},enabled,s.errors["description"],multiline=true,maxLength=10000)
                    }
                    2->Column(verticalArrangement=Arrangement.spacedBy(10.dp)){
                        Text("Ảnh đầu tiên là ảnh bìa. Tối đa 20 ảnh và 3 video.")
                        Row{Checkbox(checked=square,onCheckedChange={square=it},enabled=enabled);Text("Cắt ảnh vuông từ tâm khi tải lên",Modifier.padding(top=12.dp))}
                        Text("Ảnh JPG/PNG/WebP tối đa 10 MB; tự nén. Video MP4/WebM tối đa 50 MB.",style=MaterialTheme.typography.bodySmall)
                        OutlinedButton(onClick={imagePicker.launch("image/*")},enabled=enabled&&s.data.images.size<20,modifier=Modifier.fillMaxWidth()){Text("Thêm ảnh (${s.data.images.size}/20)")}
                        OutlinedButton(onClick={videoPicker.launch("video/*")},enabled=enabled&&s.data.videos.size<3,modifier=Modifier.fillMaxWidth()){Text("Thêm video (${s.data.videos.size}/3)")}
                        listOf("images" to s.data.images,"videos" to s.data.videos).forEach{(kind,ids)->LazyRow(horizontalArrangement=Arrangement.spacedBy(10.dp)){items(ids,key={it}){id->s.media.find{it.id==id}?.let{item->Column(Modifier.width(156.dp)){
                            if(kind=="images")AsyncImage(item.url,"Ảnh sản phẩm",Modifier.size(156.dp),contentScale=ContentScale.Crop)
                            Text(if(kind=="images"&&ids.first()==id)"Ảnh bìa" else if(kind=="videos")"Video ${ids.indexOf(id)+1}" else "Ảnh ${ids.indexOf(id)+1}")
                            TextButton(onClick={preview=item}){Text("Xem")}
                            Row{TextButton(onClick={vm.move(kind,id,-1)},enabled=enabled&&ids.indexOf(id)>0){Text("←")};TextButton(onClick={vm.move(kind,id,1)},enabled=enabled&&ids.indexOf(id)<ids.size-1){Text("→")}}
                            TextButton(onClick={vm.remove(item)},enabled=enabled){Text("Bỏ tệp")}
                        }}}}}
                        s.template?.let{template->template.fields.filter{it.type in listOf("image","video")&&ListingRules.visible(it,s.data.values,template.fields)}.forEach{field->DynamicListingField(field,s.data.values[field.key],s.media.filter{it.id in s.data.images+s.data.videos},enabled,s.errors["values.${field.key}"]){vm.field(field.key,it)}}}
                        val unused=s.media.filter{it.id !in s.data.images+s.data.videos}
                        if(unused.isNotEmpty())Text("Tệp đã tải nhưng chưa dùng",style=MaterialTheme.typography.titleMedium)
                        unused.forEach{item->Row{TextButton(onClick={preview=item}){Text("Xem tệp")};TextButton(onClick={vm.recover(item)},enabled=enabled){Text("Khôi phục")};TextButton(onClick={vm.remove(item)},enabled=enabled){Text("Xóa")}}}
                    }
                    3->Column(verticalArrangement=Arrangement.spacedBy(12.dp)){
                        ListingChoice("Cách tính giá *",s.data.priceMode,s.template?.config?.priceModes.orEmpty().map{FieldOption(it,ListingRules.prices[it]?:it)},enabled){value->vm.change{it.copy(priceMode=value)}}
                        if(s.data.priceMode !in listOf("FREE","CONTACT"))ListingText("Giá VND *",s.data.price,{value->vm.change{it.copy(price=value.filter(Char::isDigit))}},enabled,s.errors["price"],type=KeyboardType.Number,maxLength=13)
                        Text(ListingRules.price(s.data),color=MaterialTheme.colorScheme.primary)
                        Row{Checkbox(s.data.negotiable,{value->vm.change{it.copy(negotiable=value)}},enabled=enabled);Text("Có thể thương lượng",Modifier.padding(top=12.dp))}
                        val location=s.data.location
                        ListingText("Tỉnh / Thành phố *",location.province,{value->vm.change{it.copy(location=it.location.copy(province=value))}},enabled,s.errors["location.province"],maxLength=100)
                        ListingText("Quận / Huyện (nếu có)",location.district,{value->vm.change{it.copy(location=it.location.copy(district=value))}},enabled,maxLength=100)
                        ListingText("Phường / Xã *",location.ward,{value->vm.change{it.copy(location=it.location.copy(ward=value))}},enabled,s.errors["location.ward"],maxLength=100)
                        ListingText("Địa chỉ cụ thể",location.address,{value->vm.change{it.copy(location=it.location.copy(address=value))}},enabled,maxLength=300)
                        Row{Checkbox(location.hideExact,{value->vm.change{it.copy(location=it.location.copy(hideExact=value))}},enabled=enabled);Text("Ẩn địa chỉ cụ thể và tọa độ với người xem tin",Modifier.padding(top=8.dp))}
                        OutlinedButton(onClick={mapDialog=true},enabled=enabled,modifier=Modifier.fillMaxWidth()){Text("Chọn vị trí trên bản đồ")}
                        if(location.latitude!=null){Text("Ghim: ${location.latitude}, ${location.longitude}",style=MaterialTheme.typography.bodySmall);TextButton(onClick={vm.change{it.copy(location=it.location.copy(latitude=null,longitude=null))}},enabled=enabled){Text("Xóa vị trí ghim")}}
                        ManualPoint(location,enabled){lat,lng->vm.change{it.copy(location=it.location.copy(latitude=lat,longitude=lng))}}
                        Text("Ghim không tự điền địa chỉ. Hãy kiểm tra lại tỉnh/thành và phường/xã.",style=MaterialTheme.typography.bodySmall)
                    }
                    4->Column(verticalArrangement=Arrangement.spacedBy(12.dp)){
                        Text("Tên và điện thoại được hiển thị trong tin. Email không công khai.")
                        ListingText("Tên liên hệ *",s.data.contact.name,{value->vm.change{it.copy(contact=it.contact.copy(name=value))}},enabled,s.errors["contact.name"],maxLength=120)
                        ListingText("Số điện thoại *",s.data.contact.phone,{value->vm.change{it.copy(contact=it.contact.copy(phone=value))}},enabled,s.errors["contact.phone"],type=KeyboardType.Phone,maxLength=13)
                        ListingText("Email (không bắt buộc)",s.data.contact.email,{value->vm.change{it.copy(contact=it.contact.copy(email=value))}},enabled,s.errors["contact.email"],type=KeyboardType.Email,maxLength=254)
                    }
                    5->Column(verticalArrangement=Arrangement.spacedBy(12.dp)){
                        Text("Đây là thông tin người mua sẽ thấy. Kiểm tra trước khi đăng.")
                        LazyRow(horizontalArrangement=Arrangement.spacedBy(8.dp)){items(s.data.images,key={it}){id->s.media.find{it.id==id}?.let{AsyncImage(it.url,"Ảnh xem trước",Modifier.size(190.dp),contentScale=ContentScale.Crop)}}}
                        Text(s.data.title,style=MaterialTheme.typography.titleLarge);Text(ListingRules.price(s.data),style=MaterialTheme.typography.titleLarge,color=MaterialTheme.colorScheme.primary)
                        Text(listOfNotNull(s.data.location.address.takeIf{!s.data.location.hideExact},s.data.location.ward,s.data.location.district,s.data.location.province).filter{it.isNotBlank()}.joinToString(", "))
                        Text(s.data.description)
                        s.template?.let{template->template.fields.filter{ListingRules.visible(it,s.data.values,template.fields)&&!ListingRules.blank(s.data.values[it.key])&&it.type !in listOf("image","video")}.forEach{field->Text("${field.label}: ${ListingRules.display(field,s.data.values[field.key])} ${field.config.unit.orEmpty()}")}}
                        s.data.videos.forEach{id->s.media.find{it.id==id}?.let{item->TextButton(onClick={preview=item}){Text("Xem video")}}}
                        Text("Liên hệ: ${s.data.contact.name} · ${s.data.contact.phone}")
                    }
                    6->Column(verticalArrangement=Arrangement.spacedBy(16.dp)){
                        Text("Đăng tin thành công!",style=MaterialTheme.typography.headlineMedium,color=MaterialTheme.colorScheme.primary)
                        Button(onClick=onMyListings,modifier=Modifier.fillMaxWidth()){Text("Xem tin đăng của tôi")}
                        OutlinedButton(onClick=vm::newListing,enabled=!s.busy,modifier=Modifier.fillMaxWidth()){Text("Đăng tin mới")}
                    }
                }
            }
        }
        if(s.step<6){Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){TextButton(onClick=vm::back,enabled=!s.busy&&s.step>0){Text("Quay lại")};if(s.draft!=null)TextButton(onClick=vm::save,enabled=enabled){Text("Lưu nháp")};Button(onClick=vm::next,enabled=enabled&&(s.step!=0||s.template!=null)){Text(if(s.busy)"Đang xử lý…" else if(s.step==5)"Đăng tin" else "Tiếp tục")}}}
        TextButton(onClick={vm.saveAndLeave(onMyListings)},enabled=enabled&&!s.saving,modifier=Modifier.fillMaxWidth()){Text("Tin đăng của tôi")}
    }
    if(reloadDialog)AlertDialog(onDismissRequest={reloadDialog=false},title={Text("Tải bản nháp từ máy chủ?")},text={Text("Các thay đổi chưa lưu ở màn hình này sẽ được thay bằng bản đã lưu trên máy chủ.")},confirmButton={TextButton(onClick={reloadDialog=false;vm.reload()}){Text("Tải lại")}},dismissButton={TextButton(onClick={reloadDialog=false}){Text("Hủy")}})
    if(newDialog)AlertDialog(onDismissRequest={newDialog=false},title={Text("Tạo tin mới?")},text={Text("Tin hiện tại sẽ được lưu nháp, không bị xóa.")},confirmButton={TextButton(onClick={newDialog=false;vm.newListing()}){Text("Tiếp tục")}},dismissButton={TextButton(onClick={newDialog=false}){Text("Hủy")}})
    if(mapDialog)ListingMapDialog(s.data.location.latitude,s.data.location.longitude,{mapDialog=false}){lat,lng->mapDialog=false;vm.change{it.copy(location=it.location.copy(latitude=lat,longitude=lng))}}
    preview?.let{item->MediaPreview(item){preview=null}}
}

@Composable private fun ManualPoint(location:ListingLocation,enabled:Boolean,onApply:(Double,Double)->Unit){
    var expanded by remember{mutableStateOf(false)}
    var latitude by remember(location.latitude){mutableStateOf(location.latitude?.toString().orEmpty())}
    var longitude by remember(location.longitude){mutableStateOf(location.longitude?.toString().orEmpty())}
    var error by remember{mutableStateOf<String?>(null)}
    TextButton(onClick={expanded=!expanded},enabled=enabled){Text("Nhập tọa độ thủ công")}
    if(expanded){ListingText("Vĩ độ (-85 đến 85)",latitude,{latitude=it},enabled,type=KeyboardType.Decimal);ListingText("Kinh độ (-180 đến 180)",longitude,{longitude=it},enabled,type=KeyboardType.Decimal);error?.let{Text(it,color=MaterialTheme.colorScheme.error)};OutlinedButton(enabled=enabled,onClick={val lat=latitude.toDoubleOrNull();val lng=longitude.toDoubleOrNull();if(ListingRules.validPoint(lat,lng)){error=null;onApply(lat!!,lng!!)}else error="Tọa độ không hợp lệ."}){Text("Áp dụng tọa độ")}}
}
@Composable private fun MediaPreview(media:ListingMedia,onDismiss:()->Unit){
    var video by remember{mutableStateOf<VideoView?>(null)}
    DisposableEffect(Unit){onDispose{video?.stopPlayback()}}
    Dialog(onDismissRequest=onDismiss){Surface(shape=MaterialTheme.shapes.large){Column(Modifier.padding(16.dp)){
        if(media.kind=="images")AsyncImage(media.url,"Ảnh sản phẩm",Modifier.fillMaxWidth().height(360.dp),contentScale=ContentScale.Fit)
        else AndroidView(factory={context->VideoView(context).apply{video=this;setMediaController(MediaController(context).also{it.setAnchorView(this)});setVideoURI(Uri.parse(media.url));setOnPreparedListener{start()}}},modifier=Modifier.fillMaxWidth().height(300.dp))
        TextButton(onClick=onDismiss){Text("Đóng")}
    }}}
}
