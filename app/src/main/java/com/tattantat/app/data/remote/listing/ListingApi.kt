package com.tattantat.app.data.remote.listing

import com.tattantat.app.data.remote.auth.ApiEnvelope
import okhttp3.MultipartBody
import retrofit2.http.*

interface ListingApi {
    @GET("listing-categories") suspend fun categories(): ApiEnvelope<List<ListingCategory>>
    @GET("listing-templates/{category}") suspend fun template(@Path("category") category: String): ApiEnvelope<ListingTemplate>
    @GET("listings/mine") suspend fun mine(): ApiEnvelope<List<ListingSummary>>
    @GET("listings/by-product/{id}") suspend fun byProduct(@Path("id") id: String): ApiEnvelope<ListingLink>
    @POST("listings/draft") suspend fun create(@Body request: CreateDraft): ApiEnvelope<ListingDraft>
    @GET("listings/{id}") suspend fun draft(@Path("id") id: String): ApiEnvelope<ListingDraft>
    @PUT("listings/{id}") suspend fun save(@Path("id") id: String, @Body request: SaveDraft): ApiEnvelope<SavedDraft>
    @POST("listings/{id}/publish") suspend fun publish(@Path("id") id: String, @Header("Idempotency-Key") key: String, @Body request: PublishDraft): ApiEnvelope<PublishedDraft>
    @Multipart @POST("listings/{id}/{kind}") suspend fun upload(@Path("id") id: String, @Path("kind") kind: String, @Part file: MultipartBody.Part): ApiEnvelope<ListingMedia>
    @DELETE("listings/{id}/media/{media}") suspend fun removeMedia(@Path("id") id: String, @Path("media") media: String): ApiEnvelope<Map<String,String>>
}
data class ListingCategory(val id:String,val parentId:String?=null,val name:String,val slug:String,val isGroup:Boolean=false)
data class ListingLink(val listingId:String?=null)
data class FieldOption(val value:String,val label:String)
data class VisibilityRule(val field:String,val operator:String,val value:Any?)
data class FieldConfig(val min:Double?=null,val max:Double?=null,val minLength:Int?=null,val maxLength:Int?=null,val unit:String?=null,val placeholder:String?=null,val help:String?=null,val visibleWhen:VisibilityRule?=null)
data class ListingField(val key:String,val label:String,val type:String,val required:Boolean=false,val enabled:Boolean=true,val options:List<FieldOption> = emptyList(),val config:FieldConfig=FieldConfig())
data class TemplateConfig(val priceModes:List<String>)
data class ListingTemplate(val id:String,val categoryId:String,val version:Int,val name:String,val fields:List<ListingField>,val config:TemplateConfig)
data class ListingLocation(val province:String="",val district:String="",val ward:String="",val address:String="",val hideExact:Boolean=true,val latitude:Double?=null,val longitude:Double?=null)
data class ListingContact(val name:String="",val phone:String="",val email:String="")
data class ListingFormData(val title:String="",val description:String="",val condition:String="USED_GOOD",val priceMode:String="FIXED",val price:String="",val negotiable:Boolean=false,val location:ListingLocation=ListingLocation(),val contact:ListingContact=ListingContact(),val values:Map<String,Any?> = emptyMap(),val images:List<String> = emptyList(),val videos:List<String> = emptyList())
data class ListingMedia(val id:String,val kind:String,val url:String)
data class ListingDraft(val id:String,val categoryId:String,val revision:Int,val status:String,val productId:String?=null,val template:ListingTemplate,val data:ListingFormData,val media:List<ListingMedia>,val owner:Boolean)
data class ListingSummary(val id:String,val categoryId:String,val title:String?=null,val status:String,val revision:Int,val productId:String?=null,val updatedAt:String)
data class CreateDraft(val categoryId:String,val clientKey:String)
data class SaveDraft(val revision:Int,val data:ListingFormData)
data class SavedDraft(val id:String,val revision:Int)
data class PublishDraft(val revision:Int)
data class PublishedDraft(val id:String,val productId:String,val status:String)
