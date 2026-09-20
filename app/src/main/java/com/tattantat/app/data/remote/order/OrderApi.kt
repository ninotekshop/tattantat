package com.tattantat.app.data.remote.order

import com.tattantat.app.data.remote.auth.ApiEnvelope
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query
import retrofit2.http.Path

interface OrderApi {
    @GET("orders") suspend fun list(): ApiEnvelope<List<OrderSummaryPayload>>
    @POST("orders/{id}/status") suspend fun updateStatus(@Path("id") id:String, @Body request: OrderStatusRequest): ApiEnvelope<OrderSummaryPayload>
    @POST("orders/{id}/complete") suspend fun complete(@Path("id") id:String): ApiEnvelope<CompleteOrderPayload>
    @GET("orders/{id}/price") suspend fun price(@Path("id") id:String): ApiEnvelope<OrderFinancialSnapshotPayload>
    @GET("orders/{id}/refunds") suspend fun refunds(@Path("id") id:String): ApiEnvelope<List<RefundPayload>>
    @POST("orders/{id}/refund") suspend fun refund(@Path("id") id:String, @Header("Idempotency-Key") idempotencyKey: String, @Body request: RefundRequest): ApiEnvelope<RefundPayload>
    @POST("orders/{id}/review") suspend fun review(@Path("id") id: String, @Body request: CreateReviewRequest): ApiEnvelope<ReviewPayload>
    @GET("pricing/order-preview") suspend fun preview(@Query("productId") productId: String, @Query("quantity") quantity:Int): ApiEnvelope<OrderPricePayload>
    @POST("orders") suspend fun create(@Header("Idempotency-Key") idempotencyKey: String, @Body request: CreateOrderRequest): ApiEnvelope<CreatedOrderPayload>
    @POST("payments") suspend fun createCodPayment(@Header("Idempotency-Key") idempotencyKey: String, @Body request: CreatePaymentRequest): ApiEnvelope<PaymentPayload>
}
data class CreateOrderRequest(val productId: String, val quantity: Int = 1)
data class CreatePaymentRequest(val orderId: String, val method: String = "COD")
data class OrderPricePayload(val subtotal: String, val discountAmount: String, val shippingFee: String, val paymentFee: String, val platformFee: String, val buyerTotal: String, val sellerPayout: String, val currency: String)
data class CreatedOrderPayload(val id: String, val orderCode: String, val price: OrderPricePayload)
data class PaymentPayload(val id: String, val status: String)
data class OrderStatusRequest(val status:String)
data class CompleteOrderPayload(val id:String,val orderStatus:String)
data class OrderSummaryPayload(val id: String, val order_code: String, val buyer_id:String, val seller_id:String, val total_amount: String, val order_status: String, val payment_status: String, val created_at: String, val review_id: String? = null)
data class OrderFinancialSnapshotPayload(val pricingVersionId:String?, val platformFeeRateBps:Int, val subtotal:String, val discount:String, val shippingFee:String, val paymentFee:String, val platformFee:String, val buyerTotal:String, val sellerPayout:String, val currency:String)
data class RefundRequest(val amount: String? = null, val reason: String? = null)
data class RefundPayload(val id:String, val orderId:String, val paymentId:String?, val requestedBy:String, val processedBy:String?, val type:String, val amount:String, val currency:String, val reason:String?, val status:String, val requestedAt:String, val processedAt:String?)
data class CreateReviewRequest(val rating: Int, val comment: String? = null)
data class ReviewPayload(val id: String, val order_id: String, val rating: Int, val comment: String?, val created_at: String)
