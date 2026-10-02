# Chinni Treasure — Android app

A native Android shell around the live storefront. One activity, one WebView, zero
dependencies beyond the Android platform.

## Why a WebView and not a native rewrite

The site already is the product: catalogue, cart, Razorpay checkout, order tracking,
PDF invoices, admin. A Kotlin/Compose rewrite would be a second implementation of all
of it with a second set of bugs, and it would need a release every time a price or a
product description changed. This wrapper is ~200 lines and inherits every site change
the moment it deploys.

What the wrapper buys you, and the only things it buys you:

- an installable APK/AAB for the Play Store
- a real launcher icon and splash instead of a browser tab
- back-button and external-link handling that feels native
- a Play-distribution channel for push notifications later

Everything else the PWA already did. `public/manifest.json` is still correct and the
site is still installable from Chrome — keep both.

---

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| JDK | 17 or newer | `java -version`. Android Studio bundles one. |
| Android SDK | API 35 | Android Studio → SDK Manager → *Android 15 (API 35)*. |
| Gradle | 8.9 | Wrapper downloads it. See below. |

There is **no `gradlew` in this repo**. The wrapper JAR is a binary and Gradle itself is
not installed. Generate it once:

```bash
cd mobile
gradle wrapper --gradle-version 8.9   # needs a local Gradle 8.x
./gradlew assembleDebug
```

Or just open `mobile/` in Android Studio and press Run — it creates the wrapper, the
`local.properties` SDK path, and an emulator for you. `local.properties` and
`build/` are gitignored.

---

## Pointing the app at a site

The URL is a Gradle property with a production default. Nothing to edit in Kotlin:

```bash
./gradlew assembleDebug                                          # production
./gradlew assembleDebug -PSITE_URL=https://staging.example.com   # staging
./gradlew assembleDebug -PSITE_URL=http://10.0.2.2:3000          # local dev
```

It lands in `app/build.gradle.kts`:

```kotlin
val siteUrl: String = (project.findProperty("SITE_URL") as String?)
    ?: "https://chinnitreasure.com"
```

and is read at runtime as `BuildConfig.SITE_URL`. Only URLs on that host are rendered
inside the WebView; everything else is handed to the system.

`minSdk` is 24 (Android 7.0), `targetSdk`/`compileSdk` are 35 (Android 15).

---

## Building

```bash
cd mobile

./gradlew assembleDebug     # app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease     # app/build/outputs/bundle/release/app-release.aab  (Play Store)
./gradlew installDebug      # build + install on the connected device
```

`./gradlew tasks` lists everything else.

---

## Signing a release

Play App Signing means you only ever sign with an **upload key**; Google holds the
app-signing key.

```bash
keytool -genkey -v -keystore upload.keystore -alias upload \
        -keyalg RSA -keysize 2048 -validity 10000
```

`mobile/keystore.properties` (gitignored — create it, never commit it):

```properties
storeFile=upload.keystore
storePassword=...
keyAlias=upload
keyPassword=...
```

Then add the reading block to `app/build.gradle.kts` under `signingConfigs` and set
`signingConfig = signingConfigs.getByName("upload")` on the release build type:

```kotlin
val keystoreProps = java.util.Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    signingConfigs {
        create("upload") {
            storeFile = file(keystoreProps.getProperty("storeFile"))
            storePassword = keystoreProps.getProperty("storePassword")
            keyAlias = keystoreProps.getProperty("keyAlias")
            keyPassword = keystoreProps.getProperty("keyPassword")
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("upload")
            // ...existing config
        }
    }
}
```

Left out on purpose: CI wiring, Play Publishing API automation, and version-code
automation. Add them when there is a release pipeline to automate.

---

## What the app deliberately does not do

Each of these is a real feature, not an oversight. Add the day you need it.

| Missing | Why | Add when |
| --- | --- | --- |
| Offline mode | Needs a service worker mirroring Next.js asset caching | Field reports of no-signal checkout |
| Push notifications | Needs Firebase or Play In-App Messaging | You actually send order updates |
| Biometric login | Admin panel only, and it is cookie-based | Admin ever ships to phones |
| File upload | `onShowFileChooser` on the WebChromeClient — the customer journey has no file inputs | Admin panel is used from a phone |
| Deep links | `intent-filter` + `assetlinks.json` hosting | Marketing sends `chinnitreasure.com/order/...` links |
| Release signing | `upload.keystore` is untracked | First Play upload |
| Crash reporting | Needs Sentry or Bugsnag | Play Console shows crashes you cannot reproduce |

