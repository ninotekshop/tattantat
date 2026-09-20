plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.tattantat.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.tattantat.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "API_BASE_URL", "\"https://api-dev.tattantat.vn/api/v1/\"")
    }
    buildTypes {
        debug { applicationIdSuffix = ".dev"; versionNameSuffix = "-dev"; buildConfigField("String", "DEMO_ADMIN_EMAIL", "\"admin@tattantat.vn\""); buildConfigField("String", "DEMO_USER_EMAIL", "\"user@tattantat.vn\""); buildConfigField("String", "DEMO_PASSWORD", "\"Demo@123\"") }
        release { isMinifyEnabled = false; buildConfigField("String", "DEMO_ADMIN_EMAIL", "\"\""); buildConfigField("String", "DEMO_USER_EMAIL", "\"\""); buildConfigField("String", "DEMO_PASSWORD", "\"\""); proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro") }
    }
    buildFeatures { compose = true; buildConfig = true }
    sourceSets.getByName("main").assets.srcDir(rootProject.file("shared"))
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime)
    implementation(libs.androidx.lifecycle.viewmodel)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.icons)
    debugImplementation(libs.compose.ui.tooling)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.androidx.hilt.navigation.compose)
    implementation(libs.retrofit)
    implementation(libs.retrofit.moshi)
    implementation(libs.moshi.kotlin)
    implementation(libs.okhttp.logging)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.coil.compose)
    testImplementation(libs.junit)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.messaging)
}
