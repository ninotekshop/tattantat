package com.tattantat.app.presentation.sell.dynamic

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.location.LocationManager
import android.net.Uri
import android.webkit.*
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
import androidx.core.os.CancellationSignal
import com.tattantat.app.BuildConfig
import org.json.JSONObject
import java.io.ByteArrayInputStream

/** Local scripts only, HTTPS tiles only, no JavaScript/native bridge or auth tokens. */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun ListingMapDialog(latitude:Double?,longitude:Double?,onDismiss:()->Unit,onSelect:(Double,Double)->Unit){
    val context=LocalContext.current
    var web by remember{mutableStateOf<WebView?>(null)}
    var ready by remember{mutableStateOf(false)}
    var error by remember{mutableStateOf<String?>(null)}
    var locating by remember{mutableStateOf(false)}
    var gpsCancel by remember{mutableStateOf<CancellationSignal?>(null)}
    val currentSelect by rememberUpdatedState(onSelect)
    fun gps(){
        if(ContextCompat.checkSelfPermission(context,Manifest.permission.ACCESS_COARSE_LOCATION)!=PackageManager.PERMISSION_GRANTED){error="Bạn chưa cấp quyền vị trí. Có thể chạm vào bản đồ để chọn.";return}
        val manager=context.getSystemService(LocationManager::class.java)
        val provider=listOf(LocationManager.NETWORK_PROVIDER,LocationManager.GPS_PROVIDER).firstOrNull{runCatching{manager.isProviderEnabled(it)}.getOrDefault(false)}
        if(provider==null){error="Hãy bật vị trí trên điện thoại hoặc ghim thủ công.";return}
        locating=true;error=null;gpsCancel?.cancel();val cancel=CancellationSignal();gpsCancel=cancel
        try{
            LocationManagerCompat.getCurrentLocation(manager,provider,cancel,ContextCompat.getMainExecutor(context)){location->
                locating=false
                if(location!=null&&ListingRules.validPoint(location.latitude,location.longitude))web?.evaluateJavascript("window.TatMap && window.TatMap.setPoint(${location.latitude},${location.longitude});",null)
                else error="Chưa xác định được vị trí. Hãy chọn thủ công trên bản đồ."
            }
        }catch(_:SecurityException){locating=false;error="Quyền vị trí chưa khả dụng. Hãy ghim thủ công."}
    }
    val permission=rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()){result->if(result.values.any{it})gps() else error="Không có quyền vị trí; bạn vẫn có thể ghim thủ công."}
    DisposableEffect(Unit){onDispose{gpsCancel?.cancel();web?.stopLoading();web?.destroy();web=null}}
    Dialog(onDismissRequest=onDismiss,properties=DialogProperties(usePlatformDefaultWidth=false)){
        Surface(Modifier.fillMaxSize().systemBarsPadding(),color=MaterialTheme.colorScheme.surface){Column(Modifier.fillMaxSize().padding(12.dp),verticalArrangement=Arrangement.spacedBy(8.dp)){
            Text("Chọn vị trí trên bản đồ",style=MaterialTheme.typography.titleLarge)
            Text("Chạm hoặc kéo ghim. Bản đồ dùng OpenStreetMap và cần Internet; khu vực đang xem được gửi để tải nền.",style=MaterialTheme.typography.bodySmall)
            AndroidView(modifier=Modifier.fillMaxWidth().weight(1f),factory={ctx->WebView(ctx).apply{
                web=this
                settings.javaScriptEnabled=true;settings.allowFileAccess=false;settings.allowContentAccess=false
                @Suppress("DEPRECATION") settings.setAllowFileAccessFromFileURLs(false)
                @Suppress("DEPRECATION") settings.setAllowUniversalAccessFromFileURLs(false)
                settings.mixedContentMode=WebSettings.MIXED_CONTENT_NEVER_ALLOW
                settings.userAgentString=settings.userAgentString+" TatTanTat/${BuildConfig.VERSION_NAME}"
                settings.cacheMode=WebSettings.LOAD_DEFAULT
                webViewClient=object:WebViewClient(){
                    override fun shouldInterceptRequest(view:WebView,request:WebResourceRequest):WebResourceResponse? {
                        val url=request.url
                        if(url.scheme=="https"&&url.host=="appassets.androidplatform.net"&&request.method=="GET"){
                            val name=url.path?.removePrefix("/map-picker/")
                            if(url.path=="/map-picker/$name"&&name in listOf("index.html","leaflet.js","leaflet.css","picker.js","picker.css")){
                                val type=when{name!!.endsWith(".html")->"text/html";name.endsWith(".css")->"text/css";else->"application/javascript"}
                                return WebResourceResponse(type,"UTF-8",ctx.assets.open("map-picker/$name"))
                            }
                        }
                        if(!request.isForMainFrame&&request.method=="GET"&&url.scheme=="https"&&url.host=="tile.openstreetmap.org"&&url.path.orEmpty().matches(Regex("/[0-9]+/[0-9]+/[0-9]+\\.png")))return null
                        return WebResourceResponse("text/plain","UTF-8",403,"Blocked",emptyMap(),ByteArrayInputStream(ByteArray(0)))
                    }
                    override fun shouldOverrideUrlLoading(view:WebView,request:WebResourceRequest):Boolean {
                        val url=request.url
                        if(request.hasGesture()&&url.scheme=="https"&&url.host=="www.openstreetmap.org")runCatching{ctx.startActivity(Intent(Intent.ACTION_VIEW,url))}
                        return true
                    }
                    override fun onPageFinished(view:WebView,url:String){ready=url.startsWith("https://appassets.androidplatform.net/map-picker/index.html")}
                }
                val hash=if(ListingRules.validPoint(latitude,longitude))"#lat=$latitude&lng=$longitude" else ""
                loadUrl("https://appassets.androidplatform.net/map-picker/index.html$hash")
            }})
            error?.let{Text(it,color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodySmall)}
            OutlinedButton(enabled=ready&&!locating,onClick={permission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION))}){Text(if(locating)"Đang lấy vị trí…" else "Lấy vị trí hiện tại")}
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){TextButton(onClick=onDismiss){Text("Hủy")};Button(enabled=ready,onClick={
                web?.evaluateJavascript("JSON.stringify(window.TatMap ? window.TatMap.selection() : null)"){raw->
                    val point=runCatching{val decoded=org.json.JSONTokener(raw).nextValue() as String;JSONObject(decoded)}.getOrNull()
                    val lat=point?.optDouble("latitude")
                    val lng=point?.optDouble("longitude")
                    if(ListingRules.validPoint(lat,lng))currentSelect(lat!!,lng!!) else error="Hãy chạm vào bản đồ hoặc chọn ghim tại tâm trước khi xác nhận."
                }
            }){Text("Dùng vị trí này")}}
        }}
    }
}
