package com.tattantat.app.presentation.auth

import com.tattantat.app.BuildConfig
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable fun LoginScreen(onRegister: () -> Unit, onSuccess: () -> Unit, vm: AuthViewModel = hiltViewModel()) {
    var identity by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }; val state by vm.state.collectAsState()
    AuthLayout("Chào mừng trở lại", "Đăng nhập để mua bán thật dễ") { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { Field(identity, { identity = it }, "Số điện thoại hoặc email"); Field(password, { password = it }, "Mật khẩu", password = true); ErrorText(state.error); Submit("Đăng nhập", state.loading, identity.isNotBlank() && password.hasValidPassword()) { vm.login(identity, password) }; TextButton(onClick = onRegister, Modifier.align(Alignment.CenterHorizontally)) { Text("Chưa có tài khoản? Đăng ký") } }; if (state.authenticated) LaunchedEffect(Unit) { onSuccess() } }
}
@Composable fun RegisterScreen(onLogin: () -> Unit, onOtp: (String) -> Unit, vm: AuthViewModel = hiltViewModel()) {
    var name by remember { mutableStateOf("") }; var phone by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }; val state by vm.state.collectAsState()
    AuthLayout("Tạo tài khoản", "Chỉ mất chưa đến một phút") { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { Field(name, { name = it }, "Họ và tên"); Field(phone, { phone = it }, "Số điện thoại", KeyboardType.Phone); Field(password, { password = it }, "Mật khẩu (ít nhất 8 ký tự)", password = true); ErrorText(state.error); Submit("Tiếp tục", state.loading, name.isNotBlank() && phone.length >= 9 && password.hasValidPassword()) { vm.register(name, phone, password) }; TextButton(onClick = onLogin, Modifier.align(Alignment.CenterHorizontally)) { Text("Đã có tài khoản? Đăng ký") } }; state.verificationId?.let { id -> LaunchedEffect(id) { onOtp(id) } } }
}
@Composable fun OtpScreen(verificationId: String, onSuccess: () -> Unit, vm: AuthViewModel = hiltViewModel()) {
    var code by remember { mutableStateOf("") }; val state by vm.state.collectAsState()
    AuthLayout("Xác thực số điện thoại", if (BuildConfig.DEBUG) "Mã OTP thử nghiệm: 123456" else "Nhập mã 6 số vừa được gửi đến điện thoại của bạn") { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { Field(code, { code = it.take(6) }, "Mã OTP", KeyboardType.Number); ErrorText(state.error); Submit("Xác nhận", state.loading, code.length == 6) { vm.verifyOtp(verificationId, code) } }; if (state.authenticated) LaunchedEffect(Unit) { onSuccess() } }
}
@Composable private fun AuthLayout(title: String, subtitle: String, content: @Composable () -> Unit) = Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) { Text("Tất Tần Tật", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary); Spacer(Modifier.height(28.dp)); Text(title, style = MaterialTheme.typography.headlineMedium); Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp, bottom = 24.dp)); content() }
@Composable private fun Field(value: String, update: (String) -> Unit, label: String, type: KeyboardType = KeyboardType.Text, password: Boolean = false) = OutlinedTextField(value, update, Modifier.fillMaxWidth(), label = { Text(label) }, singleLine = true, keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = type), visualTransformation = if (password) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None)
@Composable private fun Submit(label: String, loading: Boolean, enabled: Boolean, click: () -> Unit) = Button(click, Modifier.fillMaxWidth(), enabled = enabled && !loading) { if (loading) CircularProgressIndicator(Modifier.size(20.dp)) else Text(label) }
@Composable private fun ErrorText(error: String?) { if (error != null) Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
internal fun String.hasValidPassword() = length >= 8
