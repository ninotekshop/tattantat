package com.tattantat.app.data.remote.admin

import com.tattantat.app.data.remote.auth.ApiEnvelope
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Body
import retrofit2.http.Query
import retrofit2.http.PATCH

interface AdminApi {
    @GET("admin/revenue") suspend fun revenue(@Query("from") from: String? = null, @Query("to") to: String? = null): ApiEnvelope<AdminRevenuePayload>
    @GET("admin/commercial/queue") suspend fun commercialQueue(@Query("status") status: String = "OPEN"): ApiEnvelope<List<CommercialQueuePayload>>
    @GET("admin/reconciliation") suspend fun reconciliation(): ApiEnvelope<ReconciliationPayload>
    @POST("promotions/orders/{id}/settle") suspend fun settlePromotion(@Path("id") id:String,@Header("Idempotency-Key") key:String): ApiEnvelope<SettlementPayload>
    @POST("subscriptions/orders/{id}/settle") suspend fun settleSubscription(@Path("id") id:String,@Header("Idempotency-Key") key:String): ApiEnvelope<SettlementPayload>
    @POST("advertising/campaigns/{id}/settle") suspend fun settleAdvertising(@Path("id") id:String,@Header("Idempotency-Key") key:String): ApiEnvelope<SettlementPayload>
    @GET("admin/payouts") suspend fun payouts(@Query("status") status:String?=null): ApiEnvelope<List<AdminPayoutPayload>>
    @POST("admin/payouts/{id}/status") suspend fun updatePayout(@Path("id") id:String,@Header("Idempotency-Key") key:String,@Body request:PayoutStatusRequest): ApiEnvelope<AdminPayoutPayload>
    @GET("admin/pricing-rules") suspend fun pricingRules(): ApiEnvelope<List<PricingRulePayload>>
    @POST("admin/pricing-rules/{code}/versions") suspend fun createPricingVersion(@Path("code") code:String,@Body request:PricingVersionRequest): ApiEnvelope<PricingVersionPayload>
    @GET("admin/promotion-packages") suspend fun promotionPackages(): ApiEnvelope<List<PromotionPackageAdminPayload>>
    @GET("admin/subscription-plans") suspend fun subscriptionPlans(): ApiEnvelope<List<SubscriptionPlanAdminPayload>>
    @POST("admin/promotion-packages/{id}/versions") suspend fun updatePromotionPackage(@Path("id") id:String,@Body request:PromotionVersionRequest): ApiEnvelope<VersionCreatedPayload>
    @POST("admin/subscription-plans/{id}/versions") suspend fun updateSubscriptionPlan(@Path("id") id:String,@Body request:SubscriptionVersionRequest): ApiEnvelope<VersionCreatedPayload>
    @POST("admin/promotion-packages") suspend fun createPromotionPackage(@Body request:CreatePromotionPackageRequest): ApiEnvelope<CreatedServicePayload>
    @POST("admin/subscription-plans") suspend fun createSubscriptionPlan(@Body request:CreateSubscriptionPlanRequest): ApiEnvelope<CreatedServicePayload>
    @GET("admin/orders/shipping/pending") suspend fun pendingShipping(): ApiEnvelope<List<ShippingPendingPayload>>
    @POST("admin/orders/{id}/shipping/settle") suspend fun settleShipping(@Path("id") id:String,@Header("Idempotency-Key") key:String,@Body request:ShippingSettlementRequest): ApiEnvelope<ShippingSettlementPayload>
    @GET("admin/orders/wallet/pending") suspend fun pendingWalletReleases(): ApiEnvelope<List<WalletReleasePendingPayload>>
    @POST("admin/orders/{id}/wallet/release") suspend fun releaseWallet(@Path("id") id:String,@Header("Idempotency-Key") key:String): ApiEnvelope<WalletReleasePayload>
    @GET("admin/transactions") suspend fun transactions(@Query("page") page:Int = 1, @Query("limit") limit:Int = 50, @Query("type") type:String? = null, @Query("from") from:String? = null, @Query("to") to:String? = null): ApiEnvelope<List<AdminTransactionPayload>>
    @GET("admin/financial-audit-logs") suspend fun auditLogs(@Query("limit") limit:Int = 100, @Query("entityType") entityType:String? = null): ApiEnvelope<List<FinancialAuditPayload>>
    @GET("admin/reports") suspend fun reports(@Query("status") status:String?=null): ApiEnvelope<List<AdminReportPayload>>
    @PATCH("admin/reports/{id}") suspend fun updateReport(@Path("id") id:String,@Body request:UpdateReportRequest): ApiEnvelope<AdminReportUpdatePayload>
    @POST("admin/reports/{id}/hide-product") suspend fun hideReportedProduct(@Path("id") id:String,@Body request:ModerationNoteRequest): ApiEnvelope<AdminReportUpdatePayload>
}

