package com.tattantat.app.core.security

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.tattantat.app.core.datastore.userPreferences
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

/** Access tokens stay in memory; only the rotating refresh token survives process death. */
@Singleton
class TokenStore @Inject constructor(private val dataStore: DataStore<Preferences>) {
    private val refreshTokenKey = stringPreferencesKey("refresh_token")
    private val accessTokenKey = stringPreferencesKey("access_token")
    suspend fun accessToken(): String? = dataStore.data.first()[accessTokenKey]
    suspend fun saveAccessToken(token: String) = dataStore.edit { it[accessTokenKey] = token }
    suspend fun refreshToken(): String? = dataStore.data.first()[refreshTokenKey]
    suspend fun saveRefreshToken(token: String) = dataStore.edit { it[refreshTokenKey] = token }
    suspend fun clear() = dataStore.edit { it.remove(refreshTokenKey); it.remove(accessTokenKey) }
}
