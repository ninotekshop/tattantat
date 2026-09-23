package com.tattantat.app.presentation.sell.dynamic

import androidx.compose.runtime.Composable
import com.tattantat.app.presentation.sell.EditListingScreen

@Composable
fun ListingEditorScreen(id: String, onDone: () -> Unit) {
    EditListingScreen(id = id, onDone = onDone)
}
