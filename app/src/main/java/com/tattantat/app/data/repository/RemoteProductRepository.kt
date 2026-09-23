package com.tattantat.app.data.repository

import com.tattantat.app.data.remote.product.ProductApi
import com.tattantat.app.data.remote.product.ProductItemPayload
import com.tattantat.app.data.remote.product.UpdateListingVisibilityRequest
import com.tattantat.app.data.remote.product.UpdateProductRequest
import com.tattantat.app.domain.product.Product
import com.tattantat.app.domain.product.ProductRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.text.NumberFormat
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton
import android.content.Context
import android.net.Uri
import dagger.hilt.android.qualifiers.ApplicationContext
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.HttpUrl.Companion.toHttpUrl
import com.tattantat.app.BuildConfig

@Singleton
class RemoteProductRepository @Inject constructor(private val api: ProductApi, @ApplicationContext private val context: Context) : ProductRepository {
    suspend fun mine(): List<Product> = api.mine().data.orEmpty().map { it.toDomain() }
    suspend fun favorites(): List<Product> = api.favorites().data.orEmpty().map { it.toDomain() }
    suspend fun toggleFavorite(id:String, saved:Boolean) { if(saved) api.unfavorite(id) else api.favorite(id) }
    suspend fun categories() = api.categories().data.orEmpty()
    suspend fun create(title: String, price: Long, description: String, images: List<Uri>, categoryId: Long, condition: String): Result<String> = runCatching {
        val keys = images.map { uri ->
            val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: error("Không đọc được ảnh")
            val mime = context.contentResolver.getType(uri) ?: "image/jpeg"
            val part = MultipartBody.Part.createFormData("file", "product.jpg", bytes.toRequestBody(mime.toMediaType()))
            api.uploadImage(part).data?.key ?: error("Không tải được ảnh")
        }
        api.create(com.tattantat.app.data.remote.product.CreateProductRequest(title, price, categoryId, condition, description, keys)).data?.id ?: error("Không thể tạo tin")
    }
    suspend fun setListingVisibility(id: String, status: String) {
        api.setListingVisibility(id, UpdateListingVisibilityRequest(status))
    }
suspend fun updateListing(id:String,title:String,price:Long,description:String,condition:String,categoryId:Long?,images: List<Uri> = emptyList()) = run {
        val keys=images.map{uri->val bytes=context.contentResolver.openInputStream(uri)?.use{it.readBytes()}?:error("Không đọc được ảnh");val mime=context.contentResolver.getType(uri)?:"image/jpeg";api.uploadImage(MultipartBody.Part.createFormData("file","product.jpg",bytes.toRequestBody(mime.toMediaType()))).data?.key?:error("Không tải được ảnh")}
        api.update(id, UpdateProductRequest(title,price,description,condition,categoryId,keys.takeIf{it.isNotEmpty()})).data?.toDomain() ?: error("Không thể cập nhật tin đăng")
    }
    override fun observeProducts(query: String, categoryId: Long?): Flow<List<Product>> = flow { emit(api.list(query.ifBlank { null }, categoryId).data.orEmpty().map { it.toDomain() }) }
    override fun observeProduct(id: String): Flow<Product?> = flow { emit(api.detail(id).data?.toDomain()) }
    private fun ProductItemPayload.toDomain(): Product {
        val displayPrice = when (priceMode) {
            "CONTACT" -> "Liên hệ"
            "FREE" -> "Cho tặng miễn phí"
            else -> {
                val exact = runCatching { price.toBigDecimal().toBigIntegerExact() }.getOrNull()
                val suffix = when (priceMode) { "HOUR" -> "/giờ"; "DAY" -> "/ngày"; "MONTH" -> "/tháng"; "M2" -> "/m²"; else -> "" }
                exact?.let { NumberFormat.getNumberInstance(Locale("vi", "VN")).format(it) + " đ" + suffix } ?: "Giá đang cập nhật"
            }
        }
        val resolvedImage = if (imageUrl.startsWith("/")) BuildConfig.API_BASE_URL.toHttpUrl().resolve(imageUrl)?.toString().orEmpty() else imageUrl
        val resolvedImages = if (images.isNotEmpty()) {
            images.map { img -> if (img.startsWith("/")) BuildConfig.API_BASE_URL.toHttpUrl().resolve(img)?.toString().orEmpty() else img }
        } else {
            listOf(resolvedImage)
        }
        val formattedDate = formatPostedDateOnly(postedAt)
        return Product(id, title, displayPrice, location, formattedDate, sellerName, resolvedImage, description = description, condition = condition, status = status, sellerId = sellerId, categoryId = categoryId, images = resolvedImages)
    }

    private fun formatPostedDateOnly(rawDate: String): String {
        if (rawDate.isBlank()) return ""
        if (rawDate.contains("T")) {
            val datePart = rawDate.substringBefore("T")
            val parts = datePart.split("-")
            if (parts.size == 3) return "${parts[2]}/${parts[1]}/${parts[0]}"
            return datePart
        }
        val parts = rawDate.trim().split(" ")
        for (part in parts) {
            if (part.contains("/") || (part.contains("-") && part.length >= 8)) {
                if (part.contains("-")) {
                    val subParts = part.split("-")
                    if (subParts.size == 3 && subParts[0].length == 4) return "${subParts[2]}/${subParts[1]}/${subParts[0]}"
                }
                return part
            }
        }
        return rawDate.substringBefore(" ")
    }
}
