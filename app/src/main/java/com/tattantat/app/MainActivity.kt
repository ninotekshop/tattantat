package com.tattantat.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.tattantat.app.core.ui.theme.TatTanTatTheme
import com.tattantat.app.presentation.navigation.TatTanTatApp
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { TatTanTatTheme { TatTanTatApp() } }
    }
}