---

## Known caveat: Razorpay Standard Checkout in a WebView

**Read this before you ship.** This is the one place where the WebView is a real
liability rather than a convenience.

Razorpay Standard Checkout loads `checkout.razorpay.com/v1/checkout.js`
([src/lib/razorpay.ts](../src/lib/razorpay.ts)) and opens a modal that renders card and
netbanking forms in an iframe. Inside an Android WebView that flow is known to be
fragile: UPI and wallet intents can fail to hand off to the banking app, and some
gateway-hosted card frames render blank.

What this app does to mitigate it:

- `setSupportMultipleWindows(false)` + `javaScriptCanOpenWindowsAutomatically = true`
  so a `window.open` navigates in place instead of opening an unhostable window
- third-party cookies enabled, which the checkout iframe needs
- `MIXED_CONTENT_NEVER_ALLOW`, so a gateway serving mixed content fails loudly rather
  than silently

**Test a real ₹1 order on a real device before release.** The checkout has a manual
UPI/bank-transfer fallback ([src/components/order/CheckoutActions.tsx](../src/components/order/CheckoutActions.tsx));
if you need certainty, surface that option first in the app.

The escape hatch, when it becomes necessary, is a Custom Tabs flow: hand the whole
checkout to the user's browser and come back on the verification callback. That is
roughly a day of work and costs you the in-app look. Not pre-built.

---

## Files

```
mobile/
├── README.md                     this file
├── generate-icons.mjs            regenerates launcher icons from public/icons/
├── verify.mjs                    resolves every resource reference, no SDK needed
├── settings.gradle.kts           plugin repos, includes :app
├── build.gradle.kts              AGP 8.7.3, Kotlin 2.0.21
├── gradle.properties             JVM args, AndroidX flags
├── gradle/wrapper/               distributionUrl only; run `gradle wrapper`
└── app/
    ├── build.gradle.kts          SDK levels, SITE_URL, signingConfig slot
    ├── proguard-rules.pro        empty; minify is off
    └── src/main/
        ├── AndroidManifest.xml   INTERNET, one exported activity, no cleartext
        ├── java/.../MainActivity.kt   the entire app
        └── res/
            ├── values/           strings, colours, theme
            ├── drawable/         adaptive-icon background + monochrome mask
            ├── mipmap-*/         generated launcher icons
            └── mipmap-anydpi-v26/ adaptive-icon wiring
```

`MainActivity.kt` is the whole thing: WebView settings, the cart's localStorage and
cookie requirements, the back button, and off-host link handling. Read it before
changing anything — there is nowhere else for behaviour to hide.

---

## Icons

The launcher icons are generated from `public/icons/icon-512x512.png`, which is a
black mermaid on transparency and therefore invisible on the app's dark surface.
`generate-icons.mjs` composites it onto the brand cream for you.

```bash
node mobile/generate-icons.mjs
```

Uses `sharp`, already in the root `node_modules`. Brand tokens live in
`app/styles/variables.css` and are mirrored into `res/values/colors.xml` and the
generated `drawable/ic_launcher_*.xml`. Change the brand colour in **both** places or
the native chrome and the page will drift apart.

Delete the script once the icon has stopped changing — it is a one-off, not a build step.

---

## Verifying a build

```bash
node mobile/verify.mjs              # resource references, no SDK needed
cd mobile && ./gradlew assembleDebug lint
```

`verify.mjs` resolves every `@drawable`/`@mipmap`/`@color`/`@string`/`@style` reference
in the manifest, `res/` and the Kotlin, and checks `BuildConfig.SITE_URL` is actually
declared. It exists because there is no Android SDK here, so `aapt` cannot catch a
typo'd resource name before it fails a release build. It is a floor under
`./gradlew lint`, not a replacement — run both.

`lint` is worth running before release: it catches the manifest and API-level mistakes
that only show up on a real device otherwise.