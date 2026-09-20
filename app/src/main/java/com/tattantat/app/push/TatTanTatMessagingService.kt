package com.tattantat.app.push

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class TatTanTatMessagingService : FirebaseMessagingService() {
    @Inject lateinit var registrar: PushTokenRegistrar
    override fun onNewToken(token: String) { registrar.syncToken(token) }
    override fun onMessageReceived(message: RemoteMessage) {
        val channelId = "marketplace_updates"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(NotificationChannel(channelId, "Cập nhật Tất Tần Tật", NotificationManager.IMPORTANCE_DEFAULT))
        val title = message.notification?.title ?: message.data["title"] ?: "Tất Tần Tật"
        val body = message.notification?.body ?: message.data["body"] ?: "Bạn có cập nhật mới"
        manager.notify(message.messageId?.hashCode() ?: System.currentTimeMillis().toInt(), NotificationCompat.Builder(this, channelId).setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle(title).setContentText(body).setAutoCancel(true).build())
    }
}
