package com.tattantat.app.core.common

import org.junit.Assert.assertEquals
import org.junit.Test

class UiStateTest {
    @Test fun success_preserves_value() {
        val state: UiState.Success<String> = UiState.Success("đã tải")
        assertEquals("đã tải", state.data)
    }
}
