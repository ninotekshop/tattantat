package com.tattantat.app.push

import com.google.firebase.messaging.FirebaseMessaging
import com.tattantat.app.data.remote.account.AccountApi
import com.tattantat.app.data.remote.account.PushDeviceRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PushTokenRegistrar @Inject constructor(private val api: AccountApi) {
    fun sync() {
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            CoroutineScope(Dispatchers.IO).launch { runCatching { api.registerPushDevice(PushDeviceRequest(token)) } }
        }
    }
    fun syncToken(token: String) = CoroutineScope(Dispatchers.IO).launch { runCatching { api.registerPushDevice(PushDeviceRequest(token)) } }
}
