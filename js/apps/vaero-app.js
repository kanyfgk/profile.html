const VaeroApp = {

    id: "vaero",

    title: "VAERO",

    paymentCoreVersion: 1,

    baseCurrency: "USD",

    /*
     * =========================================================
     * VAERO PAYMENT CORE
     * =========================================================
     *
     * Bu dosya artık fiziksel VAERO mağazası değildir.
     *
     * Görevi:
     *
     * - Engine abonelikleri
     * - Uygulama satın alımları
     * - Uygulama abonelikleri
     * - Hizmet ödemeleri
     * - Dijital varlıklar
     * - XP / kredi sistemleri
     * - Cüzdan hareketleri
     * - Komisyonlar
     * - Geliştirici gelir paylaşımı
     * - Kripto ödeme köprüleri
     * - Fiziksel ürün ödeme talepleri
     * - İadeler
     * - Settlement
     * - Transaction kayıtları
     *
     * için ortak ödeme omurgasını sağlamaktır.
     *
     * ÖNEMLİ:
     *
     * Payment Core neyin satıldığını belirlemez.
     * Satışı başlatan uygulama / servis belirler.
     *
     * Payment Core yalnızca:
     *
     * "Bu işlem yapılabilir mi?"
     * "Kim kime ne kadar ödüyor?"
     * "VAERO komisyonu var mı?"
     * "Hangi sağlayıcı kullanılacak?"
     * "İşlem hangi durumda?"
     *
     * sorularını yönetir.
     */

    transactionTypes: Object.freeze({

        ENGINE_SUBSCRIPTION:
            "engine-subscription",

        APP_PURCHASE:
            "app-purchase",

        APP_SUBSCRIPTION:
            "app-subscription",

        SERVICE:
            "service",

        DIGITAL_GOOD:
            "digital-good",

        XP:
            "xp",

        WALLET_TOPUP:
            "wallet-topup",

        CRYPTO:
            "crypto",

        PHYSICAL_GOOD:
            "physical-good",

        TRANSFER:
            "transfer"

    }),

    sourceTypes: Object.freeze({

        ENGINE:
            "engine",

        APP_STORE:
            "app-store",

        APPLICATION:
            "application",

        SERVICE:
            "service",

        WALLET:
            "wallet",

        SYSTEM:
            "system",

        EXTERNAL:
            "external"

    }),

    paymentStatuses: Object.freeze({

        CREATED:
            "created",

        REQUIRES_METHOD:
            "requires-method",

        REQUIRES_PROVIDER:
            "requires-provider",

        PENDING:
            "pending",

        AUTHORIZED:
            "authorized",

        PAID:
            "paid",

        FAILED:
            "failed",

        CANCELLED:
            "cancelled",

        REFUNDED:
            "refunded",

        PARTIALLY_REFUNDED:
            "partially-refunded"

    }),

    settlementStatuses: Object.freeze({

        NOT_REQUIRED:
            "not-required",

        PENDING:
            "pending",

        PROCESSING:
            "processing",

        COMPLETED:
            "completed",

        FAILED:
            "failed"

    }),

    /*
     * =========================================================
     * SOURCE POLICIES
     * =========================================================
     *
     * Buradaki sınırlar özellikle önemlidir.
     *
     * Engine çekirdeği yalnızca VAERO Engine hizmetine
     * ait ödemeleri doğrudan başlatabilir.
     *
     * Böylece bir fiziksel ürün veya üçüncü taraf uygulama
     * ödemesi yanlışlıkla Engine abonelik sistemine
     * karışamaz.
     */

    sourcePolicies: {

        engine: [
            "engine-subscription"
        ],

        "app-store": [
            "app-purchase",
            "app-subscription",
            "digital-good"
        ],

        application: [
            "app-purchase",
            "app-subscription",
            "service",
            "digital-good",
            "xp",
            "physical-good"
        ],

        service: [
            "service",
            "digital-good"
        ],

        wallet: [
            "wallet-topup",
            "transfer",
            "xp",
            "crypto"
        ],

        system: [
            "engine-subscription",
            "app-purchase",
            "app-subscription",
            "service",
            "digital-good",
            "xp",
            "wallet-topup",
            "crypto",
            "physical-good",
            "transfer"
        ],

        external: [
            "service",
            "physical-good"
        ]

    },

    /*
     * =========================================================
     * PAYMENT PROVIDER BRIDGES
     * =========================================================
     *
     * Gerçek ödeme servisleri daha sonra buraya bağlanacak.
     *
     * Örnek:
     *
     * Stripe
     * iyzico
     * PayPal
     * banka transfer sistemi
     * kripto provider
     * VAERO Wallet
     *
     * Kart verisi hiçbir zaman localStorage'a yazılmamalıdır.
     */

    paymentProviders: new Map(),

    registerPaymentProvider(
        providerId,
        adapter
    ){

        const normalizedId =
            String(providerId || "")
                .trim()
                .toLowerCase();

        if(!normalizedId){
            throw new Error(
                "Payment provider ID gerekli."
            );
        }

        if(
            !adapter ||
            typeof adapter !== "object"
        ){
            throw new Error(
                "Payment provider adapter geçersiz."
            );
        }

        this.paymentProviders.set(
            normalizedId,
            adapter
        );

        this.emit(
            "provider-registered",
            {
                providerId:
                    normalizedId
            }
        );

        return true;

    },

    unregisterPaymentProvider(
        providerId
    ){

        const normalizedId =
            String(providerId || "")
                .trim()
                .toLowerCase();

        return this.paymentProviders.delete(
            normalizedId
        );

    },

    getPaymentProvider(
        providerId
    ){

        if(!providerId){
            return null;
        }

        return (
            this.paymentProviders.get(
                String(providerId)
                    .trim()
                    .toLowerCase()
            ) ||
            null
        );

    },

    /*
     * =========================================================
     * CUSTOMER
     * =========================================================
     */

    getCustomerId(){

        const entity =
            window.VAERO &&
            VAERO.engine
                ? VAERO.engine.currentEntity
                : null;

        return (
            entity &&
            entity.id
        )
            ? entity.id
            : "guest";

    },

    /*
     * =========================================================
     * STORAGE
     * =========================================================
     */

    getStoragePrefix(){

        return (
            `vaero:payment-core:v${this.paymentCoreVersion}`
        );

    },

    getTransactionsStorageKey(){

        return (
            `${this.getStoragePrefix()}:transactions:${this.getCustomerId()}`
        );

    },

    getPaymentIntentsStorageKey(){

        return (
            `${this.getStoragePrefix()}:intents:${this.getCustomerId()}`
        );

    },

    getRefundsStorageKey(){

        return (
            `${this.getStoragePrefix()}:refunds:${this.getCustomerId()}`
        );

    },

    getLedgerStorageKey(){

        return (
            `${this.getStoragePrefix()}:ledger:${this.getCustomerId()}`
        );

    },

    readStorageArray(
        storageKey
    ){

        const savedValue =
            localStorage.getItem(
                storageKey
            );

        if(!savedValue){
            return [];
        }

        try {

            const parsed =
                JSON.parse(savedValue);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch(error){

            console.error(
                "VAERO Payment Core storage okunamadı:",
                error
            );

            return [];

        }

    },

    writeStorageArray(
        storageKey,
        value
    ){

        try {

            localStorage.setItem(
                storageKey,
                JSON.stringify(
                    Array.isArray(value)
                        ? value
                        : []
                )
            );

            return true;

        } catch(error){

            console.error(
                "VAERO Payment Core storage kaydedilemedi:",
                error
            );

            return false;

        }

    },

    /*
     * =========================================================
     * ID
     * =========================================================
     */

    createId(
        prefix = "vaero"
    ){

        const uuid =
            (
                window.crypto &&
                typeof crypto.randomUUID ===
                    "function"
            )
                ? crypto.randomUUID()
                : (
                    Date.now().toString(36) +
                    Math.random()
                        .toString(36)
                        .slice(2)
                );

        return `${prefix}_${uuid}`;

    },

    /*
     * =========================================================
     * MONEY
     * =========================================================
     */

    normalizeMoney(
        money
    ){

        if(
            !money ||
            typeof money !== "object"
        ){
            return null;
        }

        const amount =
            Number(money.amount);

        if(
            !Number.isFinite(amount) ||
            amount < 0
        ){
            return null;
        }

        const currency =
            String(
                money.currency ||
                this.baseCurrency
            )
                .trim()
                .toUpperCase();

        if(!currency){
            return null;
        }

        return {
            amount,
            currency
        };

    },

    formatMoney(
        amount,
        currency = this.baseCurrency
    ){

        try {

            return new Intl.NumberFormat(
                "en-US",
                {
                    style:
                        "currency",

                    currency,

                    minimumFractionDigits:
                        0,

                    maximumFractionDigits:
                        2
                }
            ).format(
                Number(amount) || 0
            );

        } catch(error){

            return (
                `${amount} ${currency}`
            );

        }

    },

    /*
     * =========================================================
     * CONTEXT VALIDATION
     * =========================================================
     */

    isTransactionAllowed(
        sourceType,
        transactionType
    ){

        const allowedTypes =
            this.sourcePolicies[
                sourceType
            ];

        if(
            !Array.isArray(
                allowedTypes
            )
        ){
            return false;
        }

        return allowedTypes.includes(
            transactionType
        );

    },

    validatePaymentRequest(
        request
    ){

        if(
            !request ||
            typeof request !== "object"
        ){
            return {
                valid: false,
                reason:
                    "payment-request-invalid"
            };
        }

        const source =
            request.source;

        if(
            !source ||
            typeof source !== "object" ||
            !source.type
        ){
            return {
                valid: false,
                reason:
                    "payment-source-required"
            };
        }

        if(!request.type){

            return {
                valid: false,
                reason:
                    "transaction-type-required"
            };

        }

        if(
            !this.isTransactionAllowed(
                source.type,
                request.type
            )
        ){

            return {
                valid: false,
                reason:
                    "transaction-not-allowed-for-source"
            };

        }

        const amount =
            this.normalizeMoney(
                request.amount
            );

        if(!amount){

            return {
                valid: false,
                reason:
                    "invalid-payment-amount"
            };

        }

        if(
            !request.subject ||
            typeof request.subject !==
                "object" ||
            !request.subject.id
        ){

            return {
                valid: false,
                reason:
                    "payment-subject-required"
            };

        }

        return {
            valid: true,
            amount
        };

    },

    /*
     * =========================================================
     * PAYMENT INTENTS
     * =========================================================
     *
     * Payment Intent:
     *
     * Bir uygulamanın Payment Core'a gönderdiği
     * ödeme isteğidir.
     *
     * Örnek:
     *
     * Engine aboneliği
     * Uygulama aboneliği
     * XP paketi
     * Fiziksel ürün
     * Hizmet
     */

    createPaymentIntent(
        request
    ){

        const validation =
            this.validatePaymentRequest(
                request
            );

        if(!validation.valid){

            console.error(
                "VAERO ödeme isteği reddedildi:",
                validation.reason,
                request
            );

            return null;

        }

        const now =
            Date.now();

        const intent = {

            id:
                this.createId(
                    "pi"
                ),

            version:
                this.paymentCoreVersion,

            customerId:
                request.customerId ||
                this.getCustomerId(),

            type:
                request.type,

            source: {

                type:
                    request.source.type,

                id:
                    request.source.id ||
                    null,

                name:
                    request.source.name ||
                    null

            },

            subject: {

                id:
                    request.subject.id,

                type:
                    request.subject.type ||
                    null,

                name:
                    request.subject.name ||
                    null

            },

            amount:
                validation.amount,

            status:
                this.paymentStatuses
                    .REQUIRES_METHOD,

            paymentMethod:
                null,

            provider:
                null,

            providerReference:
                null,

            commission:
                this.normalizeCommission(
                    request.commission,
                    validation.amount
                ),

            metadata:
                (
                    request.metadata &&
                    typeof request.metadata ===
                        "object"
                )
                    ? {
                        ...request.metadata
                    }
                    : {},

            createdAt:
                now,

            updatedAt:
                now

        };

        const intents =
            this.loadPaymentIntents();

        intents.unshift(
            intent
        );

        this.savePaymentIntents(
            intents
        );

        this.emit(
            "intent-created",
            {
                intent:
                    this.clone(intent)
            }
        );

        return intent;

    },

    loadPaymentIntents(){

        return this.readStorageArray(
            this.getPaymentIntentsStorageKey()
        );

    },

    savePaymentIntents(
        intents
    ){

        return this.writeStorageArray(
            this.getPaymentIntentsStorageKey(),
            intents
        );

    },

    getPaymentIntent(
        intentId
    ){

        return (
            this.loadPaymentIntents()
                .find(intent =>
                    intent.id ===
                    intentId
                ) ||
            null
        );

    },

    updatePaymentIntent(
        intentId,
        patch
    ){

        const intents =
            this.loadPaymentIntents();

        const index =
            intents.findIndex(
                intent =>
                    intent.id ===
                    intentId
            );

        if(index === -1){
            return null;
        }

        intents[index] = {

            ...intents[index],

            ...patch,

            updatedAt:
                Date.now()

        };

        this.savePaymentIntents(
            intents
        );

        return intents[index];

    },

    /*
     * =========================================================
     * COMMISSION ENGINE
     * =========================================================
     *
     * Uygulama geliştiricileri / hizmet sağlayıcıları
     * için VAERO komisyon hesaplama köprüsü.
     *
     * Şu anda sabit bir komisyon oranı tanımlamıyoruz.
     * Oran ilgili mağaza / geliştirici sözleşmesi tarafından
     * Payment Core'a gönderilecek.
     */

    normalizeCommission(
        commission,
        amount
    ){

        if(
            !commission ||
            typeof commission !== "object"
        ){

            return {
                enabled: false,
                rate: 0,
                amount: 0,
                platformAmount: 0,
                recipientAmount:
                    amount.amount
            };

        }

        const rate =
            Math.max(
                0,
                Math.min(
                    1,
                    Number(
                        commission.rate
                    ) || 0
                )
            );

        const commissionAmount =
            Number(
                (
                    amount.amount *
                    rate
                ).toFixed(2)
            );

        return {

            enabled:
                rate > 0,

            rate,

            amount:
                commissionAmount,

            platformAmount:
                commissionAmount,

            recipientAmount:
                Number(
                    (
                        amount.amount -
                        commissionAmount
                    ).toFixed(2)
                ),

            recipientId:
                commission.recipientId ||
                null

        };

    },

    /*
     * =========================================================
     * PAYMENT METHOD
     * =========================================================
     */

    setPaymentMethod(
        intentId,
        paymentMethod
    ){

        const intent =
            this.getPaymentIntent(
                intentId
            );

        if(!intent){
            return null;
        }

        if(
            [
                this.paymentStatuses.PAID,
                this.paymentStatuses.REFUNDED,
                this.paymentStatuses.CANCELLED
            ].includes(
                intent.status
            )
        ){
            return null;
        }

        const normalizedMethod =
            String(
                paymentMethod || ""
            )
                .trim()
                .toLowerCase();

        if(!normalizedMethod){
            return null;
        }

        const updated =
            this.updatePaymentIntent(
                intentId,
                {
                    paymentMethod:
                        normalizedMethod,

                    status:
                        this.paymentStatuses
                            .REQUIRES_PROVIDER
                }
            );

        this.emit(
            "payment-method-selected",
            {
                intent:
                    this.clone(
                        updated
                    )
            }
        );

        return updated;

    },

    /*
     * =========================================================
     * PROVIDER
     * =========================================================
     */

    setPaymentProvider(
        intentId,
        providerId
    ){

        const provider =
            this.getPaymentProvider(
                providerId
            );

        if(!provider){
            return null;
        }

        return this.updatePaymentIntent(
            intentId,
            {
                provider:
                    String(
                        providerId
                    )
                        .trim()
                        .toLowerCase()
            }
        );

    },

    async startPayment(
        intentId
    ){

        const intent =
            this.getPaymentIntent(
                intentId
            );

        if(!intent){
            return null;
        }

        if(
            !intent.paymentMethod
        ){

            return this.updatePaymentIntent(
                intentId,
                {
                    status:
                        this.paymentStatuses
                            .REQUIRES_METHOD
                }
            );

        }

        if(!intent.provider){

            return this.updatePaymentIntent(
                intentId,
                {
                    status:
                        this.paymentStatuses
                            .REQUIRES_PROVIDER
                }
            );

        }

        const provider =
            this.getPaymentProvider(
                intent.provider
            );

        if(
            !provider ||
            typeof provider.createPayment !==
                "function"
        ){

            console.error(
                "Payment provider ödeme köprüsü hazır değil:",
                intent.provider
            );

            return this.updatePaymentIntent(
                intentId,
                {
                    status:
                        this.paymentStatuses
                            .REQUIRES_PROVIDER
                }
            );

        }

        const pendingIntent =
            this.updatePaymentIntent(
                intentId,
                {
                    status:
                        this.paymentStatuses
                            .PENDING
                }
            );

        this.emit(
            "payment-started",
            {
                intent:
                    this.clone(
                        pendingIntent
                    )
            }
        );

        try {

            const providerResult =
                await provider.createPayment({
                    intent:
                        this.clone(
                            pendingIntent
                        )
                });

            return this.handleProviderResult(
                intentId,
                providerResult
            );

        } catch(error){

            console.error(
                "VAERO ödeme sağlayıcısı hata verdi:",
                error
            );

            return this.failPayment(
                intentId,
                "provider-error"
            );

        }

    },

    handleProviderResult(
        intentId,
        result
    ){

        if(
            !result ||
            typeof result !== "object"
        ){

            return this.failPayment(
                intentId,
                "invalid-provider-response"
            );

        }

        if(
            result.status ===
            "paid"
        ){

            return this.completePayment(
                intentId,
                {
                    providerReference:
                        result.providerReference ||
                        null,

                    metadata:
                        result.metadata ||
                        null
                }
            );

        }

        if(
            result.status ===
            "authorized"
        ){

            return this.updatePaymentIntent(
                intentId,
                {
                    status:
                        this.paymentStatuses
                            .AUTHORIZED,

                    providerReference:
                        result.providerReference ||
                        null
                }
            );

        }

        if(
            result.status ===
            "pending"
        ){

            return this.updatePaymentIntent(
                intentId,
                {
                    status:
                        this.paymentStatuses
                            .PENDING,

                    providerReference:
                        result.providerReference ||
                        null
                }
            );

        }

        return this.failPayment(
            intentId,
            result.reason ||
            "payment-failed"
        );

    },

    /*
     * =========================================================
     * PAYMENT COMPLETE
     * =========================================================
     */

    completePayment(
        intentId,
        providerData = {}
    ){

        const intent =
            this.getPaymentIntent(
                intentId
            );

        if(!intent){
            return null;
        }

        if(
            intent.status ===
            this.paymentStatuses.PAID
        ){

            return this.getTransactionByIntent(
                intentId
            );

        }

        const now =
            Date.now();

        const paidIntent =
            this.updatePaymentIntent(
                intentId,
                {

                    status:
                        this.paymentStatuses
                            .PAID,

                    providerReference:
                        providerData
                            .providerReference ||
                        intent
                            .providerReference ||
                        null,

                    paidAt:
                        now

                }
            );

        const transaction =
            this.createTransactionFromIntent(
                paidIntent
            );

        this.createLedgerEntries(
            transaction
        );

        this.emit(
            "payment-completed",
            {
                intent:
                    this.clone(
                        paidIntent
                    ),

                transaction:
                    this.clone(
                        transaction
                    )
            }
        );

        return transaction;

    },

    failPayment(
        intentId,
        reason = "payment-failed"
    ){

        const failedIntent =
            this.updatePaymentIntent(
                intentId,
                {

                    status:
                        this.paymentStatuses
                            .FAILED,

                    failureReason:
                        reason,

                    failedAt:
                        Date.now()

                }
            );

        if(failedIntent){

            this.emit(
                "payment-failed",
                {
                    intent:
                        this.clone(
                            failedIntent
                        )
                }
            );

        }

        return failedIntent;

    },

    cancelPayment(
        intentId
    ){

        const intent =
            this.getPaymentIntent(
                intentId
            );

        if(!intent){
            return null;
        }

        if(
            intent.status ===
            this.paymentStatuses.PAID
        ){
            return null;
        }

        const cancelled =
            this.updatePaymentIntent(
                intentId,
                {
                    status:
                        this.paymentStatuses
                            .CANCELLED,

                    cancelledAt:
                        Date.now()
                }
            );

        this.emit(
            "payment-cancelled",
            {
                intent:
                    this.clone(
                        cancelled
                    )
            }
        );

        return cancelled;

    },

    /*
     * =========================================================
     * TRANSACTIONS
     * =========================================================
     */

    loadTransactions(){

        return this.readStorageArray(
            this.getTransactionsStorageKey()
        );

    },

    saveTransactions(
        transactions
    ){

        return this.writeStorageArray(
            this.getTransactionsStorageKey(),
            transactions
        );

    },

    getTransaction(
        transactionId
    ){

        return (
            this.loadTransactions()
                .find(transaction =>
                    transaction.id ===
                    transactionId
                ) ||
            null
        );

    },

    getTransactionByIntent(
        intentId
    ){

        return (
            this.loadTransactions()
                .find(transaction =>
                    transaction.intentId ===
                    intentId
                ) ||
            null
        );

    },

    createTransactionFromIntent(
        intent
    ){

        const existing =
            this.getTransactionByIntent(
                intent.id
            );

        if(existing){
            return existing;
        }

        const now =
            Date.now();

        const transaction = {

            id:
                this.createId(
                    "txn"
                ),

            intentId:
                intent.id,

            customerId:
                intent.customerId,

            type:
                intent.type,

            status:
                "completed",

            source:
                this.clone(
                    intent.source
                ),

            subject:
                this.clone(
                    intent.subject
                ),

            amount:
                this.clone(
                    intent.amount
                ),

            commission:
                this.clone(
                    intent.commission
                ),

            paymentMethod:
                intent.paymentMethod,

            provider:
                intent.provider,

            providerReference:
                intent.providerReference,

            settlement: {

                status:
                    intent.commission &&
                    intent.commission.enabled
                        ? this
                            .settlementStatuses
                            .PENDING
                        : this
                            .settlementStatuses
                            .NOT_REQUIRED,

                recipientId:
                    intent.commission
                        ?.recipientId ||
                    null

            },

            metadata:
                this.clone(
                    intent.metadata
                ),

            createdAt:
                now,

            updatedAt:
                now

        };

        const transactions =
            this.loadTransactions();

        transactions.unshift(
            transaction
        );

        this.saveTransactions(
            transactions
        );

        return transaction;

    },

    /*
     * =========================================================
     * LEDGER
     * =========================================================
     *
     * Gerçek finansal ledger ileride backend üzerinde
     * immutable şekilde tutulmalıdır.
     *
     * Bu client-side yapı yalnızca Engine prototipidir.
     */

    loadLedger(){

        return this.readStorageArray(
            this.getLedgerStorageKey()
        );

    },

    saveLedger(
        ledger
    ){

        return this.writeStorageArray(
            this.getLedgerStorageKey(),
            ledger
        );

    },

    createLedgerEntries(
        transaction
    ){

        if(!transaction){
            return [];
        }

        const ledger =
            this.loadLedger();

        const existing =
            ledger.some(entry =>
                entry.transactionId ===
                transaction.id
            );

        if(existing){

            return ledger.filter(
                entry =>
                    entry.transactionId ===
                    transaction.id
            );

        }

        const now =
            Date.now();

        const createdEntries = [];

        const grossEntry = {

            id:
                this.createId(
                    "ledger"
                ),

            transactionId:
                transaction.id,

            entryType:
                "gross-payment",

            account:
                "payment-clearing",

            direction:
                "credit",

            amount:
                this.clone(
                    transaction.amount
                ),

            createdAt:
                now

        };

        ledger.unshift(
            grossEntry
        );

        createdEntries.push(
            grossEntry
        );

        if(
            transaction.commission &&
            transaction.commission.enabled
        ){

            const platformEntry = {

                id:
                    this.createId(
                        "ledger"
                    ),

                transactionId:
                    transaction.id,

                entryType:
                    "platform-commission",

                account:
                    "vaero-platform",

                direction:
                    "credit",

                amount: {
                    amount:
                        transaction
                            .commission
                            .platformAmount,

                    currency:
                        transaction
                            .amount
                            .currency
                },

                createdAt:
                    now

            };

            const recipientEntry = {

                id:
                    this.createId(
                        "ledger"
                    ),

                transactionId:
                    transaction.id,

                entryType:
                    "recipient-revenue",

                account:
                    transaction
                        .commission
                        .recipientId ||
                    "external-recipient",

                direction:
                    "credit",

                amount: {

                    amount:
                        transaction
                            .commission
                            .recipientAmount,

                    currency:
                        transaction
                            .amount
                            .currency

                },

                createdAt:
                    now

            };

            ledger.unshift(
                platformEntry,
                recipientEntry
            );

            createdEntries.push(
                platformEntry,
                recipientEntry
            );

        }

        this.saveLedger(
            ledger
        );

        return createdEntries;

    },

    /*
     * =========================================================
     * REFUNDS
     * =========================================================
     */

    loadRefunds(){

        return this.readStorageArray(
            this.getRefundsStorageKey()
        );

    },

    saveRefunds(
        refunds
    ){

        return this.writeStorageArray(
            this.getRefundsStorageKey(),
            refunds
        );

    },

    async requestRefund(
        transactionId,
        requestedAmount = null,
        reason = null
    ){

        const transaction =
            this.getTransaction(
                transactionId
            );

        if(!transaction){
            return null;
        }

        const totalAmount =
            Number(
                transaction.amount?.amount
            ) || 0;

        const refundAmount =
            requestedAmount === null
                ? totalAmount
                : Number(
                    requestedAmount
                );

        if(
            !Number.isFinite(
                refundAmount
            ) ||
            refundAmount <= 0 ||
            refundAmount >
                totalAmount
        ){
            return null;
        }

        const now =
            Date.now();

        const refund = {

            id:
                this.createId(
                    "refund"
                ),

            transactionId:
                transaction.id,

            customerId:
                transaction.customerId,

            amount: {

                amount:
                    refundAmount,

                currency:
                    transaction
                        .amount
                        .currency

            },

            reason:
                reason ||
                null,

            status:
                "pending",

            createdAt:
                now,

            updatedAt:
                now

        };

        const refunds =
            this.loadRefunds();

        refunds.unshift(
            refund
        );

        this.saveRefunds(
            refunds
        );

        this.emit(
            "refund-requested",
            {
                refund:
                    this.clone(
                        refund
                    ),

                transaction:
                    this.clone(
                        transaction
                    )
            }
        );

        /*
         * Gerçek refund işlemi provider adapter üzerinden
         * yapılacak.
         */

        const provider =
            this.getPaymentProvider(
                transaction.provider
            );

        if(
            provider &&
            typeof provider.refund ===
                "function"
        ){

            try {

                const providerResult =
                    await provider.refund({

                        transaction:
                            this.clone(
                                transaction
                            ),

                        refund:
                            this.clone(
                                refund
                            )

                    });

                if(
                    providerResult &&
                    providerResult.status ===
                        "refunded"
                ){

                    return this.completeRefund(
                        refund.id
                    );

                }

            } catch(error){

                console.error(
                    "VAERO refund provider hatası:",
                    error
                );

            }

        }

        return refund;

    },

    completeRefund(
        refundId
    ){

        const refunds =
            this.loadRefunds();

        const refundIndex =
            refunds.findIndex(
                refund =>
                    refund.id ===
                    refundId
            );

        if(refundIndex === -1){
            return null;
        }

        const refund =
            refunds[
                refundIndex
            ];

        refund.status =
            "refunded";

        refund.updatedAt =
            Date.now();

        refund.completedAt =
            Date.now();

        this.saveRefunds(
            refunds
        );

        const transactions =
            this.loadTransactions();

        const transactionIndex =
            transactions.findIndex(
                transaction =>
                    transaction.id ===
                    refund.transactionId
            );

        if(transactionIndex !== -1){

            const transaction =
                transactions[
                    transactionIndex
                ];

            const originalAmount =
                Number(
                    transaction
                        .amount
                        .amount
                ) || 0;

            const allRefunds =
                refunds.filter(
                    currentRefund =>
                        currentRefund
                            .transactionId ===
                            transaction.id &&
                        currentRefund
                            .status ===
                            "refunded"
                );

            const refundedAmount =
                allRefunds.reduce(
                    (
                        total,
                        currentRefund
                    ) =>
                        total +
                        (
                            Number(
                                currentRefund
                                    .amount
                                    .amount
                            ) || 0
                        ),
                    0
                );

            transaction.status =
                refundedAmount >=
                originalAmount
                    ? this
                        .paymentStatuses
                        .REFUNDED
                    : this
                        .paymentStatuses
                        .PARTIALLY_REFUNDED;

            transaction.refundedAmount =
                refundedAmount;

            transaction.updatedAt =
                Date.now();

            this.saveTransactions(
                transactions
            );

        }

        this.emit(
            "refund-completed",
            {
                refund:
                    this.clone(
                        refund
                    )
            }
        );

        return refund;

    },

    /*
     * =========================================================
     * SETTLEMENT
     * =========================================================
     *
     * Geliştirici / hizmet sağlayıcı gelirlerinin
     * dağıtımı için gelecekte kullanılacak köprü.
     */

    updateSettlement(
        transactionId,
        status,
        settlementReference = null
    ){

        const allowedStatuses =
            Object.values(
                this.settlementStatuses
            );

        if(
            !allowedStatuses.includes(
                status
            )
        ){
            return null;
        }

        const transactions =
            this.loadTransactions();

        const index =
            transactions.findIndex(
                transaction =>
                    transaction.id ===
                    transactionId
            );

        if(index === -1){
            return null;
        }

        transactions[index] = {

            ...transactions[index],

            settlement: {

                ...transactions[index]
                    .settlement,

                status,

                reference:
                    settlementReference,

                updatedAt:
                    Date.now()

            },

            updatedAt:
                Date.now()

        };

        this.saveTransactions(
            transactions
        );

        this.emit(
            "settlement-updated",
            {
                transaction:
                    this.clone(
                        transactions[index]
                    )
            }
        );

        return transactions[index];

    },

    /*
     * =========================================================
     * EVENT BRIDGE
     * =========================================================
     *
     * Engine'in diğer parçalarının Payment Core ile
     * doğrudan birbirine yapışmasını engeller.
     *
     * Örnek:
     *
     * window.addEventListener(
     *     "vaero:payment:payment-completed",
     *     event => {}
     * );
     */

    emit(
        eventName,
        detail = {}
    ){

        try {

            window.dispatchEvent(
                new CustomEvent(
                    `vaero:payment:${eventName}`,
                    {
                        detail
                    }
                )
            );

        } catch(error){

            console.error(
                "VAERO Payment event gönderilemedi:",
                error
            );

        }

    },

    clone(
        value
    ){

        if(
            value === undefined
        ){
            return undefined;
        }

        try {

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch(error){

            return value;

        }

    },

    /*
     * =========================================================
     * HIGH LEVEL BRIDGES
     * =========================================================
     *
     * Bunlar ileride Engine'in farklı bölgelerinin
     * kullanacağı temiz giriş noktalarıdır.
     */

    createEngineSubscriptionPayment({

        planId,
        planName = null,
        amount,
        currency = this.baseCurrency,
        billingPeriod = null,
        metadata = {}

    } = {}){

        return this.createPaymentIntent({

            type:
                this.transactionTypes
                    .ENGINE_SUBSCRIPTION,

            source: {

                type:
                    this.sourceTypes
                        .ENGINE,

                id:
                    "vaero-engine",

                name:
                    "VAERO Engine"

            },

            subject: {

                id:
                    planId,

                type:
                    "subscription-plan",

                name:
                    planName

            },

            amount: {
                amount,
                currency
            },

            metadata: {

                billingPeriod,

                ...metadata

            }

        });

    },

    createAppPurchasePayment({

        appId,
        itemId,
        itemName = null,
        amount,
        currency = this.baseCurrency,
        commissionRate = 0,
        developerId = null,
        metadata = {}

    } = {}){

        return this.createPaymentIntent({

            type:
                this.transactionTypes
                    .APP_PURCHASE,

            source: {

                type:
                    this.sourceTypes
                        .APP_STORE,

                id:
                    appId

            },

            subject: {

                id:
                    itemId,

                type:
                    "application",

                name:
                    itemName

            },

            amount: {
                amount,
                currency
            },

            commission: {

                rate:
                    commissionRate,

                recipientId:
                    developerId

            },

            metadata

        });

    },

    createAppSubscriptionPayment({

        appId,
        subscriptionId,
        subscriptionName = null,
        amount,
        currency = this.baseCurrency,
        billingPeriod = null,
        commissionRate = 0,
        developerId = null,
        metadata = {}

    } = {}){

        return this.createPaymentIntent({

            type:
                this.transactionTypes
                    .APP_SUBSCRIPTION,

            source: {

                type:
                    this.sourceTypes
                        .APP_STORE,

                id:
                    appId

            },

            subject: {

                id:
                    subscriptionId,

                type:
                    "app-subscription",

                name:
                    subscriptionName

            },

            amount: {
                amount,
                currency
            },

            commission: {

                rate:
                    commissionRate,

                recipientId:
                    developerId

            },

            metadata: {

                billingPeriod,

                ...metadata

            }

        });

    },

    createServicePayment({

        serviceId,
        serviceName = null,
        sourceId = null,
        amount,
        currency = this.baseCurrency,
        commissionRate = 0,
        recipientId = null,
        metadata = {}

    } = {}){

        return this.createPaymentIntent({

            type:
                this.transactionTypes
                    .SERVICE,

            source: {

                type:
                    this.sourceTypes
                        .SERVICE,

                id:
                    sourceId ||
                    serviceId

            },

            subject: {

                id:
                    serviceId,

                type:
                    "service",

                name:
                    serviceName

            },

            amount: {
                amount,
                currency
            },

            commission: {

                rate:
                    commissionRate,

                recipientId

            },

            metadata

        });

    },

    createXPPayment({

        packageId,
        packageName = null,
        xpAmount = 0,
        amount,
        currency = this.baseCurrency,
        metadata = {}

    } = {}){

        return this.createPaymentIntent({

            type:
                this.transactionTypes
                    .XP,

            source: {

                type:
                    this.sourceTypes
                        .WALLET,

                id:
                    "vaero-xp"

            },

            subject: {

                id:
                    packageId,

                type:
                    "xp-package",

                name:
                    packageName

            },

            amount: {
                amount,
                currency
            },

            metadata: {

                xpAmount:
                    Number(
                        xpAmount
                    ) || 0,

                ...metadata

            }

        });

    },

    /*
     * Fiziksel ürün için yalnızca Payment Core köprüsü vardır.
     *
     * VAERO Engine ana arayüzü bunu kendiliğinden
     * çağırmaz ve fiziksel ürün kataloğu taşımaz.
     *
     * İleride ilgili uygulama / deneyim bunu çağırabilir.
     */

    createPhysicalGoodsPayment({

        applicationId,
        itemId,
        itemName = null,
        amount,
        currency = this.baseCurrency,
        commissionRate = 0,
        recipientId = null,
        metadata = {}

    } = {}){

        return this.createPaymentIntent({

            type:
                this.transactionTypes
                    .PHYSICAL_GOOD,

            source: {

                type:
                    this.sourceTypes
                        .APPLICATION,

                id:
                    applicationId

            },

            subject: {

                id:
                    itemId,

                type:
                    "physical-good",

                name:
                    itemName

            },

            amount: {
                amount,
                currency
            },

            commission: {

                rate:
                    commissionRate,

                recipientId

            },

            metadata

        });

    },

    /*
     * =========================================================
     * UI
     * =========================================================
     *
     * Bu uygulama artık ürün mağazası değildir.
     *
     * Henüz subscription planları tanımlanmadığı için
     * sahte fiyat / plan göstermiyoruz.
     */

    render(){

        return this.renderHome();

    },

    renderHome(){

        const transactions =
            this.loadTransactions();

        const activeTransactions =
            transactions.slice(
                0,
                5
            );

        return `
            <section class="vaero-commerce-app">

                <header class="vaero-commerce-header">

                    <div>

                        <span class="vaero-commerce-eyebrow">
                            VAERO ENGINE
                        </span>

                        <h1>
                            VAERO
                        </h1>

                        <p>
                            Engine hizmetlerini ve hesabını yönet.
                        </p>

                    </div>

                </header>

                <section class="vaero-commerce-section">

                    <div class="vaero-commerce-section-head">

                        <span>
                            ENGINE HİZMETİ
                        </span>

                    </div>

                    <p>
                        Abonelik seçenekleri burada Engine hizmet katmanına bağlanacak.
                    </p>

                </section>

                ${
                    activeTransactions.length
                        ? `
                            <section class="vaero-commerce-section">

                                <div class="vaero-commerce-section-head">

                                    <span>
                                        SON İŞLEMLER
                                    </span>

                                </div>

                                <div class="vaero-cart-items">

                                    ${activeTransactions
                                        .map(
                                            transaction => `
                                                <article class="vaero-cart-item">

                                                    <div class="vaero-cart-item-copy">

                                                        <span class="vaero-product-type">
                                                            ${transaction.type}
                                                        </span>

                                                        <strong>
                                                            ${
                                                                transaction
                                                                    .subject
                                                                    ?.name ||
                                                                transaction
                                                                    .subject
                                                                    ?.id ||
                                                                "VAERO işlemi"
                                                            }
                                                        </strong>

                                                        <small>
                                                            ${transaction.status}
                                                        </small>

                                                    </div>

                                                    <strong>
                                                        ${this.formatMoney(
                                                            transaction
                                                                .amount
                                                                .amount,
                                                            transaction
                                                                .amount
                                                                .currency
                                                        )}
                                                    </strong>

                                                </article>
                                            `
                                        )
                                        .join("")}

                                </div>

                            </section>
                        `
                        : ""
                }

            </section>
        `;

    }

};

window.VaeroApp =
    VaeroApp;
