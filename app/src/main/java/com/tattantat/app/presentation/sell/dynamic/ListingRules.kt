package com.tattantat.app.presentation.sell.dynamic

import com.tattantat.app.data.remote.listing.*
import java.math.BigInteger
import java.text.NumberFormat
import java.time.LocalDate
import java.util.Locale

object ListingRules {
    val conditions=linkedMapOf("NEW" to "Mới","LIKE_NEW" to "Như mới","USED_GOOD" to "Đã dùng, còn tốt","USED_FAIR" to "Đã dùng, có hao mòn","FOR_PARTS" to "Cần sửa / lấy linh kiện")
    val prices=linkedMapOf("FIXED" to "Giá cố định","CONTACT" to "Liên hệ","FREE" to "Cho tặng miễn phí","HOUR" to "Theo giờ","DAY" to "Theo ngày","MONTH" to "Theo tháng","M2" to "Theo m²")
    fun blank(value:Any?)=value==null||value==""||(value is List<*>&&value.isEmpty())
    private fun equal(a:Any?,b:Any?)=if(a is Number&&b is Number)a.toDouble()==b.toDouble() else a==b
    fun visible(field:ListingField,values:Map<String,Any?>,fields:List<ListingField>,seen:Set<String> = emptySet()):Boolean {
        if(!field.enabled||field.key in seen)return false
        val rule=field.config.visibleWhen?:return true
        val parent=fields.find{it.key==rule.field}?:return false
        if(!visible(parent,values,fields,seen+field.key))return false
        val value=values[rule.field]
        return when(rule.operator){"eq"->equal(value,rule.value);"ne"->!blank(value)&&!equal(value,rule.value);"in"->(rule.value as? List<*>)?.any{equal(value,it)}==true;else->false}
    }
    fun validPoint(latitude:Double?,longitude:Double?)=latitude!=null&&longitude!=null&&latitude.isFinite()&&longitude.isFinite()&&latitude in -85.0..85.0&&longitude in -180.0..180.0
    fun price(data:ListingFormData):String {
        if(data.priceMode in listOf("CONTACT","FREE"))return prices[data.priceMode].orEmpty()
        val amount=if(data.price.matches(Regex("[0-9]{1,13}")))BigInteger(data.price) else return "Chưa có giá"
        return NumberFormat.getIntegerInstance(Locale("vi","VN")).format(amount)+" đ"+when(data.priceMode){"HOUR"->"/giờ";"DAY"->"/ngày";"MONTH"->"/tháng";"M2"->"/m²";else->""}
    }
    fun display(field:ListingField,value:Any?):String {
        if(value is Boolean)return if(value)"Có" else "Không"
        if(value is List<*>)return value.joinToString(", "){v->field.options.find{it.value==v}?.label?:v.toString()}
        if(value is Number&&value.toDouble()%1==0.0)return value.toLong().toString()
        return field.options.find{it.value==value}?.label?:value?.toString().orEmpty()
    }
    /** UX checks only; the server revalidates the pinned template before publication. */
    fun errors(data:ListingFormData,template:ListingTemplate,step:Int):Map<String,String> {
        val errors=linkedMapOf<String,String>()
        fun required(key:String,value:String,label:String,max:Int){if(value.isBlank()||value.length>max)errors[key]="Vui lòng nhập $label hợp lệ (tối đa $max ký tự)."}
        if(step==1||step==5){
            required("title",data.title,"tiêu đề",200);required("description",data.description,"mô tả",10000)
            if(data.condition !in conditions)errors["condition"]="Chọn tình trạng hợp lệ."
        }
        if(step in listOf(1,2,5))for(field in template.fields){
            if(!visible(field,data.values,template.fields))continue
            val isMedia=field.type in listOf("image","video")
            if(step==1&&isMedia||step==2&&!isMedia)continue
            val value=data.values[field.key];val key="values.${field.key}"
            if(blank(value)){if(field.required)errors[key]="Vui lòng nhập ${field.label}.";continue}
            val valid=when(field.type){
                "boolean","checkbox"->value is Boolean
                "select","radio"->field.options.any{it.value==value}
                "multi-select"->value is List<*>&&value.all{v->field.options.any{it.value==v}}
                "currency"->value is String&&value.matches(Regex("[0-9]{1,13}"))&&(field.config.min==null||value.toDouble()>=field.config.min)&&(field.config.max==null||value.toDouble()<=field.config.max)
                "number","range","year"->value is Number&&value.toDouble().isFinite()&&kotlin.math.abs(value.toDouble())<=1e13&&(field.config.min==null||value.toDouble()>=field.config.min)&&(field.config.max==null||value.toDouble()<=field.config.max)&&(field.type!="year"||(value.toDouble()%1==0.0&&value.toInt() in 1800..LocalDate.now().year+1))
                "date"->value is String&&runCatching{LocalDate.parse(value).toString()==value}.getOrDefault(false)
                "image"->value in data.images
                "video"->value in data.videos
                else->value is String&&value.length in (field.config.minLength?:0)..(field.config.maxLength?:2000)
            }
            if(!valid)errors[key]="${field.label} không hợp lệ."
        }
        if(step==2||step==5){if(data.images.isEmpty()||data.images.size>20)errors["images"]="Thêm từ 1 đến 20 ảnh.";if(data.videos.size>3)errors["videos"]="Tối đa 3 video."}
        if(step==3||step==5){
            if(data.priceMode !in template.config.priceModes)errors["priceMode"]="Chọn cách tính giá."
            if(data.priceMode !in listOf("CONTACT","FREE")&&!data.price.matches(Regex("[0-9]{1,13}")))errors["price"]="Giá phải là số nguyên VND, tối đa 13 chữ số."
            required("location.province",data.location.province,"tỉnh/thành",100);required("location.ward",data.location.ward,"phường/xã",100)
            if((data.location.latitude!=null||data.location.longitude!=null)&&!validPoint(data.location.latitude,data.location.longitude))errors["location"]="Hãy chọn đầy đủ tọa độ hợp lệ trên bản đồ."
        }
        if(step==4||step==5){required("contact.name",data.contact.name,"tên liên hệ",120);if(!data.contact.phone.matches(Regex("(0|\\+84)[0-9]{9}")))errors["contact.phone"]="Số điện thoại không hợp lệ.";if(data.contact.email.isNotBlank()&&!data.contact.email.matches(Regex("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")))errors["contact.email"]="Email không hợp lệ."}
        return errors
    }
}
