package com.tattantat.app.presentation.navigation

import com.tattantat.app.BuildConfig
import com.tattantat.app.presentation.profile.TransactionHistoryScreen
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.filled.FormatListBulleted
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.automirrored.outlined.FormatListBulleted
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavType
import androidx.navigation.navArgument
import androidx.hilt.navigation.compose.hiltViewModel
import com.tattantat.app.R
import com.tattantat.app.presentation.admin.AdminCreateServiceScreen
import com.tattantat.app.presentation.admin.AdminPricingScreen
import com.tattantat.app.presentation.admin.AdminScreen
import com.tattantat.app.presentation.admin.AdminServicesScreen
import com.tattantat.app.presentation.admin.AdminTransactionsScreen
import com.tattantat.app.presentation.admin.FinancialAuditScreen
import com.tattantat.app.presentation.admin.ModerationReportsScreen
import com.tattantat.app.presentation.auth.LoginScreen
import com.tattantat.app.presentation.auth.OtpScreen
import com.tattantat.app.presentation.auth.RegisterScreen
import com.tattantat.app.presentation.category.CategoryProductsScreen
import com.tattantat.app.presentation.category.SubCategoriesScreen
import com.tattantat.app.presentation.chat.ChatDetailScreen
import com.tattantat.app.presentation.chat.ChatListScreen
import com.tattantat.app.presentation.home.HomeScreen
import com.tattantat.app.presentation.notification.NotificationsScreen
import com.tattantat.app.presentation.order.CheckoutScreen
import com.tattantat.app.presentation.order.OrderConfirmationScreen
import com.tattantat.app.presentation.order.OrdersScreen
import com.tattantat.app.presentation.product.FavoritesScreen
import com.tattantat.app.presentation.product.ProductDetailScreen
import com.tattantat.app.presentation.product.ProductViewModel
import com.tattantat.app.presentation.profile.BlockedUsersScreen
import com.tattantat.app.presentation.profile.ProfileScreen
import com.tattantat.app.presentation.profile.SubscriptionScreen
import com.tattantat.app.presentation.profile.WalletScreen
import com.tattantat.app.presentation.profile.SellerReviewsScreen
import com.tattantat.app.presentation.search.SearchScreen
import com.tattantat.app.presentation.sell.AdvertisingScreen
import com.tattantat.app.presentation.sell.MyListingsScreen
import com.tattantat.app.presentation.sell.PromotionScreen
import com.tattantat.app.presentation.sell.dynamic.ListingEditorScreen
import com.tattantat.app.presentation.sell.dynamic.DynamicListingScreen as SellScreen
import kotlinx.coroutines.delay

private data class NavTab(
    val route: String,
    val label: String,
    val unselectedIcon: ImageVector,
    val selectedIcon: ImageVector,
    val isCenter: Boolean = false,
)

private val mainTabs = listOf(
    NavTab("home", "Trang chủ", Icons.Outlined.Home, Icons.Filled.Home),
    NavTab("my-listings", "Quản lý tin", Icons.AutoMirrored.Outlined.FormatListBulleted, Icons.AutoMirrored.Filled.FormatListBulleted),
    NavTab("sell", "Đăng tin", Icons.Filled.Add, Icons.Filled.Add, isCenter = true),
    NavTab("chat", "Liên hệ", Icons.AutoMirrored.Outlined.Chat, Icons.AutoMirrored.Filled.Chat),
    NavTab("profile", "Tài khoản", Icons.Outlined.Person, Icons.Filled.Person),
)

