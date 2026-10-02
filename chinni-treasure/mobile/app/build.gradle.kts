plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

/**
 * The site the WebView loads. Override per build without editing source:
 *
 *   ./gradlew assembleDebug -PSITE_URL=https://staging.example.com
 *
 * Defaults to production. Kept as a build config field so the URL is one
 * grep away from any crash report.
 */
val siteUrl: String = (project.findProperty("SITE_URL") as String?)
    ?: "https://chinnitreasure.com"

android {
    namespace = "com.chinnitreasure.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.chinnitreasure.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        buildConfigField("String", "SITE_URL", "\"$siteUrl\"")
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

// No dependencies: the WebView, the JavaScript bridge and the share sheet are
// all platform APIs. Add a library here only when a platform API cannot do it.
dependencies { }