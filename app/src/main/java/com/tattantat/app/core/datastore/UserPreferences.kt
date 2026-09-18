package com.tattantat.app.core.datastore

import android.content.Context
import androidx.datastore.preferences.preferencesDataStore

val Context.userPreferences by preferencesDataStore(name = "user_preferences")