@Composable
fun TatTanTatApp() {
    val nav = rememberNavController()
    NavHost(nav, "splash") {
        composable("splash") {
            Splash(onAuthResult = { isLoggedIn ->
                val destination = if (isLoggedIn || BuildConfig.DEBUG) "main" else "login"
                nav.navigate(destination) { popUpTo("splash") { inclusive = true } }
            })
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
private fun Splash(onAuthResult: (Boolean) -> Unit, vm: AppViewModel = hiltViewModel()) {
    LaunchedEffect(Unit) {
        val isLoggedIn = vm.checkSession()
        delay(500)
        onAuthResult(isLoggedIn)
    }
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Image(painter = painterResource(id = R.drawable.ic_app_logo_icon), contentDescription = "Logo", modifier = Modifier.size(96.dp))
            Spacer(Modifier.height(16.dp))
            Image(painter = painterResource(id = R.drawable.ic_app_logo_horizontal), contentDescription = "Tất Tần Tật", modifier = Modifier.height(36.dp), contentScale = ContentScale.Fit)
        }
    }
}

@Composable
private fun MainTabs(onLoggedOut: () -> Unit) {
    val nav = rememberNavController()
    val current by nav.currentBackStackEntryAsState()
    val route = current?.destination?.route

    Scaffold(
        bottomBar = {
            if (route?.startsWith("checkout/") != true && route?.startsWith("chat-detail/") != true) {
                Box(modifier = Modifier.fillMaxWidth()) {
                    Surface(
                        shadowElevation = 8.dp,
                        color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(64.dp)
                            .align(Alignment.BottomCenter)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxSize(),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            mainTabs.forEach { tab ->
                                if (tab.isCenter) {
                                    Spacer(modifier = Modifier.weight(1f))
                                } else {
                                    val isSelected = route == tab.route
                                    NavigationBarItem(
                                        modifier = Modifier.weight(1f),
                                        selected = isSelected,
                                        onClick = {
                                            nav.navigate(tab.route) { launchSingleTop = true }
                                        },
                                        icon = {
                                            Icon(
                                                imageVector = if (isSelected) tab.selectedIcon else tab.unselectedIcon,
                                                contentDescription = tab.label,
                                                modifier = Modifier.size(22.dp),
                                            )
                                        },
                                        label = {
                                            Text(
                                                text = tab.label,
                                                fontSize = 11.sp,
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                            )
                                        },
                                        colors = NavigationBarItemDefaults.colors(
                                            selectedIconColor = MaterialTheme.colorScheme.primary,
                                            selectedTextColor = MaterialTheme.colorScheme.primary,
                                            unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                            unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                            indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                                        ),
                                    )
                                }
                            }
                        }
                    }

                    // Floating Center Button
                    val centerTab = mainTabs.find { it.isCenter }
                    if (centerTab != null) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .offset(y = (-8).dp)
                                .clickable {
                                    nav.navigate(centerTab.route) { launchSingleTop = true }
                                }
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.primary,
                                shadowElevation = 6.dp,
                                modifier = Modifier.size(52.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Filled.Add,
                                        contentDescription = "Đăng tin",
                                        tint = Color.White,
                                        modifier = Modifier.size(30.dp)
                                    )
                                }
                            }
                            Text(
                                text = centerTab.label,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary,
                                fontSize = 10.sp,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }
                }
            }
        },
    ) { padding ->
        NavHost(nav, "home", Modifier.padding(padding)) {
            composable("home") {
                HomeScreen(
                    onProduct = { nav.navigate("product/$it") },
                    onNotifications = { nav.navigate("notifications") },
                    onExplore = { nav.navigate("explore") },
                    onCategoryClick = { cat ->
                        nav.navigate("subcategories/${cat.id}")
                    },
                    onSell = { nav.navigate("sell") },
                    onFavorites = { nav.navigate("favorites") },
                )
            }
            composable("subcategories/{parentId}") { entry ->
                val parentId = entry.arguments?.getString("parentId").orEmpty()
                SubCategoriesScreen(
                    parentId = parentId,
                    onBack = { nav.popBackStack() },
                    onSubCategoryClick = { subCat ->
                        nav.navigate("category-products/${subCat.id}/${subCat.name}")
                    }
                )
            }
            composable("category-products/{catId}/{catName}") { entry ->
                val catId = entry.arguments?.getString("catId").orEmpty()
                val catName = entry.arguments?.getString("catName").orEmpty()
                CategoryProductsScreen(
                    categoryId = catId,
                    categoryName = catName,
                    onBack = { nav.popBackStack() },
                    onProductClick = { nav.navigate("product/$it") }
                )
            }
            composable("explore?categoryId={categoryId}", arguments = listOf(navArgument("categoryId") { type = NavType.LongType; defaultValue = -1L })) { entry ->
                val categoryId = entry.arguments?.getLong("categoryId")?.takeIf { it > 0L }
                SearchScreen(onProduct = { nav.navigate("product/$it") }, initialCategoryId = categoryId)
            }
            composable("product/{id}") { entry ->
                val vm: ProductViewModel = hiltViewModel()
                val products by vm.products.collectAsState()
                val productId = entry.arguments?.getString("id").orEmpty()
                ProductDetailScreen(
                    productId = productId,
                    fallback = products.find { it.id == productId },
                    onBack = { nav.popBackStack() },
                    onChat = { nav.navigate("chat-detail/$it") },
                    onBuy = { nav.navigate("checkout/$productId") }
                )
            }
            composable("sell") { SellScreen(onMyListings = { nav.navigate("my-listings") }) }
            composable("my-listings") { MyListingsScreen(onPromote = { nav.navigate("promotions/$it") }, onAdvertise = { nav.navigate("advertising/$it") }, onEdit = { nav.navigate("edit-listing/$it") }) }
            composable("edit-listing/{id}") { entry -> ListingEditorScreen(id = entry.arguments?.getString("id").orEmpty(), onDone = { nav.popBackStack(); Unit }) }
            composable("promotions/{id}") { entry ->
                val productId = entry.arguments?.getString("id").orEmpty()
                PromotionScreen(
                    productId = productId,
                    onBackToMyListings = { nav.popBackStack() }
                )
            }
            composable("advertising/{id}") { entry -> AdvertisingScreen(entry.arguments?.getString("id").orEmpty()) }
            composable("chat") { ChatListScreen(onOpen = { nav.navigate("chat-detail/$it") }) }
            composable("chat-detail/{id}") { entry ->
                val chatId = entry.arguments?.getString("id").orEmpty()
                ChatDetailScreen(
                    chatId = chatId,
                    onBack = { nav.popBackStack() },
                    onProductClick = { nav.navigate("product/$it") }
                )
            }
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
                    onTransactionHistory = { nav.navigate("transaction-history") },
                    onLogout = onLoggedOut,
                )
            }
            composable("transaction-history") {
                TransactionHistoryScreen(onBack = { nav.popBackStack() })
            }
            composable("wallet") { WalletScreen() }
            composable("subscriptions") { SubscriptionScreen() }
            composable("favorites") { FavoritesScreen(onProduct = { nav.navigate("product/$it") }) }
            composable("notifications") { NotificationsScreen() }
            composable("seller-reviews") { SellerReviewsScreen() }
            composable("blocked-users") { BlockedUsersScreen() }
            composable("admin") { AdminScreen(onPricing = { nav.navigate("admin-pricing") }, onServices = { nav.navigate("admin-services") }, onTransactions = { nav.navigate("admin-transactions") }, onAudit = { nav.navigate("admin-audit") }, onReports = { nav.navigate("admin-reports") }) }
            composable("admin-pricing") { AdminPricingScreen() }
            composable("admin-services") { AdminServicesScreen(onCreate = { nav.navigate("admin-create-service") }) }
            composable("admin-create-service") { AdminCreateServiceScreen() }
            composable("admin-transactions") { AdminTransactionsScreen() }
            composable("admin-audit") { FinancialAuditScreen() }
            composable("admin-reports") { ModerationReportsScreen() }
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
