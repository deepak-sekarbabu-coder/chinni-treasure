# Chinni Treasure — Architecture Diagrams

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Client["🌐 Client (Browser)"]
        direction TB
        React["React 19 SPA<br/>App Router Pages"]
        CartState["CartProvider<br/>localStorage + Cookie Sync"]
        ReactQuery["React Query v5<br/>Client Cache Layer"]
        RazorpaySDK["Razorpay Checkout.js<br/>Payment Modal"]
    end

    subgraph NextServer["⚡ Next.js 16 Server"]
        direction TB
        Middleware["proxy.ts Middleware<br/>JWT Auth + Axiom Logging"]
        AppRouter["App Router Pages<br/>RSC + Client Components"]
        APIRoutes["API Route Handlers<br/>/api/*"]
        PrismaClient["Prisma Client 7.8"]
    end

    subgraph Security["🔒 Security Layer"]
        RateLimiter["Rate Limiter<br/>Redis / In-Memory"]
        CSRF["CSRF Origin Check<br/>Origin + Referer"]
        Sanitizer["Input Sanitizer<br/>XSS Prevention"]
        Auth["JWT Auth<br/>HS256 + HttpOnly Cookie"]
    end

    subgraph Cache["📦 Caching Layer"]
        Redis["Redis<br/>Shared Cache"]
        MemFallback["In-Memory Fallback<br/>Per-Instance"]
        CacheInvalidation["Cache Invalidation<br/>SCAN + DEL"]
    end

    subgraph External["🌍 External Services"]
        PostgreSQL["PostgreSQL Database"]
        RedisCloud["Redis Cloud<br/>30 MB Free Tier"]
        RazorpayAPI["Razorpay API<br/>Orders + Verify"]
        Axiom["Axiom<br/>Structured Logging"]
        Imgur["imgur.gg<br/>Product Images"]
    end

    React -->|"HTTP/HTTPS"| Middleware
    Middleware -->|"Admin Guard"| AppRouter
    AppRouter -->|"RSC Fetch"| APIRoutes
    APIRoutes -->|"Query"| PrismaClient
    PrismaClient -->|"SQL"| PostgreSQL
    APIRoutes -->|"Auth Check"| Auth
    APIRoutes -->|"Rate Check"| RateLimiter
    APIRoutes -->|"Origin Verify"| CSRF
    APIRoutes -->|"Cache Read/Write"| Redis
    Redis <-.->|"Sync"| RedisCloud
    Redis <-.->|"Fallback"| MemFallback
    APIRoutes -->|"Invalidate"| CacheInvalidation
    ReactQuery -->|"Data Fetch"| APIRoutes
    RazorpaySDK -->|"Payment"| RazorpayAPI
    APIRoutes -->|"Log"| Axiom
    React -.->|"Image URLs"| Imgur
    CartState <-->|"Cookie Sync"| AppRouter

    classDef clientStyle fill:#4F46E5,stroke:#3730A3,color:#FFFFFF
    classDef serverStyle fill:#059669,stroke:#047857,color:#FFFFFF
    classDef securityStyle fill:#DC2626,stroke:#B91C1C,color:#FFFFFF
    classDef cacheStyle fill:#D97706,stroke:#B45309,color:#FFFFFF
    classDef externalStyle fill:#7C3AED,stroke:#6D28D9,color:#FFFFFF

    class React,CartState,ReactQuery,RazorpaySDK clientStyle
    class Middleware,AppRouter,APIRoutes,PrismaClient serverStyle
    class RateLimiter,CSRF,Sanitizer,Auth securityStyle
    class Redis,MemFallback,CacheInvalidation cacheStyle
    class PostgreSQL,RedisCloud,RazorpayAPI,Axiom,Imgur externalStyle
