package com.tattantat.app.presentation.sell.dynamic

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import java.io.ByteArrayOutputStream

data class PreparedListingFile(val bytes:ByteArray,val mime:String,val name:String)
object ListingUpload {
    fun prepare(context:Context,uri:Uri,kind:String,square:Boolean):PreparedListingFile {
        val limit=(if(kind=="images")10 else 50)*1024*1024
        val mime=context.contentResolver.getType(uri)?:error("Không xác định được định dạng tệp.")
        check(mime in if(kind=="images")listOf("image/jpeg","image/png","image/webp") else listOf("video/mp4","video/webm")){"Chỉ hỗ trợ JPG, PNG, WebP, MP4 và WebM."}
        val bytes=context.contentResolver.openInputStream(uri)?.use{input->
            val output=ByteArrayOutputStream();val buffer=ByteArray(8192)
            while(true){val count=input.read(buffer);if(count<0)break;check(output.size()+count<=limit){"Tệp vượt giới hạn ${limit/1024/1024} MB."};output.write(buffer,0,count)}
            output.toByteArray()
        }?:error("Không đọc được tệp đã chọn.")
        check(bytes.isNotEmpty()){ "Tệp trống." }
        if(kind=="videos")return PreparedListingFile(bytes,mime,if(mime=="video/mp4")"video.mp4" else "video.webm")
        val bounds=BitmapFactory.Options().apply{inJustDecodeBounds=true};BitmapFactory.decodeByteArray(bytes,0,bytes.size,bounds)
        check(bounds.outWidth>0&&bounds.outHeight>0){"Ảnh không hợp lệ."}
        var sample=1;while(maxOf(bounds.outWidth,bounds.outHeight)/sample>1800)sample*=2
        val decoded=BitmapFactory.decodeByteArray(bytes,0,bytes.size,BitmapFactory.Options().apply{inSampleSize=sample})?:error("Không đọc được ảnh.")
        val orientation=runCatching{bytes.inputStream().use{ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION,ExifInterface.ORIENTATION_NORMAL)}}.getOrDefault(ExifInterface.ORIENTATION_NORMAL)
        val transform=Matrix().apply{when(orientation){
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL->setScale(-1f,1f)
            ExifInterface.ORIENTATION_ROTATE_180->setRotate(180f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL->setScale(1f,-1f)
            ExifInterface.ORIENTATION_TRANSPOSE->{setRotate(90f);postScale(-1f,1f)}
            ExifInterface.ORIENTATION_ROTATE_90->setRotate(90f)
            ExifInterface.ORIENTATION_TRANSVERSE->{setRotate(-90f);postScale(-1f,1f)}
            ExifInterface.ORIENTATION_ROTATE_270->setRotate(-90f)
        }}
        val bitmap=if(transform.isIdentity)decoded else try{Bitmap.createBitmap(decoded,0,0,decoded.width,decoded.height,transform,true)}finally{decoded.recycle()}
        try{
            val side=minOf(bitmap.width,bitmap.height)
            val cropped=if(square)Bitmap.createBitmap(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side) else bitmap
            try{val out=ByteArrayOutputStream();check(cropped.compress(Bitmap.CompressFormat.JPEG,85,out)){"Không thể nén ảnh."};return PreparedListingFile(out.toByteArray(),"image/jpeg","image.jpg")}
            finally{if(cropped!==bitmap)cropped.recycle()}
        }finally{bitmap.recycle()}
    }
}
