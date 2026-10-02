package com.chinnitreasure.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.SafeBrowsingResponse
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast

/**
 * The whole app: a WebView pointed at the live storefront.
 *
 * Everything else — catalogue, cart, checkout, order tracking — is the site.
 * There is no native UI to keep in sync with it, and no offline copy of it to
 * invalidate.
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView

    /** Host the WebView is allowed to render; anything else leaves the app. */
    private val siteHost: String by lazy { Uri.parse(BuildConfig.SITE_URL).host.orEmpty() }

    // ponytail: legacy onBackPressed, no androidx.activity. Correct on targetSdk 35;
    // swap for OnBackPressedDispatcher if you enable predictive back (androidx.activity:activity).
    @Suppress("DEPRECATION")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.parseColor(BRAND_BLACK))

            settings.configure()
            webChromeClient = WebChromeClient()
            webViewClient = StorefrontClient()
        }

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            // Razorpay's checkout iframe sets its own cookies.
            setAcceptThirdPartyCookies(webView, true)
        }

        setContentView(
            FrameLayout(this).apply {
                setBackgroundColor(Color.parseColor(BRAND_BLACK))
                // Android 15 (targetSdk 35) forces edge-to-edge; insets keep the
                // page clear of the status and navigation bars.
                fitsSystemWindows = true
                addView(webView)
            },
        )

        webView.loadUrl(BuildConfig.SITE_URL)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun WebSettings.configure() {
        // Required: the storefront is a React app, the cart lives in
        // localStorage, and the server cart lives in a cookie.
        javaScriptEnabled = true
        domStorageEnabled = true

        // window.open from the checkout flow should navigate in place rather
        // than open a window the app cannot host.
        setSupportMultipleWindows(false)
        javaScriptCanOpenWindowsAutomatically = true

        mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        allowFileAccess = false
        allowContentAccess = false
        safeBrowsingEnabled = true

        // The site is responsive and handles its own zoom; platform pinch-zoom
        // fights it.
        setSupportZoom(false)
        builtInZoomControls = false
        displayZoomControls = false
    }

    private inner class StorefrontClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(
            view: WebView,
            request: WebResourceRequest,
        ): Boolean {
            val url = request.url
            return if (url.host == siteHost) {
                false // the WebView renders it
            } else {
                openExternally(url)
                true
            }
        }

        override fun onSafeBrowsingHit(
            view: WebView,
            request: WebResourceRequest,
            threatType: Int,
            callback: SafeBrowsingResponse,
        ) {
            // Always back out: the storefront never knowingly serves malware.
            callback.backToSafety(true)
        }
    }

    /**
     * tel:, mailto:, whatsapp: and intent: links mean nothing inside a WebView,
     * and another host means the user expected a browser. Either way, hand off.
     * An unhandled scheme must never strand them on a blank page.
     */
    private fun openExternally(url: Uri) {
        try {
            startActivity(
                Intent(Intent.ACTION_VIEW, url).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(this, R.string.no_app_for_link, Toast.LENGTH_SHORT).show()
        }
    }

    /** Back walks the site's history first, then leaves the app. */
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onDestroy() {
        // Guarded: onCreate can fail before webView is assigned, and
        // lateinit access here would mask the real crash with a second one.
        if (::webView.isInitialized) webView.destroy()
        super.onDestroy()
    }

    private companion object {
        /** --black from app/styles/variables.css. */
        const val BRAND_BLACK = "#0d0d0d"
    }
}