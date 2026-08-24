const VaeroApp = {

    id: "vaero",

    title: "VAERO",

    cartStorageVersion: 1,
    baseCurrency: "USD",

getCurrencyStorageKey(){

    return `vaero:commerce:currency:${this.getCustomerId()}`;

},

getDisplayCurrency(){

    const savedCurrency =
        localStorage.getItem(
            this.getCurrencyStorageKey()
        );

    return savedCurrency || this.baseCurrency;

},

setDisplayCurrency(currencyCode){

    const normalizedCurrency =
        String(currencyCode || "")
            .trim()
            .toUpperCase();

    if(!normalizedCurrency){
        return false;
    }

    localStorage.setItem(
        this.getCurrencyStorageKey(),
        normalizedCurrency
    );

    return true;

},

    products: {

    device: {
        id: "device",
        sku: "VAERO-DEVICE-01",
        type: "CİHAZ",
        name: "VAERO",
        subtitle: "Kişisel Atmosfer Sistemi",
        description:
            "VAERO atmosferlerini fiziksel dünyaya taşıyan araç içi kişisel atmosfer sistemi.",
        price: {
            amount: 52,
            currency: "USD"
        },
        variants: []
    },

    "white-tea": {
        id: "white-tea",
        sku: "VAERO-WT",
        type: "ATMOSFER",
        name: "White Tea",
        subtitle: "Temiz ve ferah atmosfer",
        description:
            "Hafif, temiz ve dengeli karakteriyle yolculuğun atmosferini dönüştürür.",
        variants: [
            {
                id: "10ml",
                sku: "VAERO-WT-10",
                label: "10 ml",
                volumeMl: 10,
                price: {
                    amount: 10,
                    currency: "USD"
                }
            },
            {
                id: "30ml",
                sku: "VAERO-WT-30",
                label: "30 ml",
                volumeMl: 30,
                price: {
                    amount: 24,
                    currency: "USD"
                }
            },
            {
                id: "50ml",
                sku: "VAERO-WT-50",
                label: "50 ml",
                volumeMl: 50,
                price: {
                    amount: 35,
                    currency: "USD"
                }
            },
            {
                id: "100ml",
                sku: "VAERO-WT-100",
                label: "100 ml",
                volumeMl: 100,
                price: {
                    amount: 60,
                    currency: "USD"
                }
            }
        ]
    },

    ocean: {
        id: "ocean",
        sku: "VAERO-OC",
        type: "ATMOSFER",
        name: "Ocean",
        subtitle: "Serin ve dengeli atmosfer",
        description:
            "Serin, sakin ve ferah karakteriyle daha açık bir atmosfer oluşturur.",
        variants: [
            {
                id: "10ml",
                sku: "VAERO-OC-10",
                label: "10 ml",
                volumeMl: 10,
                price: {
                    amount: 10,
                    currency: "USD"
                }
            },
            {
                id: "30ml",
                sku: "VAERO-OC-30",
                label: "30 ml",
                volumeMl: 30,
                price: {
                    amount: 24,
                    currency: "USD"
                }
            },
            {
                id: "50ml",
                sku: "VAERO-OC-50",
                label: "50 ml",
                volumeMl: 50,
                price: {
                    amount: 35,
                    currency: "USD"
                }
            },
            {
                id: "100ml",
                sku: "VAERO-OC-100",
                label: "100 ml",
                volumeMl: 100,
                price: {
                    amount: 60,
                    currency: "USD"
                }
            }
        ]
    }

},

    getProductVariant(productId, variantId = null){

    const product =
        this.products[productId];

    if(!product){
        return null;
    }

    const variants =
        Array.isArray(product.variants)
            ? product.variants
            : [];

    if(variants.length === 0){
        return null;
    }

    return variants.find(variant =>
        variant.id === variantId
    ) || null;

},

getDefaultProductVariant(productId){

    const product =
        this.products[productId];

    if(
        !product ||
        !Array.isArray(product.variants) ||
        product.variants.length === 0
    ){
        return null;
    }

    return product.variants[0];

},

getCartItemKey(productId, variantId = null){

    return variantId
        ? `${productId}:${variantId}`
        : productId;

},

getProductPrice(productId, variantId = null){

    const product =
        this.products[productId];

    if(!product){
        return null;
    }

    const variant =
        this.getProductVariant(
            productId,
            variantId
        );

    const price =
        variant
            ? variant.price
            : product.price;

    if(
        !price ||
        typeof price.amount !== "number"
    ){
        return null;
    }

    return {
        amount: price.amount,
        currency:
            price.currency ||
            this.baseCurrency
    };

},

    getCustomerId(){

        const entity =
            VAERO.engine.currentEntity;

        return entity && entity.id
            ? entity.id
            : "guest";

    },

    getCartStorageKey(){

        return `vaero:commerce:cart:${this.getCustomerId()}`;

    },

    createEmptyCart(){

        const now = Date.now();

        return {
            version: this.cartStorageVersion,
            customerId: this.getCustomerId(),
            baseCurrency: this.baseCurrency,
displayCurrency: this.getDisplayCurrency(),
            status: "active",
            items: [],
            createdAt: now,
            updatedAt: now
        };

    },

    normalizeCart(rawCart){

    if(
        !rawCart ||
        typeof rawCart !== "object"
    ){
        return this.createEmptyCart();
    }

    const normalizedItems =
        Array.isArray(rawCart.items)
            ? rawCart.items
                .map(item => {

                    if(
                        !item ||
                        typeof item !== "object"
                    ){
                        return null;
                    }

                    const product =
                        this.products[item.productId];

                    if(!product){
                        return null;
                    }

                    const quantity =
                        Math.max(
                            1,
                            Math.floor(
                                Number(item.quantity) || 1
                            )
                        );

                    const hasVariants =
                        Array.isArray(product.variants) &&
                        product.variants.length > 0;

                    let variantId =
                        item.variantId || null;

                    if(hasVariants){

                        const savedVariant =
                            this.getProductVariant(
                                product.id,
                                variantId
                            );

                        const resolvedVariant =
                            savedVariant ||
                            this.getDefaultProductVariant(
                                product.id
                            );

                        variantId =
                            resolvedVariant
                                ? resolvedVariant.id
                                : null;

                    }else{

                        variantId = null;

                    }

                    const variant =
                        this.getProductVariant(
                            product.id,
                            variantId
                        );

                    const price =
                        this.getProductPrice(
                            product.id,
                            variantId
                        );

                    return {
                        key:
                            this.getCartItemKey(
                                product.id,
                                variantId
                            ),
                        productId:
                            product.id,
                        variantId,
                        sku:
                            variant
                                ? variant.sku
                                : product.sku,
                        quantity,
                        unitPrice:
                            price,
                        addedAt:
                            Number(item.addedAt) ||
                            Date.now(),
                        updatedAt:
                            Number(item.updatedAt) ||
                            Date.now()
                    };

                })
                .filter(Boolean)
            : [];

    return {
        version: this.cartStorageVersion,
        customerId: this.getCustomerId(),
        baseCurrency: this.baseCurrency,
        displayCurrency:
            this.getDisplayCurrency(),
        status: "active",
        items: normalizedItems,
        createdAt:
            Number(rawCart.createdAt) ||
            Date.now(),
        updatedAt:
            Number(rawCart.updatedAt) ||
            Date.now()
    };

},
    loadCart(){

        const storageKey =
            this.getCartStorageKey();

        const savedCart =
            localStorage.getItem(storageKey);

        if(!savedCart){
            return this.createEmptyCart();
        }

        try {

            return this.normalizeCart(
                JSON.parse(savedCart)
            );

        } catch(error){

            console.error(
                "VAERO sepeti okunamadı:",
                error
            );

            return this.createEmptyCart();

        }

    },

    saveCart(cart){

        const normalizedCart =
            this.normalizeCart(cart);

        normalizedCart.updatedAt =
            Date.now();

        try {

            localStorage.setItem(
                this.getCartStorageKey(),
                JSON.stringify(normalizedCart)
            );

            return normalizedCart;

        } catch(error){

            console.error(
                "VAERO sepeti kaydedilemedi:",
                error
            );

            return null;

        }

    },

    addToCart(
    productId,
    variantId = null,
    quantity = 1
){

    const product =
        this.products[productId];

    if(!product){
        console.error(
            "Sepete eklenemedi: ürün bulunamadı.",
            productId
        );

        return null;
    }

    /*
     * Eski addToCart(productId, quantity)
     * çağrı biçimini geçici olarak destekler.
     */
    if(typeof variantId === "number"){
        quantity = variantId;
        variantId = null;
    }

    const variants =
        Array.isArray(product.variants)
            ? product.variants
            : [];

    let resolvedVariant = null;

    if(variants.length > 0){

        resolvedVariant =
            this.getProductVariant(
                productId,
                variantId
            ) ||
            this.getDefaultProductVariant(
                productId
            );

        if(!resolvedVariant){
            console.error(
                "Sepete eklenemedi: ürün varyantı bulunamadı.",
                {
                    productId,
                    variantId
                }
            );

            return null;
        }

        variantId =
            resolvedVariant.id;

    }else{

        variantId = null;

    }

    const safeQuantity =
        Math.max(
            1,
            Math.floor(
                Number(quantity) || 1
            )
        );

    const itemKey =
        this.getCartItemKey(
            productId,
            variantId
        );

    const unitPrice =
        this.getProductPrice(
            productId,
            variantId
        );

    if(!unitPrice){
        console.error(
            "Sepete eklenemedi: ürün fiyatı bulunamadı.",
            {
                productId,
                variantId
            }
        );

        return null;
    }

    const cart =
        this.loadCart();

    const existingItem =
        cart.items.find(item =>
            item.key === itemKey
        );

    const now =
        Date.now();

    if(existingItem){

        existingItem.quantity +=
            safeQuantity;

        existingItem.unitPrice =
            unitPrice;

        existingItem.updatedAt =
            now;

    }else{

        cart.items.push({
            key: itemKey,
            productId,
            variantId,
            sku:
                resolvedVariant
                    ? resolvedVariant.sku
                    : product.sku,
            quantity: safeQuantity,
            unitPrice,
            addedAt: now,
            updatedAt: now
        });

    }

    return this.saveCart(cart);

},
    updateCartItemQuantity(
    productId,
    variantId = null,
    quantity = 0
){

    const product =
        this.products[productId];

    if(!product){
        console.error(
            "Sepet güncellenemedi: ürün bulunamadı.",
            productId
        );

        return null;
    }

    const itemKey =
        this.getCartItemKey(
            productId,
            variantId
        );

    const cart =
        this.loadCart();

    const item =
        cart.items.find(cartItem =>
            cartItem.key === itemKey
        );

    if(!item){
        return cart;
    }

    const safeQuantity =
        Math.floor(
            Number(quantity) || 0
        );

    if(safeQuantity <= 0){

        cart.items =
            cart.items.filter(cartItem =>
                cartItem.key !== itemKey
            );

    }else{

        item.quantity =
            safeQuantity;

        item.updatedAt =
            Date.now();

    }

    return this.saveCart(cart);

},

increaseCartItem(
    productId,
    variantId = null
){

    const itemKey =
        this.getCartItemKey(
            productId,
            variantId
        );

    const cart =
        this.loadCart();

    const item =
        cart.items.find(cartItem =>
            cartItem.key === itemKey
        );

    if(!item){

        return this.addToCart(
            productId,
            variantId,
            1
        );

    }

    return this.updateCartItemQuantity(
        productId,
        variantId,
        item.quantity + 1
    );

},

decreaseCartItem(
    productId,
    variantId = null
){

    const itemKey =
        this.getCartItemKey(
            productId,
            variantId
        );

    const cart =
        this.loadCart();

    const item =
        cart.items.find(cartItem =>
            cartItem.key === itemKey
        );

    if(!item){
        return cart;
    }

    return this.updateCartItemQuantity(
        productId,
        variantId,
        item.quantity - 1
    );

},

removeFromCart(
    productId,
    variantId = null
){

    const itemKey =
        this.getCartItemKey(
            productId,
            variantId
        );

    const cart =
        this.loadCart();

    cart.items =
        cart.items.filter(item =>
            item.key !== itemKey
        );

    return this.saveCart(cart);

},

clearCart(){

    const emptyCart =
        this.createEmptyCart();

    return this.saveCart(emptyCart);

},

    getCartItemCount(){

        const cart =
            this.loadCart();

        return cart.items.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );

    },

    getCartSubtotal(){

    const cart =
        this.loadCart();

    const amount =
        cart.items.reduce(
            (total, item) => {

                const unitAmount =
                    Number(
                        item.unitPrice?.amount
                    ) || 0;

                return total +
                    (
                        unitAmount *
                        item.quantity
                    );

            },
            0
        );

    return {
        amount,
        currency:
            cart.baseCurrency ||
            this.baseCurrency
    };

},

    getCheckoutStorageKey(){

    return `vaero:commerce:checkout:${this.getCustomerId()}`;

},

    getOrdersStorageKey(){

    return `vaero:commerce:orders:${this.getCustomerId()}`;

},

    getPhysicalAssetsStorageKey(){

    return `vaero:physical-assets:${this.getCustomerId()}`;

},

    loadPhysicalAssets(){

    const savedAssets =
        localStorage.getItem(
            this.getPhysicalAssetsStorageKey()
        );

    if(!savedAssets){
        return [];
    }

    try {

        const assets =
            JSON.parse(savedAssets);

        return Array.isArray(assets)
            ? assets
            : [];

    } catch(error){

        console.error(
            "VAERO fiziksel varlıkları okunamadı:",
            error
        );

        return [];

    }

},

    createPhysicalAssetsFromOrder(order){

    if(
        !order ||
        !order.id ||
        !Array.isArray(order.items)
    ){
        return [];
    }

    const assets =
        this.loadPhysicalAssets();

    const now =
        Date.now();

    const createdAssets = [];

    order.items.forEach(item => {

        const sourceKey =
            `${order.id}:${item.key}`;

        const alreadyExists =
            assets.some(asset =>
                asset.sourceKey ===
                sourceKey
            );

        if(alreadyExists){
            return;
        }

        const product =
            this.products[item.productId];

        if(!product){
            return;
        }

        const variant =
            this.getProductVariant(
                product.id,
                item.variantId
            );

        const asset = {
            id:
                crypto.randomUUID(),
            sourceKey,
            sourceOrderId:
                order.id,
            ownerId:
                order.customerId,
            productId:
                product.id,
            variantId:
                item.variantId || null,
            sku:
                item.sku,
            name:
                product.name,
            type:
                product.type,
            variantLabel:
                variant
                    ? variant.label
                    : null,
            quantity:
                item.quantity,
            status:
                "ordered",
            createdAt:
                now,
            updatedAt:
                now
        };

        assets.unshift(asset);
        createdAssets.push(asset);

    });

    localStorage.setItem(
        this.getPhysicalAssetsStorageKey(),
        JSON.stringify(assets)
    );

    return createdAssets;

},

    loadOrders(){

    const savedOrders =
        localStorage.getItem(
            this.getOrdersStorageKey()
        );

    if(!savedOrders){
        return [];
    }

    try {

        const orders =
            JSON.parse(savedOrders);

        return Array.isArray(orders)
            ? orders
            : [];

    } catch(error){

        console.error(
            "VAERO siparişleri okunamadı:",
            error
        );

        return [];

    }

},

    createOrderFromCheckout(){

    const checkout =
        this.loadCheckoutDraft();

    if(
        !checkout ||
        checkout.status !== "paid" ||
        checkout.payment?.status !==
            "paid"
    ){
        return null;
    }

    const orders =
        this.loadOrders();

    const existingOrder =
        orders.find(order =>
            order.checkoutId ===
            checkout.id
        );

    if(existingOrder){

    this.createPhysicalAssetsFromOrder(
        existingOrder
    );

    return existingOrder;

}

    const now =
        Date.now();

    const order = {
        id:
            crypto.randomUUID(),
        checkoutId:
            checkout.id,
        customerId:
            checkout.customerId,
        status:
            "confirmed",
        fulfillmentStatus:
            "pending",
        currency:
            checkout.currency,
        items:
            checkout.items.map(item => ({
                ...item,
                unitPrice: {
                    ...item.unitPrice
                }
            })),
        totals: {
            ...checkout.totals
        },
        payment: {
            ...checkout.payment
        },
        createdAt:
            now,
        updatedAt:
            now
    };

    orders.unshift(order);

    localStorage.setItem(
        this.getOrdersStorageKey(),
        JSON.stringify(orders)
    );

    checkout.status =
        "order-created";

    checkout.orderId =
        order.id;

    checkout.updatedAt =
        now;

    localStorage.setItem(
        this.getCheckoutStorageKey(),
        JSON.stringify(checkout)
    );

        this.createPhysicalAssetsFromOrder(
    order
);

    return order;

},