data class AdminRevenuePayload(val total_orders:Int=0,val gmv:String="0",val platform_revenue:String="0",val payment_processing_cost:String="0",val seller_payout:String="0",val promotion_revenue:String="0",val subscription_revenue:String="0",val advertising_revenue:String="0",val shipping_margin:String="0",val refund_volume:String="0",val net_revenue:String="0",val currency:String="VND")
data class CommercialQueuePayload(val id:String,val kind:String,val status:String,val seller_id:String,val seller_name:String,val amount:String,val currency:String,val created_at:String,val product_code:String,val product_name:String)
data class ReconciliationPayload(val balanced:Boolean,val checked:ReconciliationChecked?=null,val errors:List<ReconciliationError> = emptyList())
data class ReconciliationChecked(val finalized_transactions:Int=0,val total_debits:String="0",val total_credits:String="0")
data class ReconciliationError(val id:String,val type:String?,val order_id:String?,val entry_count:Int=0,val balance:String="0")
data class SettlementPayload(val id:String,val subscriptionId:String?=null)
data class AdminPayoutPayload(val id:String,val sellerName:String,val sellerEmail:String?,val sellerPhone:String?,val amount:String,val fee:String,val netAmount:String,val status:String,val requestedAt:String,val processedAt:String?,val failureReason:String?,val bankName:String?,val accountNumberLast4:String?)
data class PayoutStatusRequest(val status:String,val reason:String?=null)
data class PricingRulePayload(val id:String,val code:String,val kind:String,val currency:String,val status:String,val active_version_id:String?,val rate_bps:Int?,val fixed_amount:String?,val effective_from:String?,val effective_to:String?,val reason:String?)
data class PricingVersionRequest(val rateBps:Int,val reason:String)
data class PricingVersionPayload(val id:String,val rate_bps:Int,val effective_from:String)
data class PromotionPackageAdminPayload(val id:String,val code:String,val name:String,val status:String,val version_id:String?,val price:String?,val duration_hours:Int?,val promotion_type:String?,val reason:String?)
data class SubscriptionPlanAdminPayload(val id:String,val code:String,val name:String,val status:String,val version_id:String?,val price:String?,val billing_cycle:String?,val max_listings:Int?,val features:List<String>?,val reason:String?)
data class PromotionVersionRequest(val price:String,val durationHours:Int,val promotionType:String,val reason:String)
data class SubscriptionVersionRequest(val price:String,val billingCycle:String,val maxListings:Int?,val features:List<String>,val reason:String)
data class VersionCreatedPayload(val id:String)
data class CreatePromotionPackageRequest(val code:String,val name:String,val price:String,val durationHours:Int,val promotionType:String,val reason:String)
data class CreateSubscriptionPlanRequest(val code:String,val name:String,val price:String,val billingCycle:String,val maxListings:Int?,val features:List<String> = emptyList(),val reason:String)
data class CreatedServicePayload(val id:String,val versionId:String)
data class ShippingPendingPayload(val id:String,val order_code:String,val customer_fee:String,val completed_at:String?,val seller_name:String,val buyer_name:String)
data class ShippingSettlementRequest(val providerCost:String)
data class ShippingSettlementPayload(val id:String,val order_id:String,val customer_fee:String,val provider_cost:String,val platform_margin:String,val status:String)
data class WalletReleasePendingPayload(val id:String,val order_code:String,val amount:String,val seller_name:String,val completed_at:String?)
data class WalletReleasePayload(val orderId:String,val released:Boolean,val amount:String?=null,val currency:String?=null)
data class AdminTransactionPayload(val id:String, val type:String, val order_id:String?, val payment_id:String?, val reference_id:String?, val status:String, val created_at:String, val finalized_at:String?, val total_debit:String="0", val total_credit:String="0", val balance:String="0")
data class FinancialAuditPayload(val id:String, val actor_id:String?, val action:String, val entity_type:String, val entity_id:String, val old_value:Map<String, Any?>?, val new_value:Map<String, Any?>?, val reason:String?, val created_at:String)
data class AdminReportPayload(val id:String,val reason:String,val details:String?,val status:String,val created_at:String,val reviewed_at:String?,val resolution_note:String?,val reporter_name:String,val reported_user_id:String?,val reported_user_name:String?,val product_id:String?,val product_title:String?,val reviewer_name:String?)
data class UpdateReportRequest(val status:String,val note:String?=null)
data class AdminReportUpdatePayload(val id:String,val status:String,val reviewed_by:String?,val reviewed_at:String?,val resolution_note:String?)
data class ModerationNoteRequest(val note:String?=null)
