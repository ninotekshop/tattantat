package com.tattantat.app.presentation.auth
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
class AuthValidationTest { @Test fun password_requires_eight_characters() { assertFalse("1234567".hasValidPassword()); assertTrue("12345678".hasValidPassword()) } }
