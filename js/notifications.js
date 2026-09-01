/* =========================================================
   VAERO NOTIFICATION CENTER
   Notification / Interaction / Deep-Link Runtime

   PURPOSE
   ---------------------------------------------------------
   • Central notification state
   • Persistent unread/read state
   • Event → notification bridge
   • Notification → real action routing
   • Duplicate protection
   • Future social / world / message interaction layer

   IMPORTANT
   ---------------------------------------------------------
   This system does NOT create fake activity.

   A notification must originate from:
   • a real VAERO runtime event
   • an application lifecycle event
   • an explicit NotificationCenter.push() call
========================================================= */


const NotificationCenter = {

    id:
        "notifications",

    version:
        "1.0.0",


    /* =====================================================
       STATE
    ===================================================== */

    storageKey:
        "vaero:notifications:v1",

    maxItems:
        120,

    items:
        [],

    booted:
        false,

    eventSources:
        [],

    listeners:
        new Set(),


    /* =====================================================
       SAFETY
    ===================================================== */

    escapeHTML(value){

        return String(
            value ??
            ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    },


    normalizeText(
        value,
        maxLength = 500
    ){

        return String(
            value ??
            ""
        )
            .trim()
            .slice(
                0,
                maxLength
            );

    },


    normalizeDataset(value){

        if(
            !value ||
            typeof value !==
                "object" ||
            Array.isArray(
                value
            )
        ){

            return {};

        }


        const dataset = {};


        Object.entries(
            value
        )
            .forEach(
                (
                    [
                        key,
                        entry
                    ]
                ) => {

                    const safeKey =
                        String(
                            key ??
                            ""
                        )
                            .trim()
                            .replace(
                                /[^a-zA-Z0-9_-]/g,
                                ""
                            )
                            .slice(
                                0,
                                80
                            );


                    if(!safeKey){

                        return;

                    }


                    if(
                        entry ===
                            undefined ||
                        entry ===
                            null
                    ){

                        return;

                    }


                    dataset[
                        safeKey
                    ] =
                        String(
                            entry
                        )
                            .slice(
                                0,
                                500
                            );

                }
            );


        return dataset;

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(){

        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){

                return `notification_${crypto.randomUUID()}`;

            }

        } catch(error){

            /* fallback */

        }


        return `notification_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       STORAGE
    ===================================================== */

    load(){

        if(
            typeof localStorage ===
                "undefined"
        ){

            this.items =
                [];

            return [];

        }


        let saved =
            null;


        try{

            saved =
                localStorage.getItem(
                    this.storageKey
                );

        } catch(error){

            console.warn(
                "Bildirim geçmişi okunamadı:",
                error
            );

            this.items =
                [];

            return [];

        }


        if(!saved){

            this.items =
                [];

            return [];

        }


        try{

            const parsed =
                JSON.parse(
                    saved
                );


            if(
                !Array.isArray(
                    parsed
                )
            ){

                this.items =
                    [];

                return [];

            }


            this.items =
                parsed
                    .map(
                        item =>
                            this.normalizeItem(
                                item
                            )
                    )
                    .filter(
                        Boolean
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            b.createdAt -
                            a.createdAt
                    )
                    .slice(
                        0,
                        this.maxItems
                    );


            return [
                ...this.items
            ];

        } catch(error){

            console.warn(
                "Bildirim geçmişi çözümlenemedi:",
                error
            );

            this.items =
                [];

            return [];

        }

    },


    save(){

        if(
            typeof localStorage ===
                "undefined"
        ){

            return false;

        }


        try{

            localStorage.setItem(
                this.storageKey,
                JSON.stringify(
                    this.items.slice(
                        0,
                        this.maxItems
                    )
                )
            );


            return true;

        } catch(error){

            console.warn(
                "Bildirim geçmişi kaydedilemedi:",
                error
            );

            return false;

        }

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeItem(item){

        if(
            !item ||
            typeof item !==
                "object" ||
            Array.isArray(
                item
            )
        ){

            return null;

        }


        const title =
            this.normalizeText(
                item.title,
                120
            );


        const message =
            this.normalizeText(
                item.message,
                700
            );


        if(
            !title &&
            !message
        ){

            return null;

        }


        const createdAt =
            Number(
                item.createdAt
            );


        const readAt =
            Number(
                item.readAt
            );


        return {

            id:
                this.normalizeText(
                    item.id,
                    160
                ) ||
                this.createId(),

            type:
                this.normalizeText(
                    item.type ||
                    "info",
                    60
                ),

            category:
                this.normalizeText(
                    item.category ||
                    "general",
                    80
                ),

            title:
                title ||
                "Yeni bildirim",

            message,

            icon:
                this.normalizeText(
                    item.icon ||
                    "•",
                    20
                ),

            action:
                this.normalizeText(
                    item.action,
                    160
                ) ||
                null,

            dataset:
                this.normalizeDataset(
                    item.dataset
                ),

            source:
                this.normalizeText(
                    item.source ||
                    "vaero",
                    120
                ),

            dedupeKey:
                this.normalizeText(
                    item.dedupeKey,
                    240
                ) ||
                null,

            createdAt:
                Number.isFinite(
                    createdAt
                )
                    ? createdAt
                    : Date.now(),

            read:
                item.read ===
                    true,

            readAt:
                Number.isFinite(
                    readAt
                )
                    ? readAt
                    : null,

            priority:
                this.normalizePriority(
                    item.priority
                ),

            silent:
                item.silent ===
                    true,

            metadata:
                (
                    item.metadata &&
                    typeof item.metadata ===
                        "object" &&
                    !Array.isArray(
                        item.metadata
                    )
                )
                    ? {
                        ...item.metadata
                    }
                    : {}

        };

    },


    normalizePriority(value){

        const priority =
            String(
                value ||
                "normal"
            )
                .trim()
                .toLowerCase();


        return [
            "low",
            "normal",
            "high",
            "critical"
        ].includes(
            priority
        )
            ? priority
            : "normal";

    },


    /* =====================================================
       QUERY
    ===================================================== */

    all(){

        return [
            ...this.items
        ];

    },


    getAll(){

        return this.all();

    },


    find(notificationId){

        const id =
            this.normalizeText(
                notificationId,
                160
            );


        if(!id){

            return null;

        }


        return (
            this.items.find(
                item =>
                    item.id ===
                    id
            ) ||
            null
        );

    },


    getRecent(
        limit = 20
    ){

        const safeLimit =
            Math.min(
                100,
                Math.max(
                    1,
                    Number(
                        limit
                    ) ||
                    20
                )
            );


        return this.items.slice(
            0,
            safeLimit
        );

    },


    getUnread(){

        return this.items.filter(
            item =>
                item.read !==
                    true
        );

    },


    getUnreadCount(){

        return this.getUnread()
            .length;

    },


    hasUnread(){

        return (
            this.getUnreadCount() >
            0
        );

    },


    /* =====================================================
       PUSH
    ===================================================== */

    push(input = {}){

        const normalized =
            this.normalizeItem({
                ...input,

                id:
                    input.id ||
                    this.createId(),

                createdAt:
                    input.createdAt ||
                    Date.now(),

                read:
                    false,

                readAt:
                    null
            });


        if(!normalized){

            return false;

        }


        /*
         * Same semantic notification must not
         * continuously create duplicate cards.
         *
         * Instead the existing notification is
         * refreshed and returned to unread state.
         */

        if(
            normalized.dedupeKey
        ){

            const duplicateIndex =
                this.items.findIndex(
                    item =>
                        item.dedupeKey ===
                        normalized.dedupeKey
                );


            if(
                duplicateIndex >=
                    0
            ){

                const existing =
                    this.items[
                        duplicateIndex
                    ];


                const updated = {
                    ...existing,
                    ...normalized,

                    id:
                        existing.id,

                    createdAt:
                        Date.now(),

                    read:
                        false,

                    readAt:
                        null
                };


                this.items.splice(
                    duplicateIndex,
                    1
                );


                this.items.unshift(
                    updated
                );


                this.trim();

                this.save();

                this.emitChange(
                    "updated",
                    updated
                );


                return updated;

            }

        }


        this.items.unshift(
            normalized
        );


        this.trim();

        this.save();

        this.emitChange(
            "created",
            normalized
        );


        return normalized;

    },


    notify(input = {}){

        return this.push(
            input
        );

    },


    trim(){

        if(
            this.items.length <=
                this.maxItems
        ){

            return true;

        }


        this.items =
            this.items.slice(
                0,
                this.maxItems
            );


        return true;

    },


    /* =====================================================
       READ STATE
    ===================================================== */

    markRead(notificationId){

        const notification =
            this.find(
                notificationId
            );


        if(!notification){

            return false;

        }


        if(
            notification.read ===
                true
        ){

            return true;

        }


        notification.read =
            true;

        notification.readAt =
            Date.now();


        this.save();

        this.emitChange(
            "read",
            notification
        );


        return true;

    },


    markUnread(notificationId){

        const notification =
            this.find(
                notificationId
            );


        if(!notification){

            return false;

        }


        notification.read =
            false;

        notification.readAt =
            null;


        this.save();

        this.emitChange(
            "unread",
            notification
        );


        return true;

    },


    markAllRead(){

        let changed =
            false;


        const now =
            Date.now();


        this.items.forEach(
            item => {

                if(
                    item.read !==
                        true
                ){

                    item.read =
                        true;

                    item.readAt =
                        now;

                    changed =
                        true;

                }

            }
        );


        if(!changed){

            return true;

        }


        this.save();

        this.emitChange(
            "all-read",
            null
        );


        return true;

    },


    /* =====================================================
       REMOVE
    ===================================================== */

    remove(notificationId){

        const id =
            this.normalizeText(
                notificationId,
                160
            );


        if(!id){

            return false;

        }


        const index =
            this.items.findIndex(
                item =>
                    item.id ===
                    id
            );


        if(
            index <
                0
        ){

            return false;

        }


        const [
            removed
        ] =
            this.items.splice(
                index,
                1
            );


        this.save();

        this.emitChange(
            "removed",
            removed
        );


        return true;

    },


    dismiss(notificationId){

        return this.remove(
            notificationId
        );

    },


    clear(){

        if(
            !this.items.length
        ){

            return true;

        }


        this.items =
            [];


        this.save();

        this.emitChange(
            "cleared",
            null
        );


        return true;

    },


    /* =====================================================
       ACTION ROUTING
    ===================================================== */

    getActions(){

        try{

            if(
                typeof window !==
                    "undefined" &&
                window.Actions
            ){

                return window.Actions;

            }

        } catch(error){

            /* fallback */

        }


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.get ===
                    "function"
            ){

                return (
                    VAERO.get(
                        "actions"
                    ) ||
                    null
                );

            }

        } catch(error){

            /* unavailable */

        }


        return null;

    },


    route(notification){

        if(
            !notification ||
            !notification.action
        ){

            return false;

        }


        const action =
            this.normalizeText(
                notification.action,
                160
            );


        if(!action){

            return false;

        }


        const actions =
    this.getActions();


/*
 * CONTEXT DEEP LINK
 *
 * Bildirim belirli bir Dünya içindeki
 * belirli bir Varlık sayfasına aitse,
 * bağlam doğru sırayla geri yüklenir.
 */

const metadata =
    notification.metadata &&
    typeof notification.metadata ===
        "object"
        ? notification.metadata
        : {};


const deepWorldId =
    this.normalizeText(
        metadata.worldId,
        160
    );


const deepEntityId =
    this.normalizeText(
        metadata.entityId ||
        notification.dataset?.entityId,
        160
    );


const deepPage =
    this.normalizeText(
        metadata.page,
        80
    );


const allowedEntityPages =
    new Set([
        "identity",
        "profile",
        "organs",
        "timeline",
        "memory",
        "bridge",
        "evolution",
        "settings",
        "discovery"
    ]);


if(
    actions &&
    typeof actions.routeAction ===
        "function" &&
    deepWorldId &&
    deepEntityId &&
    deepPage &&
    allowedEntityPages.has(
        deepPage
    )
){

    try{

        const openedWorld =
            actions.routeAction(
                "world:open",
                {
                    dataset:{
                        worldId:
                            deepWorldId
                    }
                }
            );


        if(
            openedWorld ===
                false
        ){

            return false;

        }


        const openedEntity =
            actions.routeAction(
                "entity:open",
                {
                    dataset:{
                        entityId:
                            deepEntityId
                    }
                }
            );


        if(
            openedEntity ===
                false
        ){

            return false;

        }


        const openedPage =
            actions.routeAction(
                `entity:${deepPage}`,
                {
                    dataset:{}
                }
            );


        if(
            openedPage !==
                false
        ){

            this.closePanel();

            return openedPage;

        }

    } catch(error){

        console.warn(
            "Bildirim deep-link açılamadı:",
            error
        );

    }

}


const proxyButton = {
            dataset:{
                ...this.normalizeDataset(
                    notification.dataset
                ),

                action
            }

        };


        /*
         * Canonical direct router.
         */

        if(
            actions &&
            typeof actions.routeAction ===
                "function"
        ){

            try{

                const result =
                    actions.routeAction(
                        action,
                        proxyButton
                    );


                if(
                    result !==
                        false
                ){

                    return result;

                }

            } catch(error){

                console.warn(
                    "Bildirim yönlendirmesi başarısız:",
                    error
                );

            }

        }


        /*
         * DOM compatibility fallback.
         */

        if(
            typeof document ===
                "undefined"
        ){

            return false;

        }


        try{

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.hidden =
                true;

            button.dataset.action =
                action;


            Object.entries(
                this.normalizeDataset(
                    notification.dataset
                )
            )
                .forEach(
                    (
                        [
                            key,
                            value
                        ]
                    ) => {

                        try{

                            button.dataset[
                                key
                            ] =
                                value;

                        } catch(error){

                            /* invalid dataset key */

                        }

                    }
                );


            button.setAttribute(
                "aria-hidden",
                "true"
            );


            document.body.appendChild(
                button
            );


            button.click();

            button.remove();


            return true;

        } catch(error){

            console.warn(
                "Bildirim fallback yönlendirmesi başarısız:",
                error
            );


            return false;

        }

    },


    open(notificationId){

        const notification =
            this.find(
                notificationId
            );


        if(!notification){

            return false;

        }


        this.markRead(
            notification.id
        );


        if(
            !notification.action
        ){

            return true;

        }


        return this.route(
            notification
        );

    },


    /* =====================================================
       CHANGE EVENTS
    ===================================================== */

    subscribe(callback){

        if(
            typeof callback !==
                "function"
        ){

            return false;

        }


        this.listeners.add(
            callback
        );


        return true;

    },


    unsubscribe(callback){

        return this.listeners.delete(
            callback
        );

    },


    emitChange(
        reason,
        notification = null
    ){

        const payload = {

            reason,

            notification,

            unreadCount:
                this.getUnreadCount(),

            total:
                this.items.length,

            time:
                Date.now()

        };


        this.listeners
            .forEach(
                callback => {

                    try{

                        callback(
                            payload
                        );

                    } catch(error){

                        console.warn(
                            "Notification listener başarısız:",
                            error
                        );

                    }

                }
            );


        /*
         * Browser-level event.
         */

        try{

            if(
                typeof document !==
                    "undefined" &&
                typeof CustomEvent ===
                    "function"
            ){

                document.dispatchEvent(
                    new CustomEvent(
                        "vaero:notifications:changed",
                        {
                            detail:
                                payload
                        }
                    )
                );

            }

        } catch(error){

            /* optional */

        }


        /*
         * VAERO event bridge.
         */

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    "notifications:changed",
                    payload
                );

            }

        } catch(error){

            /* optional */

        }


        this.refreshMountedUI();


        return true;

    },


    /* =====================================================
       EVENT → NOTIFICATION
    ===================================================== */

    handleRuntimeEvent(
        eventName,
        payload = {}
    ){

        const event =
            this.normalizeText(
                eventName,
                160
            );


        if(!event){

            return false;

        }


        const data =
            (
                payload &&
                typeof payload ===
                    "object" &&
                !Array.isArray(
                    payload
                )
            )
                ? payload
                : {};


        switch(event){


        /* -------------------------------------------------
           APPLICATIONS
        ------------------------------------------------- */

        case "application:installed":{

            const appId =
                this.normalizeText(
                    data.appId ||
                    "uygulama",
                    120
                );


            return this.push({

                type:
                    "success",

                category:
                    "application",

                icon:
                    "▦",

                title:
                    "Uygulama hazır",

                message:
                    `${appId} kullanıma hazır.`,

                action:
                    "app:applications",

                source:
                    "applications",

                dedupeKey:
                    `application:installed:${appId}`,

                metadata:{
                    appId
                }

            });

        }


        case "application:updated":{

            const appId =
                this.normalizeText(
                    data.appId ||
                    "uygulama",
                    120
                );


            return this.push({

                type:
                    "info",

                category:
                    "application",

                icon:
                    "↻",

                title:
                    "Güncelleme tamamlandı",

                message:
                    `${appId} güncellendi.`,

                action:
                    "app:applications",

                source:
                    "applications",

                dedupeKey:
                    `application:updated:${appId}`,

                metadata:{
                    appId
                }

            });

        }


        case "application:removed":{

            const appId =
                this.normalizeText(
                    data.appId ||
                    "uygulama",
                    120
                );


            return this.push({

                type:
                    "info",

                category:
                    "application",

                icon:
                    "−",

                title:
                    "Uygulama kaldırıldı",

                message:
                    `${appId} artık yüklü değil.`,

                action:
                    "app:applications",

                source:
                    "applications",

                dedupeKey:
                    `application:removed:${appId}`,

                metadata:{
                    appId
                }

            });

        }


        /* -------------------------------------------------
           WORLDS
        ------------------------------------------------- */

        case "world:created":{

            const worldId =
                this.normalizeText(
                    data.worldId ||
                    data.id,
                    160
                );

            const worldName =
                this.normalizeText(
                    data.name ||
                    data.title ||
                    "Yeni dünya",
                    160
                );


            return this.push({

                type:
                    "success",

                category:
                    "world",

                icon:
                    "◯",

                title:
                    "Dünyan hazır",

                message:
                    `${worldName} oluşturuldu.`,

                action:
                    worldId
                        ? "world:open"
                        : "worlds:open",

                dataset:
                    worldId
                        ? {
                            worldId
                        }
                        : {},

                source:
                    "world",

                dedupeKey:
                    worldId
                        ? `world:created:${worldId}`
                        : null,

                metadata:{
                    worldId,
                    worldName
                }

            });

        }


        case "world:updated":{

            const worldId =
                this.normalizeText(
                    data.worldId ||
                    data.id,
                    160
                );


            return this.push({

                type:
                    "info",

                category:
                    "world",

                icon:
                    "◯",

                title:
                    "Dünya güncellendi",

                message:
                    this.normalizeText(
                        data.message ||
                        data.name ||
                        "Değişikliklerin kaydedildi.",
                        300
                    ),

                action:
                    worldId
                        ? "world:open"
                        : "worlds:open",

                dataset:
                    worldId
                        ? {
                            worldId
                        }
                        : {},

                source:
                    "world",

                dedupeKey:
                    worldId
                        ? `world:updated:${worldId}`
                        : null

            });

        }


        /* -------------------------------------------------
           ENTITIES
        ------------------------------------------------- */

        case "entity:created":{

            const entityId =
                this.normalizeText(
                    data.entityId ||
                    data.id,
                    160
                );

            const entityName =
                this.normalizeText(
                    data.name ||
                    data.title ||
                    "Yeni varlık",
                    160
                );


            return this.push({

                type:
                    "success",

                category:
                    "entity",

                icon:
                    "◇",

                title:
                    "Yeni alan hazır",

                message:
                    `${entityName} oluşturuldu.`,

                action:
                    entityId
                        ? "entity:open"
                        : "entities:open",

                dataset:
                    entityId
                        ? {
                            entityId
                        }
                        : {},

                source:
                    "entity",

                dedupeKey:
                    entityId
                        ? `entity:created:${entityId}`
                        : null,

                metadata:{
                    entityId,
                    entityName
                }

            });

        }


        case "entity:updated":{

            const entityId =
                this.normalizeText(
                    data.entityId ||
                    data.id,
                    160
                );


            return this.push({

                type:
                    "info",

                category:
                    "entity",

                icon:
                    "◇",

                title:
                    "Değişiklik kaydedildi",

                message:
                    this.normalizeText(
                        data.message ||
                        data.name ||
                        "Bilgilerin güncellendi.",
                        300
                    ),

                action:
                    entityId
                        ? "entity:open"
                        : "entities:open",

                dataset:
                    entityId
                        ? {
                            entityId
                        }
                        : {},

                source:
                    "entity",

                dedupeKey:
                    entityId
                        ? `entity:updated:${entityId}`
                        : null

            });

        }

   /* -------------------------------------------------
   PROFILE
------------------------------------------------- */

case "profile:saved":{

    const entityId =
        this.normalizeText(
            data.entityId,
            160
        );

    const worldId =
        this.normalizeText(
            data.worldId,
            160
        );

    const isRoot =
        data.isRoot ===
            true;


    return this.push({

        type:
            "success",

        category:
            "personal",

        icon:
            "✓",

        title:
            "Profilin güncellendi",

        message:
            "Değişikliklerin kaydedildi.",

        action:
            isRoot
                ? "profile:open"
                : "entity:open",

        dataset:
            !isRoot &&
            entityId
                ? {
                    entityId
                }
                : {},

        source:
            "profile",

        dedupeKey:
            entityId
                ? `profile:saved:${entityId}`
                : "profile:saved:root",

        metadata:{
            entityId,
            worldId,
            isRoot,
            page:
                isRoot
                    ? null
                    : "profile"
        }

    });

}


        /* -------------------------------------------------
           DISCOVERY
        ------------------------------------------------- */

        case "discovery:completed":{

            return this.push({

                type:
                    "success",

                category:
                    "personal",

                icon:
                    "✓",

                title:
                    "Tercihlerin güncellendi",

                message:
                    "VAERO önerilerini yeni yönüne göre hazırlayacak.",

                action:
                    "home:open",

                source:
                    "discovery",

                dedupeKey:
                    `discovery:completed:${data.completedAt || "latest"}`

            });

        }


        /* -------------------------------------------------
           SOCIAL / INTERACTION — FUTURE READY
        ------------------------------------------------- */

        case "social:message":{

            const sender =
                this.normalizeText(
                    data.senderName ||
                    data.sender ||
                    "Yeni mesaj",
                    120
                );


            return this.push({

                type:
                    "social",

                category:
                    "social",

                icon:
                    "●",

                title:
                    sender,

                message:
                    this.normalizeText(
                        data.message ||
                        "Sana yeni bir mesaj gönderdi.",
                        400
                    ),

                action:
                    this.normalizeText(
                        data.action,
                        160
                    ) ||
                    null,

                dataset:
                    data.dataset ||
                    {},

                source:
                    "social",

                dedupeKey:
                    this.normalizeText(
                        data.dedupeKey,
                        240
                    ) ||
                    null,

                priority:
                    "high"

            });

        }


        case "social:interaction":{

            return this.push({

                type:
                    "social",

                category:
                    "social",

                icon:
                    "✦",

                title:
                    this.normalizeText(
                        data.title ||
                        "Yeni etkileşim",
                        120
                    ),

                message:
                    this.normalizeText(
                        data.message ||
                        "",
                        400
                    ),

                action:
                    this.normalizeText(
                        data.action,
                        160
                    ) ||
                    null,

                dataset:
                    data.dataset ||
                    {},

                source:
                    "social",

                dedupeKey:
                    this.normalizeText(
                        data.dedupeKey,
                        240
                    ) ||
                    null

            });

        }


        default:

            return false;

        }

    },


    /* =====================================================
       EVENT BUS BRIDGE
    ===================================================== */

    getPossibleEventSources(){

        const sources =
            [];


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.on ===
                    "function"
            ){

                sources.push(
                    VAERO
                );

            }

        } catch(error){

            /* optional */

        }


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.get ===
                    "function"
            ){

                const events =
                    VAERO.get(
                        "events"
                    );


                if(
                    events &&
                    typeof events.on ===
                        "function"
                ){

                    sources.push(
                        events
                    );

                }

            }

        } catch(error){

            /* optional */

        }


        return [
            ...new Set(
                sources
            )
        ];

    },


    bindEventSource(source){

        if(
            !source ||
            typeof source.on !==
                "function"
        ){

            return false;

        }


        if(
            this.eventSources.includes(
                source
            )
        ){

            return true;

        }


        const events = [

            "application:installed",
            "application:updated",
            "application:removed",

            "world:created",
            "world:updated",

            "entity:created",
            "entity:updated",

            "discovery:completed",

            "social:message",
            "social:interaction"

        ];


        let bound =
            false;


        events.forEach(
            eventName => {

                try{

                    source.on(
                        eventName,
                        payload => {

                            this.handleRuntimeEvent(
                                eventName,
                                payload
                            );

                        }
                    );


                    bound =
                        true;

                } catch(error){

                    /* event unsupported */

                }

            }
        );


        if(bound){

            this.eventSources.push(
                source
            );

        }


        return bound;

    },


    bindEventBridge(){

        const sources =
            this.getPossibleEventSources();


        let bound =
            false;


        sources.forEach(
            source => {

                if(
                    this.bindEventSource(
                        source
                    )
                ){

                    bound =
                        true;

                }

            }
        );


        return bound;

    },


    /* =====================================================
       UI HELPERS
    ===================================================== */

    renderBadge(){

        const unread =
            this.getUnreadCount();


        if(
            unread <=
                0
        ){

            return "";

        }


        return `
            <span
                class="notification-badge"
                aria-label="${this.escapeHTML(
                    `${unread} okunmamış bildirim`
                )}"
            >
                ${
                    unread >
                        99
                        ? "99+"
                        : unread
                }
            </span>
        `;

    },


    renderBell(){

        return `
            <button
                type="button"
                class="engine-icon-btn notification-trigger"
                data-notification-command="toggle"
                aria-label="Bildirimler"
                title="Bildirimler"
            >
                <span
                    aria-hidden="true"
                    class="notification-bell-icon"
                >
                    ♢
                </span>

                ${this.renderBadge()}
            </button>
        `;

    },


    formatTime(timestamp){

        const time =
            Number(
                timestamp
            );


        if(
            !Number.isFinite(
                time
            )
        ){

            return "";

        }


        const difference =
            Math.max(
                0,
                Date.now() -
                time
            );


        const minute =
            60 * 1000;

        const hour =
            60 * minute;

        const day =
            24 * hour;


        if(
            difference <
                minute
        ){

            return "Şimdi";

        }


        if(
            difference <
                hour
        ){

            return `${Math.floor(
                difference /
                minute
            )} dk`;

        }


        if(
            difference <
                day
        ){

            return `${Math.floor(
                difference /
                hour
            )} sa`;

        }


        return `${Math.floor(
            difference /
            day
        )} gün`;

    },


    renderItem(notification){

        if(!notification){

            return "";

        }


        return `
            <article
                class="notification-item ${
                    notification.read
                        ? "is-read"
                        : "is-unread"
                }"
                data-notification-id="${this.escapeHTML(
                    notification.id
                )}"
                data-notification-priority="${this.escapeHTML(
                    notification.priority
                )}"
            >

                <button
                    type="button"
                    class="notification-item-main"
                    data-notification-command="open"
                    data-notification-id="${this.escapeHTML(
                        notification.id
                    )}"
                >

                    <span
                        class="notification-item-icon"
                        aria-hidden="true"
                    >
                        ${this.escapeHTML(
                            notification.icon
                        )}
                    </span>

                    <span
                        class="notification-item-copy"
                    >

                        <span
                            class="notification-item-title"
                        >
                            ${this.escapeHTML(
                                notification.title
                            )}
                        </span>

                        ${
                            notification.message
                                ? `
                                    <span
                                        class="notification-item-message"
                                    >
                                        ${this.escapeHTML(
                                            notification.message
                                        )}
                                    </span>
                                `
                                : ""
                        }

                    </span>

                    <span
                        class="notification-item-time"
                    >
                        ${this.escapeHTML(
                            this.formatTime(
                                notification.createdAt
                            )
                        )}
                    </span>

                    ${
                        notification.read
                            ? ""
                            : `
                                <span
                                    class="notification-unread-dot"
                                    aria-hidden="true"
                                ></span>
                            `
                    }

                </button>

                <button
                    type="button"
                    class="notification-dismiss"
                    data-notification-command="dismiss"
                    data-notification-id="${this.escapeHTML(
                        notification.id
                    )}"
                    aria-label="Bildirimi kaldır"
                >
                    ×
                </button>

            </article>
        `;

    },


    renderPanel(){

        const notifications =
            this.getRecent(
                40
            );


        return `
            <aside
                id="notificationPanel"
                class="notification-panel"
                aria-label="Bildirimler"
            >

                <div
                    class="notification-panel-head"
                >

                    <div>

                        <span
                            class="notification-panel-eyebrow"
                        >
                            VAERO
                        </span>

                        <h2>
                            Bildirimler
                        </h2>

                    </div>

                    <button
                        type="button"
                        class="notification-panel-close"
                        data-notification-command="close"
                        aria-label="Bildirimleri kapat"
                    >
                        ×
                    </button>

                </div>

                ${
                    notifications.length
                        ? `
                            <div
                                class="notification-panel-actions"
                            >

                                ${
                                    this.hasUnread()
                                        ? `
                                            <button
                                                type="button"
                                                data-notification-command="read-all"
                                            >
                                                Tümünü okundu yap
                                            </button>
                                        `
                                        : ""
                                }

                            </div>

                            <div
                                class="notification-list"
                            >
                                ${notifications
                                    .map(
                                        notification =>
                                            this.renderItem(
                                                notification
                                            )
                                    )
                                    .join("")}
                            </div>
                        `
                        : `
                            <div
                                class="notification-empty"
                            >

                                <span
                                    aria-hidden="true"
                                >
                                    ◇
                                </span>

                                <strong>
                                    Şimdilik sessiz
                                </strong>

                                <p>
                                    Sana gerçekten gereken gelişmeler burada görünecek.
                                </p>

                            </div>
                        `
                }

            </aside>
        `;

    },


    /* =====================================================
       PANEL
    ===================================================== */

    isPanelOpen(){

        return Boolean(
            document.getElementById(
                "notificationPanel"
            )
        );

    },


    openPanel(){

        if(
            typeof document ===
                "undefined"
        ){

            return false;

        }


        const current =
            document.getElementById(
                "notificationPanel"
            );


        if(current){

            this.refreshMountedUI();

            return true;

        }


        const host =
            document.createElement(
                "div"
            );


        host.id =
            "notificationLayer";

        host.className =
            "notification-layer";

        host.innerHTML =
            this.renderPanel();


        document.body.appendChild(
            host
        );


        requestAnimationFrame(
            () => {

                host.classList.add(
                    "is-open"
                );

            }
        );


        return true;

    },


    closePanel(){

        if(
            typeof document ===
                "undefined"
        ){

            return false;

        }


        const layer =
            document.getElementById(
                "notificationLayer"
            );


        if(!layer){

            return true;

        }


        layer.classList.remove(
            "is-open"
        );


        setTimeout(
            () => {

                layer.remove();

            },
            180
        );


        return true;

    },


    togglePanel(){

        if(
            this.isPanelOpen()
        ){

            return this.closePanel();

        }


        return this.openPanel();

    },


    refreshMountedUI(){

        if(
            typeof document ===
                "undefined"
        ){

            return false;

        }


        /*
         * Refresh badges without remounting Engine.
         */

        document
            .querySelectorAll(
                ".notification-trigger"
            )
            .forEach(
                trigger => {

                    trigger
                        .querySelectorAll(
                            ".notification-badge"
                        )
                        .forEach(
                            badge =>
                                badge.remove()
                        );


                    const badgeHTML =
                        this.renderBadge();


                    if(
                        badgeHTML
                    ){

                        trigger.insertAdjacentHTML(
                            "beforeend",
                            badgeHTML
                        );

                    }

                }
            );


        const layer =
            document.getElementById(
                "notificationLayer"
            );


        if(layer){

            layer.innerHTML =
                this.renderPanel();

        }


        return true;

    },


    /* =====================================================
       COMMANDS
    ===================================================== */

    handleCommand(
        command,
        button = null
    ){

        const target =
            this.normalizeText(
                command,
                80
            );


        switch(target){

        case "toggle":

            return this.togglePanel();


        case "open":

            return this.open(
                button?.dataset
                    ?.notificationId
            );


        case "dismiss":

            return this.remove(
                button?.dataset
                    ?.notificationId
            );


        case "read-all":

            return this.markAllRead();


        case "close":

            return this.closePanel();


        default:

            return false;

        }

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(
            this.booted ===
                true
        ){

            this.bindEventBridge();

            return true;

        }


        this.load();

        this.booted =
            true;


        this.bindEventBridge();


        return true;

    },


    report(){

        return {

            version:
                this.version,

            booted:
                this.booted,

            total:
                this.items.length,

            unread:
                this.getUnreadCount(),

            eventSources:
                this.eventSources.length

        };

    }

};


/* =========================================================
   DOCUMENT COMMAND ROUTER
========================================================= */

if(
    typeof document !==
        "undefined"
){

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target
                    ?.closest?.(
                        "[data-notification-command]"
                    );


            if(!button){

                return;

            }


            event.preventDefault();

            event.stopPropagation();


            NotificationCenter
                .handleCommand(
                    button.dataset
                        .notificationCommand,
                    button
                );

        }
    );


    /*
     * Close by clicking outside panel.
     */

    document.addEventListener(
        "pointerdown",
        event => {

            const layer =
                document.getElementById(
                    "notificationLayer"
                );


            if(!layer){

                return;

            }


            const panel =
                document.getElementById(
                    "notificationPanel"
                );


            if(
                panel &&
                panel.contains(
                    event.target
                )
            ){

                return;

            }


            if(
                event.target
                    ?.closest?.(
                        "[data-notification-command=\"toggle\"]"
                    )
            ){

                return;

            }


            NotificationCenter
                .closePanel();

        }
    );


    /*
     * Escape closes panel.
     */

    document.addEventListener(
        "keydown",
        event => {

            if(
                event.key !==
                    "Escape"
            ){

                return;

            }


            if(
                NotificationCenter
                    .isPanelOpen()
            ){

                NotificationCenter
                    .closePanel();

            }

        }
    );

}


/* =========================================================
   VAERO REGISTRATION
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        VAERO.register(
            "notifications",
            NotificationCenter
        );

    }

} catch(error){

    console.warn(
        "NotificationCenter VAERO registration failed:",
        error
    );

}


/* =========================================================
   GLOBAL
========================================================= */

if(
    typeof window !==
        "undefined"
){

    window.NotificationCenter =
        NotificationCenter;

}


/* =========================================================
   START
========================================================= */

NotificationCenter.boot();


if(
    typeof document !==
        "undefined"
){

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            NotificationCenter.boot();

            /*
             * Some VAERO services finish registering
             * after this file. Re-check without
             * creating duplicate subscriptions.
             */

            setTimeout(
                () =>
                    NotificationCenter
                        .bindEventBridge(),
                500
            );


            setTimeout(
                () =>
                    NotificationCenter
                        .bindEventBridge(),
                1500
            );

        },
        {
            once:
                true
        }
    );

}
