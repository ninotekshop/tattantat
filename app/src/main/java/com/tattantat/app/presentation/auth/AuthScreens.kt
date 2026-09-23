package com.tattantat.app.presentation.auth

import com.tattantat.app.BuildConfig
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import kotlinx.coroutines.launch
import com.facebook.CallbackManager
import com.facebook.FacebookCallback
import com.facebook.FacebookException
import com.facebook.login.LoginManager
import com.facebook.login.LoginResult
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.credentials.exceptions.GetCredentialCancellationException
import com.tattantat.app.R

@Composable fun LoginScreen(onRegister: () -> Unit, onSuccess: () -> Unit, vm: AuthViewModel = hiltViewModel()) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var identity by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }; val state by vm.state.collectAsState()
    
    // Facebook Login Setup
    val callbackManager = remember { CallbackManager.Factory.create() }
    val loginManager = LoginManager.getInstance()
    val fbLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        callbackManager.onActivityResult(1, result.resultCode, result.data)
    }

    DisposableEffect(Unit) {
        loginManager.registerCallback(callbackManager, object : FacebookCallback<LoginResult> {
            override fun onSuccess(result: LoginResult) {
                vm.loginWithSocial("FACEBOOK", result.accessToken.token)
            }
            override fun onCancel() { Log.d("SocialLogin", "Facebook login canceled") }
            override fun onError(error: FacebookException) { Log.e("SocialLogin", "Facebook login error", error) }
        })
        onDispose { loginManager.unregisterCallback(callbackManager) }
    }
    
    AuthLayout("Chào mừng trở lại", "Đăng nhập để mua bán thật dễ") { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { Field(identity, { identity = it }, "Số điện thoại hoặc email"); Field(password, { password = it }, "Mật khẩu", password = true); ErrorText(state.error); Submit("Đăng nhập", state.loading, identity.isNotBlank() && password.hasValidPassword()) { vm.login(identity, password) }; TextButton(onClick = onRegister, Modifier.align(Alignment.CenterHorizontally)) { Text("Chưa có tài khoản? Đăng ký") }; SocialLoginSection(onGoogleClick = {
        coroutineScope.launch {
            try {
                val credentialManager = CredentialManager.create(context)
                val googleIdOption: GetGoogleIdOption = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setServerClientId(context.getString(R.string.google_web_client_id))
                    .setAutoSelectEnabled(false)
                    .build()
                val request: GetCredentialRequest = GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build()
                val result: GetCredentialResponse = credentialManager.getCredential(context, request)
                val credential = result.credential
                if (credential is GoogleIdTokenCredential) {
                    vm.loginWithSocial("GOOGLE", credential.idToken)
                } else if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    try {
                        val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                        vm.loginWithSocial("GOOGLE", googleIdTokenCredential.idToken)
                    } catch (e: GoogleIdTokenParsingException) {
                        Log.e("SocialLogin", "Received an invalid google id token response", e)
                    }
                } else {
                    Log.e("SocialLogin", "Unexpected type of credential")
                }
            } catch (e: GetCredentialException) {
                Log.e("SocialLogin", "GetCredentialException: ${e.type}", e)
                if (e !is GetCredentialCancellationException) {
                    Toast.makeText(
                        context,
                        "Đăng nhập Google thất bại: ${e.message ?: "Chưa có tài khoản trên thiết bị hoặc sai cấu hình Google Cloud"}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } catch (e: Exception) {
                Log.e("SocialLogin", "Unexpected exception", e)
                Toast.makeText(context, "Lỗi: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }, onFacebookClick = {
        loginManager.logInWithReadPermissions(context as ComponentActivity, listOf("email", "public_profile"))
    }, onAppleClick = {
        // TBD: Apple Login usually handled via custom tab or Firebase Auth, assuming backend handles web flow for now
        Log.d("SocialLogin", "Apple login triggered")
    })
    
    if (BuildConfig.DEBUG) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            HorizontalDivider()
            Text("Đăng nhập nhanh thử nghiệm (Real Backend)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                Button(
                    onClick = { vm.login(BuildConfig.DEMO_USER_EMAIL, BuildConfig.DEMO_PASSWORD) },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer, contentColor = MaterialTheme.colorScheme.onSecondaryContainer),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("User Demo")
                }
                Button(
                    onClick = { vm.login(BuildConfig.DEMO_ADMIN_EMAIL, BuildConfig.DEMO_PASSWORD) },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer, contentColor = MaterialTheme.colorScheme.onTertiaryContainer),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Admin Demo")
                }
            }
        }
    }
    }; if (state.authenticated) LaunchedEffect(Unit) { onSuccess() } }
}
@Composable fun RegisterScreen(onLogin: () -> Unit, onOtp: (String) -> Unit, vm: AuthViewModel = hiltViewModel()) {
    var name by remember { mutableStateOf("") }; var phone by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }; val state by vm.state.collectAsState()
    AuthLayout("Tạo tài khoản", "Chỉ mất chưa đến một phút") { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { Field(name, { name = it }, "Họ và tên"); Field(phone, { phone = it }, "Số điện thoại", KeyboardType.Phone); Field(password, { password = it }, "Mật khẩu (ít nhất 8 ký tự)", password = true); ErrorText(state.error); Submit("Tiếp tục", state.loading, name.isNotBlank() && phone.length >= 9 && password.hasValidPassword()) { vm.register(name, phone, password) }; TextButton(onClick = onLogin, Modifier.align(Alignment.CenterHorizontally)) { Text("Đã có tài khoản? Đăng ký") } }; state.verificationId?.let { id -> LaunchedEffect(id) { onOtp(id) } } }
}
@Composable fun OtpScreen(verificationId: String, onSuccess: () -> Unit, vm: AuthViewModel = hiltViewModel()) {
    var code by remember { mutableStateOf("") }; val state by vm.state.collectAsState()
    AuthLayout("Xác thực số điện thoại", if (BuildConfig.DEBUG) "Mã OTP thử nghiệm: 123456" else "Nhập mã 6 số vừa được gửi đến điện thoại của bạn") { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { Field(code, { code = it.take(6) }, "Mã OTP", KeyboardType.Number); ErrorText(state.error); Submit("Xác nhận", state.loading, code.length == 6) { vm.verifyOtp(verificationId, code) } }; if (state.authenticated) LaunchedEffect(Unit) { onSuccess() } }
}
@Composable private fun AuthLayout(title: String, subtitle: String, content: @Composable () -> Unit) = Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) { Image(painter = painterResource(id = R.drawable.ic_app_logo_horizontal), contentDescription = "Tất Tần Tật", modifier = Modifier.height(48.dp), contentScale = ContentScale.Fit); Spacer(Modifier.height(20.dp)); Text(title, style = MaterialTheme.typography.headlineMedium); Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp, bottom = 24.dp)); content() }
@Composable private fun Field(value: String, update: (String) -> Unit, label: String, type: KeyboardType = KeyboardType.Text, password: Boolean = false) = OutlinedTextField(value, update, Modifier.fillMaxWidth(), label = { Text(label) }, singleLine = true, keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = type), visualTransformation = if (password) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None)
@Composable private fun Submit(label: String, loading: Boolean, enabled: Boolean, click: () -> Unit) = Button(click, Modifier.fillMaxWidth(), enabled = enabled && !loading) { if (loading) CircularProgressIndicator(Modifier.size(20.dp)) else Text(label) }
@Composable private fun ErrorText(error: String?) { if (error != null) Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }

@Composable private fun SocialLoginSection(onGoogleClick: () -> Unit, onFacebookClick: () -> Unit, onAppleClick: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth().padding(top = 16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) { HorizontalDivider(Modifier.weight(1f)); Text(" Hoặc ", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant); HorizontalDivider(Modifier.weight(1f)) }
        Spacer(Modifier.height(8.dp))
        OutlinedButton(onClick = onGoogleClick, modifier = Modifier.fillMaxWidth()) { Text("Tiếp tục với Google") }
        OutlinedButton(onClick = onFacebookClick, modifier = Modifier.fillMaxWidth()) { Text("Tiếp tục với Facebook") }
        OutlinedButton(onClick = onAppleClick, modifier = Modifier.fillMaxWidth()) { Text("Tiếp tục với Apple") }
    }
}

internal fun String.hasValidPassword() = length >= 8
