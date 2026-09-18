package com.tattantat.app.presentation.auth
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
class AuthValidationTest { @Test fun password_requires_six_characters() { assertFalse("12345".hasValidPassword()); assertTrue("123456".hasValidPassword()) } }
