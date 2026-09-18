package com.tattantat.app.core.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val BrandGreen = Color(0xFF008C4A)
val BrandGreenDark = Color(0xFF006B39)
val Ink = Color(0xFF15231D)
val AppBackground = Color(0xFFF7FAF8)
val Success = Color(0xFF16A34A)
val Warning = Color(0xFFF59E0B)
val Error = Color(0xFFDC2626)

private val LightColors = lightColorScheme(
    primary = BrandGreen, onPrimary = Color.White,
    primaryContainer = Color(0xFFD9F7E6), onPrimaryContainer = BrandGreenDark,
    secondary = Ink, background = AppBackground, surface = Color.White,
    error = Error
)
private val DarkColors = darkColorScheme(primary = Color(0xFF5EE49A), secondary = Color(0xFFCCD8D0))

@Composable
fun TatTanTatTheme(content: @Composable () -> Unit) = MaterialTheme(
    colorScheme = if (androidx.compose.foundation.isSystemInDarkTheme()) DarkColors else LightColors,
    typography = TatTanTatTypography,
    content = content
)
