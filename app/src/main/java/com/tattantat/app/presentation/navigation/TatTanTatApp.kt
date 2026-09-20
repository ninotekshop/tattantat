package com.tattantat.app.presentation.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Message
import androidx.compose.material.icons.outlined.AccountCircle
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavType
import androidx.navigation.navArgument
import androidx.hilt.navigation.compose.hiltViewModel
import com.tattantat.app.presentation.admin.AdminCreateServiceScreen
import com.tattantat.app.presentation.admin.AdminPricingScreen
import com.tattantat.app.presentation.admin.AdminScreen
import com.tattantat.app.presentation.admin.AdminServicesScreen
import com.tattantat.app.presentation.admin.AdminTransactionsScreen
import com.tattantat.app.presentation.admin.FinancialAuditScreen
import com.tattantat.app.presentation.auth.LoginScreen
import com.tattantat.app.presentation.auth.OtpScreen
import com.tattantat.app.presentation.auth.RegisterScreen
import com.tattantat.app.presentation.chat.ChatListScreen
import com.tattantat.app.presentation.home.HomeScreen
import com.tattantat.app.presentation.notification.NotificationsScreen
import com.tattantat.app.presentation.order.CheckoutScreen
import com.tattantat.app.presentation.order.OrderConfirmationScreen
import com.tattantat.app.presentation.order.OrdersScreen
import com.tattantat.app.presentation.product.FavoritesScreen
import com.tattantat.app.presentation.product.ProductDetailScreen
import com.tattantat.app.presentation.product.ProductViewModel
import com.tattantat.app.presentation.profile.ProfileScreen
import com.tattantat.app.presentation.profile.SubscriptionScreen
import com.tattantat.app.presentation.profile.WalletScreen
import com.tattantat.app.presentation.profile.SellerReviewsScreen
import com.tattantat.app.presentation.search.SearchScreen
import com.tattantat.app.presentation.sell.AdvertisingScreen
import com.tattantat.app.presentation.sell.MyListingsScreen
import com.tattantat.app.presentation.sell.PromotionScreen
import com.tattantat.app.presentation.sell.dynamic.DynamicListingScreen as SellScreen
import kotlinx.coroutines.delay

private data class Tab(
    val route: String,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
)

private val tabs = listOf(
    Tab("home", "Trang chủ", Icons.Outlined.Home),
    Tab("explore", "Khám phá", Icons.Outlined.Explore),
    Tab("sell", "Đăng bán", Icons.Outlined.AddCircle),
    Tab("chat", "Tin nhắn", Icons.AutoMirrored.Outlined.Message),
    Tab("profile", "Cá nhân", Icons.Outlined.AccountCircle),
)

@Composable
fun TatTanTatApp() {
    val nav = rememberNavController()
    NavHost(nav, "splash") {
        composable("splash") {
            Splash { nav.navigate("login") { popUpTo("splash") { inclusive = true } } }
        }
        composable("login") {
            LoginScreen(
                onRegister = { nav.navigate("register") },
                onSuccess = { nav.navigate("main") { popUpTo("login") { inclusive = true } } },
            )
        }
        composable("register") { RegisterScreen(onLogin = { nav.popBackStack() }, onOtp = { id -> nav.navigate("otp/$id") }) }
        composable("otp/{id}") { entry ->
            OtpScreen(
                verificationId = entry.arguments?.getString("id").orEmpty(),
                onSuccess = { nav.navigate("main") { popUpTo("login") { inclusive = true } } },
            )
        }
        composable("main") {
            MainTabs(onLoggedOut = {
                nav.navigate("login") { popUpTo("main") { inclusive = true }; launchSingleTop = true }
            })
        }
    }
}

@Composable
private fun Splash(done: () -> Unit) {
    androidx.compose.runtime.LaunchedEffect(Unit) { delay(750); done() }
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Tất Tần Tật", style = MaterialTheme.typography.headlineLarge, color = MaterialTheme.colorScheme.primary)
    }
}

