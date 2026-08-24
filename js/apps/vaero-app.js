const VaeroApp = {

    id: "vaero",

    title: "VAERO",

    render(){

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

                    <div class="vaero-commerce-products">

                        <button
                            type="button"
                            class="vaero-product-card"
                            data-product="device"
                            data-action="vaero:product"
                        >
                            <span class="vaero-product-type">
                                CİHAZ
                            </span>

                            <strong>
                                VAERO
                            </strong>

                            <small>
                                Kişisel Atmosfer Sistemi
                            </small>
                        </button>

                        <button
                            type="button"
                            class="vaero-product-card"
                            data-product="white-tea"
                            data-action="vaero:product"
                        >
                            <span class="vaero-product-type">
                                ATMOSFER
                            </span>

                            <strong>
                                White Tea
                            </strong>

                            <small>
                                Temiz ve ferah atmosfer
                            </small>
                        </button>

                        <button
                            type="button"
                            class="vaero-product-card"
                            data-product="ocean"
                            data-action="vaero:product"
                        >
                            <span class="vaero-product-type">
                                ATMOSFER
                            </span>

                            <strong>
                                Ocean
                            </strong>

                            <small>
                                Serin ve dengeli atmosfer
                            </small>
                        </button>

                    </div>

                </section>

            </section>
        `;
    }

};

window.VaeroApp = VaeroApp;
