const VaeroApp = {

    id: "vaero",

    title: "VAERO",

    cartStorageVersion: 1,

    products: {

        device: {
            id: "device",
            type: "CİHAZ",
            name: "VAERO",
            subtitle: "Kişisel Atmosfer Sistemi",
            description:
                "VAERO atmosferlerini fiziksel dünyaya taşıyan araç içi kişisel atmosfer sistemi."
        },

        "white-tea": {
            id: "white-tea",
            type: "ATMOSFER",
            name: "White Tea",
            subtitle: "Temiz ve ferah atmosfer",
            description:
                "Hafif, temiz ve dengeli karakteriyle yolculuğun atmosferini dönüştürür."
        },

        ocean: {
            id: "ocean",
            type: "ATMOSFER",
            name: "Ocean",
            subtitle: "Serin ve dengeli atmosfer",
            description:
                "Serin, sakin ve ferah karakteriyle daha açık bir atmosfer oluşturur."
        }

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
            currency: "TRY",
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

                        return {
                            productId: product.id,
                            quantity,
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
            currency: "TRY",
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

    addToCart(productId, quantity = 1){

        const product =
            this.products[productId];

        if(!product){
            console.error(
                "Sepete eklenemedi: ürün bulunamadı.",
                productId
            );

            return null;
        }

        const safeQuantity =
            Math.max(
                1,
                Math.floor(
                    Number(quantity) || 1
                )
            );

        const cart =
            this.loadCart();

        const existingItem =
            cart.items.find(item =>
                item.productId === productId
            );

        const now =
            Date.now();

        if(existingItem){

            existingItem.quantity +=
                safeQuantity;

            existingItem.updatedAt =
                now;

        }else{

            cart.items.push({
                productId,
                quantity: safeQuantity,
                addedAt: now,
                updatedAt: now
            });

        }

        return this.saveCart(cart);

    },

    updateCartItemQuantity(productId, quantity){

    const product =
        this.products[productId];

    if(!product){
        console.error(
            "Sepet güncellenemedi: ürün bulunamadı.",
            productId
        );

        return null;
    }

    const cart =
        this.loadCart();

    const item =
        cart.items.find(cartItem =>
            cartItem.productId === productId
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
                cartItem.productId !== productId
            );

    }else{

        item.quantity =
            safeQuantity;

        item.updatedAt =
            Date.now();

    }

    return this.saveCart(cart);

},

increaseCartItem(productId){

    const cart =
        this.loadCart();

    const item =
        cart.items.find(cartItem =>
            cartItem.productId === productId
        );

    if(!item){
        return this.addToCart(productId, 1);
    }

    return this.updateCartItemQuantity(
        productId,
        item.quantity + 1
    );

},

decreaseCartItem(productId){

    const cart =
        this.loadCart();

    const item =
        cart.items.find(cartItem =>
            cartItem.productId === productId
        );

    if(!item){
        return cart;
    }

    return this.updateCartItemQuantity(
        productId,
        item.quantity - 1
    );

},

removeFromCart(productId){

    const cart =
        this.loadCart();

    cart.items =
        cart.items.filter(item =>
            item.productId !== productId
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

                        <div class="vaero-commerce-actions">

                            <button
                                type="button"
                                data-action="vaero:buy"
                                data-product="${product.id}"
                            >
                                Satın Al
                            </button>

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

                        return `
                            <article
                                class="vaero-cart-item"
                                data-product="${product.id}"
                            >

                                <div class="vaero-cart-item-copy">

                                    <span class="vaero-product-type">
                                        ${product.type}
                                    </span>

                                    <strong>
                                        ${product.name}
                                    </strong>

                                    <small>
                                        ${product.subtitle}
                                    </small>

                                </div>

                                <div class="vaero-cart-item-controls">

                                    <button
                                        type="button"
                                        data-action="vaero:cart:decrease"
                                        data-product="${product.id}"
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
                                        aria-label="${product.name} adedini artır"
                                    >
                                        +
                                    </button>

                                    <button
                                        type="button"
                                        data-action="vaero:cart:remove"
                                        data-product="${product.id}"
                                    >
                                        Kaldır
                                    </button>

                                </div>

                            </article>
                        `;

                    })
                    .join("")}

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