```

---

## 2. Database Entity Relationship Diagram

```mermaid
erDiagram
    Category ||--o{ Product : "has many"
    Product ||--o{ ProductImage : "has many"
    Product ||--o{ OrderItem : "referenced in"
    Order ||--o{ OrderItem : "contains"
    Order ||--o{ OrderStatusHistory : "tracks"

    Category {
        int id PK "Auto-increment"
        varchar(100) name "Display name"
        varchar(100) slug UK "URL-friendly"
        text description "Optional"
        int displayOrder "Sort order"
        boolean isActive "Visibility toggle"
        datetime createdAt
        datetime updatedAt
    }

    Product {
        uuid id PK "Random UUID"
        varchar(50) sku UK "Stock keeping unit (optional)"
        varchar(255) name "Product title"
        int categoryId FK "Nullable"
        text description "Markdown content"
        decimal price "10,2 precision"
        decimal compareAtPrice "Original price"
        int stockQuantity "Available units"
        varchar(500) imageUrl "Primary image"
        enum badge "bestseller|new|premium|limited|luxury"
        boolean isActive "Catalogue visibility"
        varchar(500) visibleHostnames "Domain filtering"
        datetime deletedAt "Soft delete"
        datetime createdAt
        datetime updatedAt
    }

    ProductImage {
        uuid id PK "Random UUID"
        uuid productId FK "Parent product"
        varchar(500) url "Image URL"
        boolean isPrimary "Primary flag"
        int displayOrder "Sort order"
        datetime createdAt
    }

    Order {
        uuid id PK "Random UUID"
        varchar(20) orderNumber UK "Human-readable"
        varchar(255) customerName "Full name"
        varchar(255) customerEmail "Email address"
        varchar(20) customerPhone "Phone number"
        varchar(255) addressLine1 "Address"
        varchar(255) addressLine2 "Apt/Suite"
        varchar(100) city "City"
        varchar(2) stateCode "Indian state"
        varchar(6) postalCode "PIN code"
        varchar(2) countryCode "Default IN"
        enum status "pending→approved→packaging→shipped→delivered"
        varchar(100) trackingId "Courier tracking"
        decimal subtotal "Item total"
        decimal shippingCost "Shipping"
        decimal totalAmount "Grand total"
        varchar(100) transactionId "Razorpay ID"
        text customerNotes "Buyer notes"
        text adminNotes "Admin notes"
        int version "Optimistic locking"
        datetime createdAt
        datetime updatedAt
    }

    OrderItem {
        uuid id PK "Random UUID"
        uuid orderId FK "Parent order"
        uuid productId FK "Nullable on delete"
        varchar(255) productName "Snapshot name"
        decimal unitPrice "Snapshot price"
        int quantity "Ordered qty"
        datetime createdAt
    }

    OrderStatusHistory {
        uuid id PK "Random UUID"
        uuid orderId FK "Parent order"
        enum status "Status snapshot"
        text notes "Change reason"
        datetime createdAt
    }

    Admin {
        uuid id PK "Random UUID"
        varchar(50) username UK "Login name"
        varchar(255) email UK "Email address"
        varchar(255) passwordHash "bcrypt hash"
        enum role "admin|super_admin"
        boolean isActive "Login allowed"
        datetime lastLoginAt "Last successful login"
        datetime createdAt
        datetime updatedAt
    }
```

---

## 3. Request Pipeline & Middleware Flow

```mermaid
flowchart TD
    Start(("🌐 Incoming<br/>Request"))
    
    Start --> AxiomLog["Axiom Request Logging<br/>Structured metadata"]
    AxiomLog --> IsAdminPath{"Path starts<br/>with /admin?"}
    
    IsAdminPath -->|"No"| Next["✅ NextResponse.next()"]
    IsAdminPath -->|"/admin/login"| AllowLogin["✅ Allow Login Page"]
    IsAdminPath -->|"Other /admin"| HasCookie{"Has 'session'<br/>cookie?"}
    
    HasCookie -->|"No"| RedirectLogin["🔄 Redirect → /admin/login"]
    HasCookie -->|"Yes"| VerifyJWT{"JWT Verify<br/>HS256"}
    
    VerifyJWT -->|"Invalid / Expired"| RedirectLogin2["🔄 Redirect → /admin/login"]
    VerifyJWT -->|"Valid"| Next2["✅ NextResponse.next()"]
    
    Next --> PageRender["📄 Render Page / API"]
    AllowLogin --> PageRender
    Next2 --> PageRender
    
    PageRender --> IsAPI{"Is API<br/>Route?"}
    IsAPI -->|"Yes"| RateLimit["Rate Limiter Check"]
    IsAPI -->|"No"| RSC["React Server Component"]
    
    RateLimit --> Allowed{"Within<br/>Limit?"}
    Allowed -->|"No"| TooMany["🚫 429 Too Many Requests"]
    Allowed -->|"Yes"| CSRFCheck{"CSRF Origin<br/>Valid?"}
    
    CSRFCheck -->|"POST/PUT/DELETE<br/>Bad Origin"| Forbidden["🚫 403 Forbidden"]
    CSRFCheck -->|"GET/HEAD/OPTIONS<br/>or Valid Origin"| Handler["📝 Route Handler"]
    
    Handler --> ZodValidate["Zod Schema<br/>Validation"]
    ZodValidate -->|"Invalid"| BadRequest["🚫 400 Bad Request"]
    ZodValidate -->|"Valid"| BusinessLogic["⚙️ Business Logic"]
    
    BusinessLogic --> DB["PostgreSQL<br/>via Prisma"]
    DB --> CacheCheck{"Cache<br/>Needed?"}
    CacheCheck -->|"Public Data"| RedisWrite["Write to Redis<br/>+ Memory Fallback"]
    CacheCheck -->|"Mutations"| Invalidate["Invalidate<br/>Related Caches"]
    CacheCheck -->|"No Cache"| Respond["📤 JSON Response"]
    RedisWrite --> Respond
    Invalidate --> Respond
    
    RSC --> ReactQuery["React Query<br/>Client Fetch"]

    classDef startEnd fill:#1E1B4B,stroke:#4338CA,color:#FFFFFF,stroke-width:3px
    classDef pass fill:#059669,stroke:#047857,color:#FFFFFF
    classDef block fill:#DC2626,stroke:#B91C1C,color:#FFFFFF
    classDef process fill:#2563EB,stroke:#1D4ED8,color:#FFFFFF
    classDef decision fill:#F59E0B,stroke:#D97706,color:#000000
    classDef cache fill:#7C3AED,stroke:#6D28D9,color:#FFFFFF

    class Start startEnd
    class Next,AllowLogin,Next2 pass
    class RedirectLogin,RedirectLogin2,TooMany,Forbidden,BadRequest block
    class AxiomLog,PageRender,RateLimit,CSRFCheck,ZodValidate,BusinessLogic,DB,Handler,RSC,ReactQuery process
    class IsAdminPath,HasCookie,VerifyJWT,IsAPI,Allowed,CacheCheck decision
    class RedisWrite,Invalidate,Respond cache
```

---

## 4. Order Status State Machine

```mermaid
stateDiagram-v2
    direction LR

    [*] --> pending: Customer Places Order

    pending --> approved: Admin Approves
    pending --> rejected: Admin Rejects
    
    rejected --> [*]: Restores Stock

    approved --> packaging: Admin Begins Packaging

    packaging --> shipped: Admin Adds Tracking ID

    shipped --> delivered: Admin Confirms Delivery

    state "Stock Impact" as stock_note {
        note right of rejected
            Stock is restored for
            all items in the order
        end note
    }

    note right of packaging
        Tracking ID is mandatory
        before shipping transition
    end note

    classDef pendingStyle fill:#F59E0B,stroke:#D97706,color:#000000
    classDef approvedStyle fill:#3B82F6,stroke:#2563EB,color:#FFFFFF
    classDef packagingStyle fill:#8B5CF6,stroke:#7C3AED,color:#FFFFFF
    classDef shippedStyle fill:#EC4899,stroke:#DB2777,color:#FFFFFF
    classDef deliveredStyle fill:#10B981,stroke:#059669,color:#FFFFFF
    classDef rejectedStyle fill:#EF4444,stroke:#DC2626,color:#FFFFFF

    class pending pendingStyle
    class approved approvedStyle
    class packaging packagingStyle
    class shipped shippedStyle
    class delivered deliveredStyle
    class rejected rejectedStyle
```

---

## 5. Caching Architecture

```mermaid
flowchart LR
    subgraph WritePath["✏️ Cache Write Path"]
        API["API Route Handler"]
        API -->|miss| RedisSet["Redis SET<br/>namespace:key<br/>EX ttlSeconds"]
        API -->|miss| MemSet["In-Memory Map<br/>namespace:key → data"]
        RedisSet -.->|"on failure"| MemSet
    end

    subgraph ReadPath["📖 Cache Read Path"]
        Consumer["Consumer Route"]
        Consumer --> RedisGet["Redis GET<br/>namespace:key"]
        RedisGet -->|hit| ReturnRedis["Return Parsed JSON"]
        RedisGet -->|miss/null| MemGet["Memory Map.get<br/>namespace:key"]
        RedisGet -.->|"on error"| MemGet
        MemGet -->|hit| ReturnMem["Return Cached Data"]
        MemGet -->|miss| FetchDB["Fetch from PostgreSQL<br/>via Prisma"]
        FetchDB --> Populate["Populate Both Stores"]
    end

    subgraph Invalidations["🗑️ Invalidation Patterns"]
        CatMutation["Catalog Mutation<br/>Create/Update/Delete Product or Category"]
        CatMutation --> ScanDEL["SCAN + DEL<br/>products:*<br/>categories:*<br/>catlatest:*<br/>catpage:*<br/>recent:*"]
        
        OrderMutation["Order Status Change"]
        OrderMutation --> OrderDEL["DEL order:{id}<br/>SCAN + DEL track:*"]
    end

    subgraph TTLs["⏱️ Cache TTLs (from route Cache-Control headers)"]
        Products["Products Listing<br/>30s"]
        Categories["Categories List<br/>300s"]
        CatPage["Category Page<br/>60s"]
        CatLatest["Latest in Category<br/>60s"]
        Recent["Recent Products<br/>60s"]
        OrderDetail["Order Detail<br/>30s"]
        Tracking["Tracking Lookup<br/>15s"]
        Stats["Admin Stats<br/>30s (private)"]
    end

    classDef writeStyle fill:#059669,stroke:#047857,color:#FFFFFF
    classDef readStyle fill:#2563EB,stroke:#1D4ED8,color:#FFFFFF
    classDef invalidStyle fill:#DC2626,stroke:#B91C1C,color:#FFFFFF
    classDef ttlStyle fill:#D97706,stroke:#B45309,color:#FFFFFF

    class API,RedisSet,MemSet writeStyle
    class Consumer,RedisGet,ReturnRedis,MemGet,ReturnMem,FetchDB,Populate readStyle
    class CatMutation,ScanDEL,OrderMutation,OrderDEL invalidStyle
    class Products,Categories,CatPage,CatLatest,Recent,OrderDetail,Tracking,Stats ttlStyle
```

---

## 6. Cart Synchronization Flow

```mermaid
sequenceDiagram
    autonumber
    participant Browser as 🌐 Browser
    participant CartProvider as 📦 CartProvider<br/>(React Context)
    participant LocalStorage as 💾 localStorage<br/>"luxe_cart"
    participant Cookie as 🍪 "cart" Cookie<br/>(SameSite=Lax)
    participant Server as ⚡ Server<br/>(Next.js)
    participant DB as 🗄️ PostgreSQL

    Note over Browser,DB: Guest adds items to cart

    Browser->>CartProvider: addItem(product)
    CartProvider->>CartProvider: Validate stock<br/>Check max quantity
    CartProvider->>LocalStorage: saveCart(items)
    CartProvider->>Cookie: setCartCookieClient(items)
    Note right of Cookie: Cookie format:<br/>[{productId, quantity}]

    Note over Browser,DB: Guest proceeds to checkout

    Browser->>Server: POST /api/create-order
    Server->>Cookie: getCartFromCookies()
    Cookie-->>Server: CartItem[] (productId + qty)
    Server->>DB: Validate products exist<br/>and have sufficient stock
    Server->>DB: Decrement stock (transaction)
    Server->>DB: Create Order + OrderItems
    Server-->>Browser: { orderId, razorpayOrder }

    Note over Browser,DB: Payment completes

    Browser->>Server: POST /api/verify-payment
    Server->>DB: Update order with transactionId
    Server->>Browser: { success: true }
    Browser->>CartProvider: clearCart()
    CartProvider->>LocalStorage: Remove "luxe_cart"
    CartProvider->>Cookie: Expire "cart" cookie
```

---

## 7. Payment Flow (Razorpay + Manual Fallback)

```mermaid
flowchart TD
    Start["🛒 Checkout Page<br/>Customer Fills Address"]
    
    Start --> ValidateAddress{"Address<br/>Valid?"}
    ValidateAddress -->|"No: Invalid PIN,<br/>phone, or state"| ShowError["❌ Validation Error"]
    ValidateAddress -->|"Yes"| SelectPayment{"Payment<br/>Method?"}
    
    SelectPayment -->|"Online (Razorpay)"| CreateOrder["POST /api/create-order<br/>Server creates Razorpay order"]
    SelectPayment -->|"UPI / Bank Transfer"| ManualFlow["Manual Payment<br/>Display UPI ID / Bank Details"]
    
    CreateOrder --> RateLimit{"Rate Limit<br/>OK?"}
    RateLimit -->|"Exceeded"| TooMany["🚫 429"]
    RateLimit -->|"OK"| CSRF{"CSRF<br/>Valid?"}
    CSRF -->|"Failed"| Forbidden["🚫 403"]
    CSRF -->|"Passed"| StockCheck{"Stock<br/>Available?"}
    
    StockCheck -->|"Insufficient"| OOS["🚫 Out of Stock"]
    StockCheck -->|"OK"| Decrement["Decrement Stock<br/>(Prisma Transaction)"]
    Decrement --> CreateRZP["Create Razorpay Order<br/>razorpay.orders.create()"]
    CreateRZP --> ReturnClient["Return order_id<br/>+ razorpay_key"]
    
    ReturnClient --> OpenModal["Open Razorpay<br/>Checkout Modal"]
    OpenModal --> UserPays{"Payment<br/>Result?"}
    UserPays -->|"Success"| Verify["POST /api/verify-payment<br/>HMAC Signature Check"]
    UserPays -->|"Failed/Cancel"| RestoreStock["Restore Stock<br/>(background)"]
    
    Verify --> HMAC{"HMAC<br/>Valid?"}
    HMAC -->|"Invalid"| RejectOrder["Reject Order<br/>+ Restore Stock"]
    HMAC -->|"Valid"| Confirm["✅ Order Confirmed<br/>transactionId saved"]
    
    Confirm --> Redirect["→ /confirmation/[id]"]
    
    ManualFlow --> ShowDetails["Show Payment Details<br/>+ Order Created as pending"]
    ShowDetails --> AdminApprove["Admin Reviews<br/>in /admin panel"]

    classDef entry fill:#4F46E5,stroke:#3730A3,color:#FFFFFF
    classDef process fill:#2563EB,stroke:#1D4ED8,color:#FFFFFF
    classDef decision fill:#F59E0B,stroke:#D97706,color:#000000
    classDef success fill:#059669,stroke:#047857,color:#FFFFFF
    classDef error fill:#DC2626,stroke:#B91C1C,color:#FFFFFF
    classDef payment fill:#7C3AED,stroke:#6D28D9,color:#FFFFFF

    class Start entry
    class CreateOrder,Decrement,CreateRZP,ReturnClient,OpenModal,Verify,ShowDetails,AdminApprove process
    class ValidateAddress,SelectPayment,RateLimit,CSRF,StockCheck,UserPays,HMAC decision
    class Confirm,Redirect success
    class ShowError,TooMany,Forbidden,OOS,RejectOrder,RestoreStock error
    class ManualFlow,OpenModal payment
```

---

## 8. Authentication & Admin Security Flow

```mermaid
flowchart TB
    subgraph Login["🔐 Admin Login Flow"]
        LoginReq["POST /api/auth/login<br/>username + password"]
        LoginReq --> RateCheck{"Rate Limit<br/>≤ 5 / 60s"}
        RateCheck -->|"Exceeded"| Block["🚫 429"]
        RateCheck -->|"OK"| CSRFLogin{"CSRF Origin<br/>Valid?"}
        CSRFLogin -->|"No"| Deny["🚫 403"]
        CSRFLogin -->|"Yes"| Lookup["Find Admin<br/>by username"]
        Lookup -->|"Not found"| BadCreds["🚫 401"]
        Lookup -->|"Found"| Bcrypt["bcrypt.compare<br/>password → hash"]
        Bcrypt -->|"Mismatch"| BadCreds
        Bcrypt -->|"Match"| SignJWT["Sign JWT<br/>HS256, 24h expiry"]
        SignJWT --> SetCookie["Set HttpOnly Cookie<br/>'session' = JWT<br/>SameSite=Lax, Secure"]
        SetCookie --> Dashboard["→ /admin Dashboard"]
    end

    subgraph Protected["🛡️ Protected Route Guard"]
        AdminRoute["Admin Page Request"]
        AdminRoute --> Proxy["proxy.ts Middleware"]
        Proxy --> ExtractCookie["Extract 'session' cookie"]
        ExtractCookie --> HasToken{"Token<br/>exists?"}
        HasToken -->|"No"| Redirect["🔄 → /admin/login"]
        HasToken -->|"Yes"| Verify["jose.jwtVerify<br/>HS256"]
        Verify -->|"Invalid/Expired"| Redirect
        Verify -->|"Valid"| Allow["✅ Serve Admin Page"]
    end

    subgraph Session["📋 Session Management"]
        MeEndpoint["GET /api/auth/me"]
        MeEndpoint --> CheckAuth["checkAuth()"]
        CheckAuth --> ParseSession["Parse JWT payload"]
        ParseSession --> ZodSchema["Validate with Zod<br/>{id, username, role}"]
        ZodSchema -->|"Valid"| ReturnAdmin["Return Admin Info"]
        ZodSchema -->|"Invalid"| ReturnNull["Return null"]
    end

    subgraph Logout["🚪 Logout"]
        LogoutReq["POST /api/auth/logout"]
        LogoutReq --> ClearCookie["Clear 'session' cookie<br/>Max-Age=0"]
        ClearCookie --> LoginPage["→ /admin/login"]
    end

    classDef loginStyle fill:#2563EB,stroke:#1D4ED8,color:#FFFFFF
    classDef guardStyle fill:#7C3AED,stroke:#6D28D9,color:#FFFFFF
    classDef sessionStyle fill:#059669,stroke:#047857,color:#FFFFFF
    classDef logoutStyle fill:#D97706,stroke:#B45309,color:#FFFFFF
    classDef errorStyle fill:#DC2626,stroke:#B91C1C,color:#FFFFFF

    class LoginReq,Lookup,Bcrypt,SignJWT,SetCookie,Dashboard loginStyle
    class AdminRoute,Proxy,ExtractCookie,Verify,Allow guardStyle
    class MeEndpoint,CheckAuth,ParseSession,ZodSchema,ReturnAdmin,ReturnNull sessionStyle
    class LogoutReq,ClearCookie,LoginPage logoutStyle
    class Block,Deny,BadCreds,Redirect errorStyle
```

---

## 9. Component Architecture

```mermaid
graph TB
    subgraph Root["app/layout.tsx — Root Layout"]
        Providers["Providers<br/>CartProvider + QueryProvider + ToastProvider"]
        Navbar["Navbar + NavCartDropdown"]
        Footer["Footer + FooterClientWrapper"]
    end

    subgraph Pages["📄 Page Routes"]
        Home["/ — Home Page<br/>LatestInEveryCategory"]
        Catalogue["/catalogue<br/>Product Listing + Pagination"]
        CatalogueDetail["/catalogue/[id]<br/>ProductDetailsContent"]
        Category["/category/[slug]<br/>Category Browse"]
        Order["/order<br/>Checkout Flow"]
        Confirmation["/confirmation/[id]<br/>Order Confirmed"]
        Track["/track<br/>Order Tracking"]
        Admin["/admin<br/>Admin Dashboard"]
        AdminLogin["/admin/login"]
        Docs["/docs<br/>API Documentation"]
    end

    subgraph AdminComponents["⚙️ Admin Components"]
        AdminTabs["AdminTabs"]
        AdminHeader["AdminHeader"]
        AdminCatalogue["AdminCataloguePanel"]
        AdminCategories["AdminCategoriesPanel"]
        AdminOrders["AdminOrdersPanel"]
        AdminCharts["AdminChartsSection"]
        AdminStats["AdminStatsGrid"]
        ProductForm["ProductFormModal"]
        CategoryForm["CategoryFormModal"]
        OrderDetail["OrderDetailModal"]
        TrackingModal["AdminTrackingModal"]
        PrintLabel["PrintShippingLabelModal"]
    end

    subgraph SharedUI["🎨 Shared UI"]
        ProductCard["ProductCard"]
        ProductImage["ProductImageGallery"]
        FallbackImage["FallbackImage"]
        StatusBadge["StatusBadge"]
        StockBadge["StockBadge"]
        LoadingSpinner["LoadingSpinner"]
        Skeleton["SkeletonLoader"]
        Breadcrumbs["Breadcrumbs"]
        SectionHeader["SectionHeader"]
        Toast["ToastProvider"]
        JsonLd["JsonLd (SEO)"]
        Markdown["Markdown"]
        ShippingNudge["ShippingNudgePopup"]
    end

    subgraph Hooks["🪝 Custom Hooks"]
        AdminData["useAdminData"]
        AdminSession["useAdminSession"]
        AdminMutations["useAdminMutations"]
        AdminCatalogueCtrl["useAdminCatalogueController"]
        AdminCategoriesCtrl["useAdminCategoriesController"]
        AdminOrdersCtrl["useAdminOrdersController"]
        AdminHeaderActions["useAdminHeaderActions"]
        TrackSearch["useTrackSearch"]
        ResponsivePage["useResponsivePageSize"]
        ShippingNudgeHook["useShippingNudge"]
    end

    subgraph Lib["📚 Core Libraries"]
        AuthLib["auth.ts<br/>JWT + bcrypt"]
        PrismaLib["prisma.ts<br/>Database Client"]
        RedisLib["redis.ts + redis-cache.ts"]
        CacheInv["cache-invalidate.ts"]
        RateLimit["rate-limiter.ts"]
        CSRFLib["csrf.ts + csrf-helpers.ts"]
        Sanitize["sanitize.ts"]
        RazorpayLib["razorpay.ts"]
        CartCookie["cart-cookie.ts"]
    end

    Providers --> Pages
    Pages --> SharedUI
    Admin --> AdminComponents
    AdminComponents --> SharedUI
    AdminComponents --> Hooks
    Hooks --> Lib

    classDef layoutStyle fill:#1E1B4B,stroke:#4338CA,color:#FFFFFF
    classDef pageStyle fill:#2563EB,stroke:#1D4ED8,color:#FFFFFF
    classDef adminStyle fill:#7C3AED,stroke:#6D28D9,color:#FFFFFF
    classDef uiStyle fill:#059669,stroke:#047857,color:#FFFFFF
    classDef hookStyle fill:#D97706,stroke:#B45309,color:#FFFFFF
    classDef libStyle fill:#DC2626,stroke:#B91C1C,color:#FFFFFF

    class Providers,Navbar,Footer layoutStyle
    class Home,Catalogue,CatalogueDetail,Category,Order,Confirmation,Track,Admin,AdminLogin,Docs pageStyle
    class AdminTabs,AdminHeader,AdminCatalogue,AdminCategories,AdminOrders,AdminCharts,AdminStats,ProductForm,CategoryForm,OrderDetail,TrackingModal,PrintLabel adminStyle
    class ProductCard,ProductImage,FallbackImage,StatusBadge,StockBadge,LoadingSpinner,Skeleton,Breadcrumbs,SectionHeader,Toast,JsonLd,Markdown,ShippingNudge uiStyle
    class AdminData,AdminSession,AdminMutations,AdminCatalogueCtrl,AdminCategoriesCtrl,AdminOrdersCtrl,AdminHeaderActions,TrackSearch,ResponsivePage,ShippingNudgeHook hookStyle
    class AuthLib,PrismaLib,RedisLib,CacheInv,RateLimit,CSRFLib,Sanitize,RazorpayLib,CartCookie libStyle
```

---

## 10. Deployment & Container Architecture

```mermaid
graph TB
    subgraph Container["🐳 Docker / Podman Container"]
        direction TB
        Node["Node.js Runtime<br/>Alpine Linux"]
        
        subgraph NextApp["Next.js Application"]
            StaticFiles[".next/static<br/>Static Assets"]
            ServerPages["Server Pages<br/>RSC + SSR"]
            APIHandler["API Route Handlers"]
        end
        
        subgraph ProcessMgmt["Process Management"]
            NextStart["npm start<br/>Production Server"]
        end
    end

    subgraph Infra["🏗️ Infrastructure"]
        direction TB
        DB["PostgreSQL<br/>DATABASE_URL"]
        RedisInfra["Redis Cloud<br/>REDIS_URL<br/>(optional)"]
        RazorpayInfra["Razorpay API<br/>RAZORPAY_KEY_ID/SECRET"]
        AxiomInfra["Axiom<br/>NEXT_PUBLIC_AXIOM_TOKEN"]
    end

    subgraph Vercel["☁️ Vercel Deployment"]
        EdgeMiddleware["Edge Middleware<br/>proxy.ts"]
        ServerlessFunctions["Serverless Functions<br/>/api/* Routes"]
        ImageOpt["Image Optimization<br/>(skipped for imgur)"]
        Analytics["Vercel Analytics<br/>+ Speed Insights"]
    end

    subgraph Env["🔐 Environment Variables"]
        DBURL["DATABASE_URL"]
        DIRECTURL["DIRECT_URL"]
        JWT["JWT_SECRET"]
        SITEURL["NEXT_PUBLIC_SITE_URL"]
        CORS["ALLOWED_ORIGIN"]
        REDIS["REDIS_URL (optional)"]
        RZP_ID["NEXT_PUBLIC_RAZORPAY_KEY_ID"]
        RZP_SECRET["RAZORPAY_KEY_SECRET"]
        AXIOM_TOKEN["NEXT_PUBLIC_AXIOM_TOKEN"]
        AXIOM_DATASET["NEXT_PUBLIC_AXIOM_DATASET"]
        AXIOM_EDGE["NEXT_PUBLIC_AXIOM_EDGE"]
        CRON["CRON_SECRET"]
        IMG_OPT["NEXT_PUBLIC_IMAGE_UNOPTIMIZED"]
    end

    Container --> Infra
    Vercel --> Container
    Env --> Container

    classDef containerStyle fill:#2563EB,stroke:#1D4ED8,color:#FFFFFF
    classDef infraStyle fill:#7C3AED,stroke:#6D28D9,color:#FFFFFF
    classDef vercelStyle fill:#059669,stroke:#047857,color:#FFFFFF
    classDef envStyle fill:#D97706,stroke:#B45309,color:#FFFFFF

    class Node,StaticFiles,ServerPages,APIHandler,NextStart containerStyle
    class DB,RedisInfra,RazorpayInfra,AxiomInfra infraStyle
    class EdgeMiddleware,ServerlessFunctions,ImageOpt,Analytics vercelStyle
    class DBURL,DIRECTURL,JWT,SITEURL,CORS,REDIS,RZP_ID,RZP_SECRET,AXIOM_TOKEN,AXIOM_DATASET,AXIOM_EDGE,CRON,IMG_OPT envStyle
```