loadCheckoutDraft(){

    const savedCheckout =
        localStorage.getItem(
            this.getCheckoutStorageKey()
        );

    if(!savedCheckout){
        return null;
    }

    try {

        const checkout =
            JSON.parse(savedCheckout);

        if(
            !checkout ||
            typeof checkout !== "object" ||
            !Array.isArray(checkout.items)
        ){
            return null;
        }

        return checkout;

    } catch(error){

        console.error(
            "VAERO checkout taslağı okunamadı:",
            error
        );

        return null;

    }

},

    createCheckoutDraft(){

    const cart =
        this.loadCart();

    if(cart.items.length === 0){
        return null;
    }

    const subtotal =
        this.getCartSubtotal();

    const now =
        Date.now();

    const checkout = {
        id:
            crypto.randomUUID(),
        customerId:
            this.getCustomerId(),
        status:
            "draft",
        currency:
            subtotal.currency,
        items:
            cart.items.map(item => ({
                key:
                    item.key,
                productId:
                    item.productId,
                variantId:
                    item.variantId || null,
                sku:
                    item.sku,
                quantity:
                    item.quantity,
                unitPrice:
                    {
                        ...item.unitPrice
                    }
            })),
        totals: {
            subtotal:
                subtotal.amount,
            shipping:
                null,
            tax:
                null,
            grandTotal:
                null
        },

        payment: {
            method:
                null,
            status:
                "unpaid",
            transactionId:
                null
        },
        
        createdAt:
            now,
        updatedAt:
            now
    };

    localStorage.setItem(
        this.getCheckoutStorageKey(),
        JSON.stringify(checkout)
    );

    return checkout;

},
    