@Composable
private fun MainTabs(onLoggedOut: () -> Unit) {
    val nav = rememberNavController()
    val current by nav.currentBackStackEntryAsState()
    val route = current?.destination?.route
    Scaffold(
        bottomBar = {
            if (route?.startsWith("product/") != true) {
                NavigationBar {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = route == tab.route,
                            onClick = { nav.navigate(tab.route) { launchSingleTop = true } },
                            icon = { Icon(tab.icon, tab.label) },
                            label = { Text(tab.label) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(nav, "home", Modifier.padding(padding)) {
            composable("home") {
                HomeScreen(onProduct = { nav.navigate("product/$it") }, onNotifications = { nav.navigate("notifications") }, onExplore = { nav.navigate("explore") }, onCategory = { nav.navigate("explore?categoryId=$it") }, onSell = { nav.navigate("sell") })
            }
            composable("explore?categoryId={categoryId}", arguments = listOf(navArgument("categoryId") { type = NavType.LongType; defaultValue = -1L })) { entry ->
                val categoryId = entry.arguments?.getLong("categoryId")?.takeIf { it > 0L }
                SearchScreen(onProduct = { nav.navigate("product/$it") }, initialCategoryId = categoryId)
            }
            composable("product/{id}") { entry ->
                val vm: ProductViewModel = hiltViewModel()
                val products by vm.products.collectAsState()
                val productId = entry.arguments?.getString("id").orEmpty()
                ProductDetailScreen(productId = productId, fallback = products.find { it.id == productId }, onChat = { nav.navigate("chat-detail/$it") }, onBuy = { nav.navigate("checkout/$productId") })
            }
            composable("sell") { SellScreen(onMyListings = { nav.navigate("my-listings") }) }
            composable("my-listings") { MyListingsScreen(onPromote = { nav.navigate("promotions/$it") }, onAdvertise = { nav.navigate("advertising/$it") }, onEdit = { nav.navigate("edit-listing/$it") }) }
            composable("edit-listing/{id}") { entry -> com.tattantat.app.presentation.sell.dynamic.ListingEditorScreen(id = entry.arguments?.getString("id").orEmpty(), onDone = { nav.popBackStack(); Unit }) }
            composable("promotions/{id}") { entry -> PromotionScreen(entry.arguments?.getString("id").orEmpty()) }
            composable("advertising/{id}") { entry -> AdvertisingScreen(entry.arguments?.getString("id").orEmpty()) }
            composable("chat") { ChatListScreen(onOpen = { nav.navigate("chat-detail/$it") }) }
            composable("chat-detail/{id}") { entry -> com.tattantat.app.presentation.chat.ChatDetailScreen(entry.arguments?.getString("id").orEmpty()) }
            composable("profile") {
                ProfileScreen(
                    onOrders = { nav.navigate("orders") },
                    onWallet = { nav.navigate("wallet") },
                    onSubscriptions = { nav.navigate("subscriptions") },
                    onAdmin = { nav.navigate("admin") },
                    onFavorites = { nav.navigate("favorites") },
                    onListings = { nav.navigate("my-listings") },
                    onNotifications = { nav.navigate("notifications") },
                    onReviews = { nav.navigate("seller-reviews") },
                    onBlockedUsers = { nav.navigate("blocked-users") },
                    onLogout = onLoggedOut,
                )
            }
            composable("wallet") { WalletScreen() }
            composable("subscriptions") { SubscriptionScreen() }
            composable("favorites") { FavoritesScreen(onProduct = { nav.navigate("product/$it") }) }
            composable("notifications") { NotificationsScreen() }
            composable("seller-reviews") { SellerReviewsScreen() }
            composable("blocked-users") { com.tattantat.app.presentation.profile.BlockedUsersScreen() }
            composable("admin") { AdminScreen(onPricing = { nav.navigate("admin-pricing") }, onServices = { nav.navigate("admin-services") }, onTransactions = { nav.navigate("admin-transactions") }, onAudit = { nav.navigate("admin-audit") }, onReports = { nav.navigate("admin-reports") }) }
            composable("admin-pricing") { AdminPricingScreen() }
            composable("admin-services") { AdminServicesScreen(onCreate = { nav.navigate("admin-create-service") }) }
            composable("admin-create-service") { AdminCreateServiceScreen() }
            composable("admin-transactions") { AdminTransactionsScreen() }
            composable("admin-audit") { FinancialAuditScreen() }
            composable("admin-reports") { com.tattantat.app.presentation.admin.ModerationReportsScreen() }
            composable("orders") { OrdersScreen() }
            composable("checkout/{id}") { entry ->
                CheckoutScreen(
                    productId = entry.arguments?.getString("id").orEmpty(),
                    onConfirm = { code -> nav.navigate("order-confirmed/$code") },
                )
            }
            composable("order-confirmed/{code}") { entry -> OrderConfirmationScreen(entry.arguments?.getString("code").orEmpty()) }
        }
    }
}
