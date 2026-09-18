package com.tattantat.app.presentation.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Message
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.compose.*
import com.tattantat.app.presentation.auth.*
import com.tattantat.app.presentation.home.HomeScreen
import com.tattantat.app.presentation.product.ProductDetailScreen
import com.tattantat.app.presentation.product.ProductViewModel
import com.tattantat.app.presentation.search.SearchScreen
import com.tattantat.app.presentation.sell.SellScreen
import com.tattantat.app.presentation.sell.MyListingsScreen
import com.tattantat.app.presentation.chat.ChatListScreen
import com.tattantat.app.presentation.order.CheckoutScreen
import com.tattantat.app.presentation.order.OrderConfirmationScreen
import com.tattantat.app.presentation.profile.ProfileScreen
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.coroutines.delay

private data class Tab(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector)
private val tabs = listOf(Tab("home", "Trang chủ", Icons.Outlined.Home), Tab("explore", "Khám phá", Icons.Outlined.Explore), Tab("sell", "Đăng bán", Icons.Outlined.AddCircle), Tab("chat", "Tin nhắn", Icons.AutoMirrored.Outlined.Message), Tab("profile", "Cá nhân", Icons.Outlined.AccountCircle))
@Composable fun TatTanTatApp() { val nav = rememberNavController(); NavHost(nav, "splash") { composable("splash") { Splash { nav.navigate("login") { popUpTo("splash") { inclusive = true } } } }; composable("login") { LoginScreen({ nav.navigate("register") }, { nav.navigate("main") { popUpTo("login") { inclusive = true } } }) }; composable("register") { RegisterScreen({ nav.popBackStack() }, { id -> nav.navigate("otp/$id") }) }; composable("otp/{id}") { entry -> OtpScreen(verificationId = entry.arguments?.getString("id").orEmpty(), onSuccess = { nav.navigate("main") { popUpTo("login") { inclusive = true } } }) }; composable("main") { MainTabs() } } }
@Composable private fun Splash(done: () -> Unit) { LaunchedEffect(Unit) { delay(750); done() }; Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Tất Tần Tật", style = MaterialTheme.typography.headlineLarge, color = MaterialTheme.colorScheme.primary) } }
@Composable private fun MainTabs() { val nav = rememberNavController(); val current by nav.currentBackStackEntryAsState(); val route = current?.destination?.route; Scaffold(bottomBar = { if (route?.startsWith("product/") != true) NavigationBar { tabs.forEach { tab -> NavigationBarItem(route == tab.route, { nav.navigate(tab.route) { launchSingleTop = true } }, { Icon(tab.icon, tab.label) }, label = { Text(tab.label) }) } } }) { pad -> NavHost(nav, "home", Modifier.padding(pad)) { composable("home") { HomeScreen(onProduct = { nav.navigate("product/$it") }) }; composable("explore") { val vm: ProductViewModel = hiltViewModel(); val products by vm.products.collectAsState(); SearchScreen(products) { nav.navigate("product/$it") } }; composable("product/{id}") { entry -> val vm: ProductViewModel = hiltViewModel(); val products by vm.products.collectAsState(); ProductDetailScreen(products.find { it.id == entry.arguments?.getString("id") }, onChat = { nav.navigate("chat") }, onBuy = { nav.navigate("checkout") }) }; composable("sell") { SellScreen(onMyListings = { nav.navigate("my-listings") }) }; composable("my-listings") { MyListingsScreen() }; composable("chat") { ChatListScreen { nav.navigate("chat-detail") } }; composable("profile") { ProfileScreen() }; composable("chat-detail") { com.tattantat.app.presentation.chat.ChatDetailScreen() }; composable("checkout") { CheckoutScreen { nav.navigate("order-confirmed") } }; composable("order-confirmed") { OrderConfirmationScreen() } } } }
@Composable private fun ComingSoon(title: String) = Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("$title sẽ sớm có mặt") }