formatMoney(
    amount,
    currency = this.baseCurrency
){

    try {

        return new Intl.NumberFormat(
            "en-US",
            {
                style: "currency",
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ).format(amount);

    } catch(error){

        return `${amount} ${currency}`;

    }

},

    setCheckoutPaymentMethod(method){

    const allowedMethods = [
        "card",
        "bank-transfer"
    ];

    if(!allowedMethods.includes(method)){
        return null;
    }

    const checkout =
        this.loadCheckoutDraft();

    if(!checkout){
        return null;
    }

    checkout.payment = {
        ...(checkout.payment || {}),
        method,
        status:
            checkout.payment?.status ||
            "unpaid",
        transactionId:
            checkout.payment?.transactionId ||
            null
    };

    checkout.updatedAt =
        Date.now();

    localStorage.setItem(
        this.getCheckoutStorageKey(),
        JSON.stringify(checkout)
    );

    return checkout;

},

    startCheckoutPayment(){

    const checkout =
        this.loadCheckoutDraft();

    if(
        !checkout ||
        !checkout.payment?.method ||
        checkout.items.length === 0
    ){
        return null;
    }

    const now =
        Date.now();

    checkout.status =
        "payment-pending";

    checkout.payment = {
        ...checkout.payment,
        status: "pending",
        attemptId:
            crypto.randomUUID(),
        transactionId: null,
        startedAt: now
    };

    checkout.updatedAt =
        now;

    localStorage.setItem(
        this.getCheckoutStorageKey(),
        JSON.stringify(checkout)
    );

    return checkout;

},

    completeCheckoutPayment(
    successful,
    failureReason = null
){

    const checkout =
        this.loadCheckoutDraft();

    if(
        !checkout ||
        checkout.payment?.status !==
            "pending"
    ){
        return null;
    }

    const now =
        Date.now();

    checkout.status =
        successful
            ? "paid"
            : "payment-failed";

    checkout.payment = {
        ...checkout.payment,
        status:
            successful
                ? "paid"
                : "failed",
        transactionId:
            successful
                ? crypto.randomUUID()
                : null,
        failureReason:
            successful
                ? null
                : (
                    failureReason ||
                    "payment-failed"
                ),
        completedAt: now
    };

    checkout.updatedAt =
        now;

    localStorage.setItem(
        this.getCheckoutStorageKey(),
        JSON.stringify(checkout)
    );

    return checkout;

},
    
    render(){

        const page =
            VAERO.engine.currentEntityPage || "vaero";

        if(page === "vaero-device"){
            return this.renderDevice();
        }

        if(page === "vaero-collection"){
            return this.renderCollection();
        }

        if(page === "vaero-cart"){
    return this.renderCart();
}

        if(page === "vaero-checkout"){
            return this.renderCheckout();
        }

        if(page === "vaero-order-success"){
    return this.renderOrderSuccess();
}
        
        if(page === "vaero-product"){
            return this.renderProduct(
                VAERO.engine.currentVaeroProduct
            );
        }

        return this.renderHome();

    },

    renderHome(){

        return `
            <section class="vaero-commerce-app">

                <header class="vaero-commerce-header">

                    <div>

                        <span class="vaero-commerce-eyebrow">
                            VAERO PHYSICAL
                        </span>

                        <h1>
                            Atmosferini Sen Belirle.
                        </h1>

                        <p>
                            VAERO cihazını ve atmosfer koleksiyonlarını keşfet.
                        </p>

                    </div>

                    <button
                        type="button"
                        class="vaero-commerce-id-btn"
                        data-action="entity:profile"
                    >
                        Müşteri ID
                        <span>→</span>
                    </button>

                    ${this.renderCartButton()}

                </header>

                <section class="vaero-commerce-hero">

                    <div class="vaero-commerce-hero-copy">

                        <span>
                            ARAÇ İÇİ KİŞİSEL ATMOSFER SİSTEMİ
                        </span>

                        <h2>
                            Fiziksel VAERO
                        </h2>

                        <p>
                            Dijital deneyimini fiziksel dünyaya taşı.
                        </p>

                        <div class="vaero-commerce-actions">

                            <button
                                type="button"
                                data-action="vaero:device"
                            >
                                Cihazı Keşfet
                            </button>

                            <button
                                type="button"
                                data-action="vaero:collection"
                            >
                                Atmosferleri Gör
                            </button>

                        </div>

                    </div>

                </section>

                <section class="vaero-commerce-section">

                    <div class="vaero-commerce-section-head">

                        <span>
                            VAERO ÜRÜNLERİ
                        </span>

                        <button
                            type="button"
                            data-action="vaero:collection"
                        >
                            Tümünü keşfet →
                        </button>

                    </div>

                    ${this.renderProductGrid()}

                </section>

            </section>
        `;

    },

    renderProductGrid(){

        return `
            <div class="vaero-commerce-products">

                ${Object.values(this.products)
                    .map(product => `
                        <button
                            type="button"
                            class="vaero-product-card"
                            data-product="${product.id}"
                            data-action="vaero:product"
                        >

                            <span class="vaero-product-type">
                                ${product.type}
                            </span>

                            <strong>
                                ${product.name}
                            </strong>

                            <small>
                                ${product.subtitle}
                            </small>

                        </button>
                    `)
                    .join("")}

            </div>
        `;

    },

    renderDevice(){

        const device =
            this.products.device;

        return `
            <section class="vaero-commerce-app">

                ${this.renderBackButton()}

                <section class="vaero-commerce-hero">

                    <div class="vaero-commerce-hero-copy">

                        <span>
                            ${device.type}
                        </span>

                        <h2>
                            ${device.name}
                        </h2>

                        <p>
                            ${device.description}
                        </p>

                        <div class="vaero-commerce-actions">

                            <button
                                type="button"
                                data-product="device"
                                data-action="vaero:product"
                            >
                                Ürünü İncele
                            </button>

                            <button
                                type="button"
                                data-action="vaero:collection"
                            >
                                Atmosferleri Keşfet
                            </button>

                        </div>

                    </div>

                </section>

            </section>
        `;

    },

    renderCollection(){

        return `
            <section class="vaero-commerce-app">

                ${this.renderBackButton()}

                <header class="vaero-commerce-header">

                    <div>

                        <span class="vaero-commerce-eyebrow">
                            ATMOSFER KOLEKSİYONU
                        </span>

                        <h1>
                            VAERO Atmospheres
                        </h1>

                        <p>
                            Fiziksel dünyan için oluşturulan VAERO koleksiyonunu keşfet.
                        </p>

                    </div>

                </header>

                <section class="vaero-commerce-section">

                    ${this.renderProductGrid()}

                </section>

            </section>
        `;

    },

    renderProduct(productId){

    const product =
        this.products[productId];

    if(!product){
        return `
            <section class="vaero-commerce-app">

                ${this.renderBackButton()}

                <p>
                    Ürün bulunamadı.
                </p>

            </section>
        `;
    }

    const variants =
        Array.isArray(product.variants)
            ? product.variants
            : [];

    let selectedVariant = null;

    if(variants.length > 0){

        selectedVariant =
            this.getProductVariant(
                product.id,
                VAERO.engine.currentVaeroVariant
            ) ||
            this.getDefaultProductVariant(
                product.id
            );

        VAERO.engine.currentVaeroVariant =
            selectedVariant
                ? selectedVariant.id
                : null;

    }else{

        VAERO.engine.currentVaeroVariant =
            null;

    }

    const price =
        this.getProductPrice(
            product.id,
            selectedVariant
                ? selectedVariant.id
                : null
        );

    const variantsHTML =
        variants.length > 0
            ? `
                <div class="vaero-product-variants">

                    <span>
                        BOYUT SEÇ
                    </span>

                    <div>

                        ${variants
                            .map(variant => `
                                <button
                                    type="button"
                                    class="${
                                        selectedVariant &&
                                        selectedVariant.id === variant.id
                                            ? "is-active"
                                            : ""
                                    }"
                                    data-action="vaero:variant"
                                    data-product="${product.id}"
                                    data-variant="${variant.id}"
                                >
                                    ${variant.label}
                                </button>
                            `)
                            .join("")}

                    </div>

                </div>
            `
            : "";

    return `
        <section class="vaero-commerce-app">

            ${this.renderBackButton()}

            <section class="vaero-commerce-hero">

                <div class="vaero-commerce-hero-copy">

                    <span>
                        ${product.type}
                    </span>

                    <h2>
                        ${product.name}
                    </h2>

                    <p>
                        ${product.description}
                    </p>

                    ${variantsHTML}

                    <div class="vaero-product-price">

                        <span>
                            ${
                                price
                                    ? this.formatMoney(
                                        price.amount,
                                        price.currency
                                    )
                                    : "Fiyat bulunamadı"
                            }
                        </span>

                        ${
                            selectedVariant
                                ? `
                                    <small>
                                        ${selectedVariant.label}
                                    </small>
                                `
                                : ""
                        }

                    </div>

                    <div class="vaero-commerce-actions">

                        <button
                            type="button"
                            data-action="vaero:buy"
                            data-product="${product.id}"
                            data-variant="${
                                selectedVariant
                                    ? selectedVariant.id
                                    : ""
                            }"
                        >
                            Sepete Ekle
                        </button>

                        ${this.renderCartButton()}

                    </div>

                </div>

            </section>

        </section>
    `;

},

    renderCart(){

    const cart =
        this.loadCart();

    const itemCount =
        this.getCartItemCount();

    const subtotal =
        this.getCartSubtotal();

    if(cart.items.length === 0){

        return `
            <section class="vaero-commerce-app">

                ${this.renderBackButton()}

                <header class="vaero-commerce-header">

                    <div>

                        <span class="vaero-commerce-eyebrow">
                            VAERO SEPET
                        </span>

                        <h1>
                            Sepetin boş
                        </h1>

                        <p>
                            Fiziksel atmosferini oluşturmak için VAERO ürünlerini keşfet.
                        </p>

                    </div>

                </header>

                <div class="vaero-commerce-actions">

                    <button
                        type="button"
                        data-action="vaero:collection"
                    >
                        Ürünleri Keşfet
                    </button>

                </div>

            </section>
        `;

    }

    return `
        <section class="vaero-commerce-app">

            ${this.renderBackButton()}

            <header class="vaero-commerce-header">

                <div>

                    <span class="vaero-commerce-eyebrow">
                        VAERO SEPET
                    </span>

                    <h1>
                        Fiziksel Atmosferin
                    </h1>

                    <p>
                        Sepetinde ${itemCount} ürün bulunuyor.
                    </p>

                </div>

                <button
                    type="button"
                    class="vaero-commerce-id-btn"
                    data-action="vaero:cart:clear"
                >
                    Sepeti Temizle
                </button>

            </header>

            <section class="vaero-cart-items">

                ${cart.items
                    .map(item => {

                        const product =
                            this.products[item.productId];

                        if(!product){
                            return "";
                        }

                        const variant =
                            this.getProductVariant(
                                product.id,
                                item.variantId
                            );

                        const unitAmount =
                            Number(
                                item.unitPrice?.amount
                            ) || 0;

                        const lineTotal =
                            unitAmount *
                            item.quantity;

                        const currency =
                            item.unitPrice?.currency ||
                            this.baseCurrency;

                        return `
                            <article
                                class="vaero-cart-item"
                                data-product="${product.id}"
                                data-variant="${item.variantId || ""}"
                            >

                                <div class="vaero-cart-item-copy">

                                    <span class="vaero-product-type">
                                        ${product.type}
                                    </span>

                                    <strong>
                                        ${product.name}
                                    </strong>

                                    <small>
                                        ${
                                            variant
                                                ? variant.label
                                                : product.subtitle
                                        }
                                    </small>

                                    <span class="vaero-cart-item-price">
                                        ${this.formatMoney(
                                            lineTotal,
                                            currency
                                        )}
                                    </span>

                                </div>

                                <div class="vaero-cart-item-controls">

                                    <button
                                        type="button"
                                        data-action="vaero:cart:decrease"
                                        data-product="${product.id}"
                                        data-variant="${item.variantId || ""}"
                                        aria-label="${product.name} adedini azalt"
                                    >
                                        −
                                    </button>

                                    <span>
                                        ${item.quantity}
                                    </span>

                                    <button
                                        type="button"
                                        data-action="vaero:cart:increase"
                                        data-product="${product.id}"
                                        data-variant="${item.variantId || ""}"
                                        aria-label="${product.name} adedini artır"
                                    >
                                        +
                                    </button>

                                    <button
                                        type="button"
                                        data-action="vaero:cart:remove"
                                        data-product="${product.id}"
                                        data-variant="${item.variantId || ""}"
                                    >
                                        Kaldır
                                    </button>

                                </div>

                            </article>
                        `;

                    })
                    .join("")}

            </section>

            <section class="vaero-cart-summary">

                <div>

                    <span>
                        Ara toplam
                    </span>

                    <strong>
                        ${this.formatMoney(
                            subtotal.amount,
                            subtotal.currency
                        )}
                    </strong>

                </div>

                <small>
                    Teslimat ve vergiler sipariş aşamasında hesaplanır.
                </small>

            </section>

            <div class="vaero-commerce-actions">

                <button
                    type="button"
                    data-action="vaero:checkout"
                >
                    Siparişe Devam Et
                </button>

                <button
                    type="button"
                    data-action="vaero:collection"
                >
                    Alışverişe Devam Et
                </button>

            </div>

        </section>
    `;

},

    renderCheckout(){

    const checkout =
        this.loadCheckoutDraft();

    if(
        !checkout ||
        checkout.items.length === 0
    ){

        return `
            <section class="vaero-commerce-app">

                ${this.renderBackButton()}

                <header class="vaero-commerce-header">

                    <div>

                        <span class="vaero-commerce-eyebrow">
                            VAERO CHECKOUT
                        </span>

                        <h1>
                            Sipariş taslağı bulunamadı
                        </h1>

                        <p>
                            Sepetine dönerek siparişini yeniden oluşturabilirsin.
                        </p>

                    </div>

                </header>

                <div class="vaero-commerce-actions">

                    <button
                        type="button"
                        data-action="vaero:cart"
                    >
                        Sepete Dön
                    </button>

                </div>

            </section>
        `;

    }

    const selectedPaymentMethod =
        checkout.payment?.method || null;
        
        const isPaymentPending =
    checkout.payment?.status ===
    "pending";

        const isPaymentPaid =
    checkout.payment?.status ===
    "paid";

const isPaymentFailed =
    checkout.payment?.status ===
    "failed";

    return `
        <section class="vaero-commerce-app">

            <button
                type="button"
                class="vaero-commerce-id-btn"
                data-action="vaero:cart"
                style="margin-bottom:18px;"
            >
                ← Sepete Dön
            </button>

            <header class="vaero-commerce-header">

                <div>

                    <span class="vaero-commerce-eyebrow">
                        VAERO CHECKOUT
                    </span>

                    <h1>
                        Siparişini Onayla
                    </h1>

                    <p>
                        Ürünlerini kontrol et ve ödeme adımına ilerle.
                    </p>

                </div>

            </header>

            <section class="vaero-cart-items">

                ${checkout.items
                    .map(item => {

                        const product =
                            this.products[item.productId];

                        if(!product){
                            return "";
                        }

                        const variant =
                            this.getProductVariant(
                                product.id,
                                item.variantId
                            );

                        const lineTotal =
                            (
                                Number(
                                    item.unitPrice?.amount
                                ) || 0
                            ) * item.quantity;

                        return `
                            <article class="vaero-cart-item">

                                <div class="vaero-cart-item-copy">

                                    <span class="vaero-product-type">
                                        ${product.type}
                                    </span>

                                    <strong>
                                        ${product.name}
                                    </strong>

                                    <small>
                                        ${
                                            variant
                                                ? variant.label
                                                : product.subtitle
                                        }
                                        · ${item.quantity} adet
                                    </small>

                                </div>

                                <strong>
                                    ${this.formatMoney(
                                        lineTotal,
                                        checkout.currency
                                    )}
                                </strong>

                            </article>
                        `;

                    })
                    .join("")}

            </section>

            <section class="vaero-cart-summary">

                <div>

                    <span>
                        Ara toplam
                    </span>

                    <strong>
                        ${this.formatMoney(
                            checkout.totals.subtotal,
                            checkout.currency
                        )}
                    </strong>

                </div>

                <small>
                    Teslimat ve vergiler ödeme öncesinde hesaplanacaktır.
                </small>

            </section>

            <section class="vaero-payment-methods">

                <span class="vaero-commerce-eyebrow">
                    ÖDEME YÖNTEMİ
                </span>

                <div class="vaero-commerce-actions">

                    <button
                        type="button"
                        class="${
                            selectedPaymentMethod === "card"
                                ? "is-active"
                                : ""
                        }"
                        data-action="vaero:payment:method"
                        data-payment-method="card"
                        ${isPaymentPending ? "disabled" : ""}
                    >
                        Kart ile Ödeme
                    </button>

                    <button
    type="button"
    class="${
        selectedPaymentMethod === "bank-transfer"
            ? "is-active"
            : ""
    }"
    data-action="vaero:payment:method"
    data-payment-method="bank-transfer"
    ${isPaymentPending ? "disabled" : ""}
>
    Banka Transferi
</button>

                </div>

            </section>

${
    (
        isPaymentPending ||
        isPaymentPaid ||
        isPaymentFailed
    )
        ? `
            <section class="vaero-payment-status">

                <span class="vaero-commerce-eyebrow">
                    ÖDEME DURUMU
                </span>

                <strong>
                    ${
                        isPaymentPaid
                            ? "Ödeme başarılı"
                            : isPaymentFailed
                                ? "Ödeme başarısız"
                                : "Ödeme işlemi hazırlanıyor"
                    }
                </strong>

                <small>
                    Seçilen yöntem: ${
                        selectedPaymentMethod ===
                        "bank-transfer"
                            ? "Banka Transferi"
                            : "Kart ile Ödeme"
                    }
                </small>

                ${
                    isPaymentPending
                        ? `
                            <div class="vaero-commerce-actions">

                                <button
                                    type="button"
                                    data-action="vaero:payment:success"
                                >
                                    Test Ödemesini Başarılı Say
                                </button>

                                <button
                                    type="button"
                                    data-action="vaero:payment:fail"
                                >
                                    Başarısız Say
                                </button>

                            </div>
                        `
                        : ""
                }

            </section>
        `
        : ""
}

<div class="vaero-commerce-actions">

    <button
    type="button"
    data-action="${
        isPaymentPaid
            ? "vaero:order:create"
            : "vaero:payment:start"
    }"
    ${
        !selectedPaymentMethod ||
        isPaymentPending
            ? "disabled"
            : ""
    }
>
    ${
        isPaymentPaid
            ? "Siparişi Oluştur"
            : isPaymentPending
                ? "Ödeme Hazırlanıyor…"
                : isPaymentFailed
                    ? "Ödemeyi Yeniden Dene"
                    : "Ödemeye Devam Et"
    }
</button>
</div>

        </section>
    `;

},

    renderOrderSuccess(){

    const order =
        VAERO.engine.currentVaeroOrder ||
        this.loadOrders()[0] ||
        null;

    if(!order){

        return `
            <section class="vaero-commerce-app">

                ${this.renderBackButton()}

                <p>
                    Sipariş kaydı bulunamadı.
                </p>

            </section>
        `;

    }

    const total =
        order.totals.grandTotal ??
        order.totals.subtotal;

        const orderAssets =
    this.loadPhysicalAssets()
        .filter(asset =>
            asset.sourceOrderId ===
            order.id
        );

const assetCount =
    orderAssets.reduce(
        (totalQuantity, asset) =>
            totalQuantity +
            (
                Number(asset.quantity) ||
                0
            ),
        0
    );

    return `
        <section class="vaero-commerce-app">

            <section class="vaero-payment-status">

                <span class="vaero-commerce-eyebrow">
                    SİPARİŞ ONAYLANDI
                </span>

                <h1>
                    Fiziksel atmosferin hazırlanıyor
                </h1>

                <p>
                    Siparişin başarıyla oluşturuldu.
                    ${assetCount} fiziksel ürün kişisel
                    Assets kayıtlarına eklendi.
                </p>

                <strong>
                    ${this.formatMoney(
                        total,
                        order.currency
                    )}
                </strong>

                <small>
                    Sipariş No:
                    ${order.id}
                </small>

            </section>

            <div class="vaero-commerce-actions">

                <button
                    type="button"
                    data-action="app:vaero"
                >
                    VAERO Ana Ekranı
                </button>

                <button
                    type="button"
                    data-action="vaero:collection"
                >
                    Ürünleri Gör
                </button>

            </div>

        </section>
    `;

},
    
renderCartButton(){

    const itemCount =
        this.getCartItemCount();

    return `
        <button
            type="button"
            class="vaero-commerce-id-btn"
            data-action="vaero:cart"
        >
            Sepet
            <span>${itemCount}</span>
        </button>
    `;

},

    renderBackButton(){

        return `
            <button
                type="button"
                class="vaero-commerce-id-btn"
                data-action="app:vaero"
                style="margin-bottom:18px;"
            >
                ← VAERO
            </button>
        `;

    }

};

window.VaeroApp = VaeroApp;
