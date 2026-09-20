package com.tattantat.app.presentation.sell.dynamic

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.tattantat.app.data.remote.listing.*

@Composable
fun ListingText(label:String,value:String,onChange:(String)->Unit,enabled:Boolean=true,error:String?=null,multiline:Boolean=false,type:KeyboardType=KeyboardType.Text,maxLength:Int=2000){
    OutlinedTextField(value=value,onValueChange={if(it.length<=maxLength)onChange(it)},label={Text(label)},modifier=Modifier.fillMaxWidth(),enabled=enabled,isError=error!=null,supportingText=error?.let{{Text(it)}},singleLine=!multiline,minLines=if(multiline)4 else 1,keyboardOptions=KeyboardOptions(keyboardType=type))
}
@Composable
fun ListingChoice(label:String,value:String,options:List<FieldOption>,enabled:Boolean,onChange:(String)->Unit){
    var choosing by remember{mutableStateOf(false)}
    OutlinedButton(onClick={choosing=true},enabled=enabled,modifier=Modifier.fillMaxWidth()){Text("$label: ${options.find{it.value==value}?.label?:"Chọn"}")}
    if(choosing)AlertDialog(onDismissRequest={choosing=false},title={Text(label)},text={Column(Modifier.heightIn(max=420.dp).verticalScroll(rememberScrollState())){
        TextButton(onClick={onChange("");choosing=false},modifier=Modifier.fillMaxWidth()){Text("Bỏ chọn")}
        options.forEach{option->TextButton(onClick={onChange(option.value);choosing=false},modifier=Modifier.fillMaxWidth()){Text(option.label)}}
    }},confirmButton={TextButton(onClick={choosing=false}){Text("Đóng")}})
}
@Composable
fun DynamicListingField(field:ListingField,value:Any?,media:List<ListingMedia>,enabled:Boolean,error:String?,onChange:(Any?)->Unit){
    Column(Modifier.fillMaxWidth(),verticalArrangement=Arrangement.spacedBy(4.dp)){
        val label=field.label+(if(field.required)" *" else "")+(field.config.unit?.takeIf{it.isNotBlank()}?.let{" ($it)"}?:"")
        when(field.type){
            "boolean","checkbox"->{Text(label);Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){
                FilterChip(selected=value==true,onClick={onChange(true)},enabled=enabled,label={Text("Có")})
                FilterChip(selected=value==false,onClick={onChange(false)},enabled=enabled,label={Text("Không")})
                if(!field.required&&value!=null)TextButton(onClick={onChange(null)},enabled=enabled){Text("Bỏ chọn")}
            }}
            "select","image","video"->{val options=if(field.type=="select")field.options else media.filter{it.kind==if(field.type=="image")"images" else "videos"}.mapIndexed{index,item->FieldOption(item.id,"${if(field.type=="image")"Ảnh" else "Video"} ${index+1}")};ListingChoice(label,value as? String?:"",options,enabled){onChange(it)}}
            "radio","multi-select"->{Text(label,style=MaterialTheme.typography.labelLarge);field.options.forEach{option->Row(Modifier.fillMaxWidth()){
                if(field.type=="radio")RadioButton(selected=value==option.value,onClick={onChange(option.value)},enabled=enabled)
                else Checkbox(checked=(value as? List<*>)?.contains(option.value)==true,onCheckedChange={selected->val previous=(value as? List<*>)?.filterIsInstance<String>()?:emptyList();onChange(if(selected)(previous+option.value).distinct() else previous-option.value)},enabled=enabled)
                Text(option.label,Modifier.padding(top=12.dp))
            }}}
            "range"->{Text(label);val min=(field.config.min?:0.0).toFloat();val max=(field.config.max?:100.0).toFloat();if(max>min)Slider(value=((value as? Number)?.toFloat()?:min).coerceIn(min,max),onValueChange={onChange(it.toDouble())},valueRange=min..max,enabled=enabled);Text(ListingRules.display(field,value))}
            else->{
                val numeric=field.type in listOf("number","year")
                var input by remember(field.key){mutableStateOf(ListingRules.display(field,value))}
                LaunchedEffect(value){if(!numeric||input.toDoubleOrNull()!=(value as? Number)?.toDouble())input=ListingRules.display(field,value)}
                ListingText(label+(if(field.type=="date")" (YYYY-MM-DD)" else ""),if(numeric)input else ListingRules.display(field,value),{raw->input=raw;onChange(if(numeric&&raw.isNotBlank())raw.toDoubleOrNull()?:raw else raw)},enabled,error,field.type=="textarea",if(numeric||field.type=="currency")KeyboardType.Decimal else KeyboardType.Text,if(field.type=="currency")13 else field.config.maxLength?:2000)
            }
        }
        if(field.type in listOf("boolean","checkbox","select","image","video","radio","multi-select","range")&&error!=null)Text(error,color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodySmall)
        field.config.help?.takeIf{it.isNotBlank()}?.let{Text(it,style=MaterialTheme.typography.bodySmall)}
    }
}
