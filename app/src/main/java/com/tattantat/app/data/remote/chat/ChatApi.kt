package com.tattantat.app.data.remote.chat

import com.tattantat.app.data.remote.auth.ApiEnvelope
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ChatApi {
    @GET("chats") suspend fun chats(): ApiEnvelope<List<ChatPayload>>
    @POST("chats") suspend fun open(@Body request: OpenChatRequest): ApiEnvelope<OpenedChatPayload>
    @GET("chats/{id}/messages") suspend fun messages(@Path("id") chatId: String): ApiEnvelope<List<ChatMessagePayload>>
    @POST("chats/{id}/messages") suspend fun send(@Path("id") chatId: String, @Body request: SendMessageRequest): ApiEnvelope<ChatMessagePayload>
}

data class ChatPayload(val id: String, val product_id: String?, val last_message_at: String?, val other_name: String)
data class ChatMessagePayload(val id: String, val chat_id: String, val sender_id: String, val content: String, val created_at: String)
data class SendMessageRequest(val content: String)
data class OpenChatRequest(val productId: String)
data class OpenedChatPayload(val id: String, val productId: String, val otherName: String)
