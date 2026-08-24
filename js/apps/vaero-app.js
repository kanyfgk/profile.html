const VaeroApp = {

    id: "vaero",

    title: "VAERO",

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

    render(){

        const page =
            VAERO.engine.currentEntityPage || "vaero";

        if(page === "vaero-device"){
            return this.renderDevice();
        }

        if(page === "vaero-collection"){
            return this.renderCollection();
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
