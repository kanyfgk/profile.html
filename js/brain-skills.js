/* =========================================================
   VAERO BRAIN SKILLS
   Policy-Aware Skill Registry / Execution Layer
========================================================= */

const BrainSkills = {

    version:
        "3.0.0",

    skills:
        new Map(),

    executionHistory:
        [],

    historyLimit:
        50,

    defaultTimeout:
        15000,

    maxTimeout:
        60000,

    maxPayloadDepth:
        4,

    maxPayloadArray:
        100,

    maxPayloadKeys:
        120,

    maxStringLength:
        8000,


    /* =====================================================
       SERVICE ACCESS
    ===================================================== */

    getService(name){

        const serviceName =
            String(
                name ??
                ""
            ).trim();


        if(!serviceName){

            return null;

        }


        try{

            if(
                typeof VAERO ===
                    "undefined" ||
                typeof VAERO.get !==
                    "function"
            ){

                return null;

            }


            return (
                VAERO.get(
                    serviceName
                ) ||
                null
            );

        } catch(error){

            console.warn(
                `Brain Skills servisi okunamadı: ${serviceName}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeName(name){

        return String(
            name ??
                ""
        )
            .trim()
            .toLowerCase()
            .slice(
                0,
                200
            );

    },


    normalizeText(
        value,
        fallback = "",
        maxLength = 1000
    ){

        const text =
            String(
                value ??
                    fallback
            )
                .trim()
                .slice(
                    0,
                    maxLength
                );


        return (
            text ||
            String(
                fallback ??
                    ""
            )
                .trim()
                .slice(
                    0,
                    maxLength
                )
        );

    },


    normalizeArray(value){

        if(
            !Array.isArray(
                value
            ) &&
            !(value instanceof Set)
        ){

            return [];

        }


        const source =
            Array.isArray(
                value
            )
                ? value
                : [
                    ...value
                ];


        const seen =
            new Set();


        return source
            .map(
                item =>
                    String(
                        item ??
                            ""
                    )
                        .trim()
                        .toLowerCase()
                        .slice(
                            0,
                            200
                        )
            )
            .filter(
                item => {

                    if(
                        !item ||
                        seen.has(
                            item
                        )
                    ){

                        return false;

                    }


                    seen.add(
                        item
                    );


                    return true;

                }
            );

    },


    normalizeMode(mode){

        const value =
            String(
                mode ||
                    "read"
            )
                .trim()
                .toLowerCase();


        return [
            "read",
            "action"
        ].includes(
            value
        )
            ? value
            : "read";

    },


    normalizeTimeout(value){

        const timeout =
            Number(
                value
            );


        if(
            !Number.isFinite(
                timeout
            )
        ){

            return this.defaultTimeout;

        }


        return Math.max(
            1000,
            Math.min(
                this.maxTimeout,
                Math.round(
                    timeout
                )
            )
        );

    },


    normalizeMetadata(
        metadata = {}
    ){

        const safe =
            metadata &&
            typeof metadata ===
                "object" &&
            !Array.isArray(
                metadata
            )
                ? metadata
                : {};


        const mode =
            this.normalizeMode(
                safe.mode
            );


        return {

            title:
                this.normalizeText(
                    safe.title,
                    "",
                    240
                ),

            description:
                this.normalizeText(
                    safe.description,
                    "",
                    2000
                ),

            version:
                this.normalizeText(
                    safe.version,
                    "1.0.0",
                    80
                ),

            sourceAppId:
                safe.sourceAppId
                    ? this.normalizeName(
                        safe.sourceAppId
                    )
                    : null,

            mode,

            actionType:
                safe.actionType
                    ? this.normalizeName(
                        safe.actionType
                    )
                    : null,

            requiredPermissions:
                this.normalizeArray(
                    safe.requiredPermissions
                ),

            requiredCapabilities:
                this.normalizeArray(
                    safe.requiredCapabilities
                ),

            tags:
                this.normalizeArray(
                    safe.tags
                ),

            timeout:
                this.normalizeTimeout(
                    safe.timeout
                ),

            internal:
                safe.internal ===
                    true,

            enabled:
                safe.enabled !==
                    false

        };

    },


    /* =====================================================
       SAFE CLONE
    ===================================================== */

    clone(value){

        if(
            value ===
                null ||
            value ===
                undefined
        ){

            return value;

        }


        try{

            if(
                typeof structuredClone ===
                    "function"
            ){

                return structuredClone(
                    value
                );

            }

        } catch(error){

            /* JSON fallback */

        }


        try{

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       SAFE INPUT
    ===================================================== */

    sanitizeInput(
        value,
        depth = 0,
        seen = new WeakSet()
    ){

        if(
            value ===
                null ||
            value ===
                undefined
        ){

            return value;

        }


        if(
            depth >
                this.maxPayloadDepth
        ){

            return "[depth-limit]";

        }


        if(
            typeof value ===
                "string"
        ){

            return value.slice(
                0,
                this.maxStringLength
            );

        }


        if(
            typeof value ===
                "number"
        ){

            return Number.isFinite(
                value
            )
                ? value
                : null;

        }


        if(
            typeof value ===
                "boolean"
        ){

            return value;

        }


        if(
            typeof value ===
                "bigint"
        ){

            return String(
                value
            );

        }


        if(
            typeof value ===
                "function" ||
            typeof value ===
                "symbol"
        ){

            return undefined;

        }


        if(
            value instanceof Date
        ){

            const timestamp =
                value.getTime();


            return Number.isFinite(
                timestamp
            )
                ? value.toISOString()
                : null;

        }


        if(
            Array.isArray(
                value
            )
        ){

            return value
                .slice(
                    0,
                    this.maxPayloadArray
                )
                .map(
                    item =>
                        this.sanitizeInput(
                            item,
                            depth + 1,
                            seen
                        )
                )
                .filter(
                    item =>
                        item !==
                            undefined
                );

        }


        if(
            typeof value ===
                "object"
        ){

            try{

                if(
                    seen.has(
                        value
                    )
                ){

                    return "[circular]";

                }


                seen.add(
                    value
                );

            } catch(error){

                return null;

            }


            const blockedKeys =
                new Set([

                    "password",
                    "passphrase",
                    "secret",
                    "clientsecret",
                    "client_secret",
                    "token",
                    "idtoken",
                    "id_token",
                    "accesstoken",
                    "access_token",
                    "refreshtoken",
                    "refresh_token",
                    "authorization",
                    "apikey",
                    "api_key",
                    "privatekey",
                    "private_key",
                    "cardnumber",
                    "card_number",
                    "cvv",
                    "cvc",
                    "pin"

                ]);


            const result =
                {};


            Object.entries(
                value
            )
                .slice(
                    0,
                    this.maxPayloadKeys
                )
                .forEach(
                    (
                        [
                            key,
                            item
                        ]
                    ) => {

                        const normalizedKey =
                            String(
                                key
                            )
                                .trim()
                                .toLowerCase()
                                .replace(
                                    /[\s-]/g,
                                    ""
                                );


                        if(
                            blockedKeys.has(
                                normalizedKey
                            )
                        ){

                            result[
                                key
                            ] =
                                "[redacted]";


                            return;

                        }


                        const sanitized =
                            this.sanitizeInput(
                                item,
                                depth + 1,
                                seen
                            );


                        if(
                            sanitized !==
                                undefined
                        ){

                            result[
                                key
                            ] =
                                sanitized;

                        }

                    }
                );


            return result;

        }


        return String(
            value
        ).slice(
            0,
            this.maxStringLength
        );

    },


    /* =====================================================
       EVENTS
    ===================================================== */

    emit(
        eventName,
        payload = {}
    ){

        const name =
            String(
                eventName ??
                    ""
            ).trim();


        if(!name){

            return false;

        }


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    name,
                    payload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `BrainSkills event gönderilemedi: ${name}`,
                error
            );

        }


        try{

            const events =
                this.getService(
                    "events"
                );


            if(
                events &&
                typeof events.emit ===
                    "function"
            ){

                events.emit(
                    name,
                    payload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `BrainSkills event fallback gönderilemedi: ${name}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       REGISTER
    ===================================================== */

    register(
        name,
        handler,
        metadata = {},
        options = {}
    ){

        const skillName =
            this.normalizeName(
                name
            );


        if(!skillName){

            console.error(
                "Brain skill kaydedilemedi: isim eksik."
            );


            return false;

        }


        if(
            typeof handler !==
                "function"
        ){

            console.error(
                `Brain skill kaydedilemedi: ${skillName} handler fonksiyonu değil.`
            );


            return false;

        }


        const overwrite =
            options?.overwrite ===
                true;


        if(
            this.skills.has(
                skillName
            ) &&
            !overwrite
        ){

            console.warn(
                `Brain skill zaten kayıtlı: ${skillName}`
            );


            return false;

        }


        const safeMetadata =
            this.normalizeMetadata(
                metadata
            );


        if(
            safeMetadata.mode ===
                "action" &&
            !safeMetadata.actionType
        ){

            console.error(
                `Brain action skill actionType olmadan kaydedilemez: ${skillName}`
            );


            return false;

        }


        const now =
            Date.now();


        const previous =
            this.skills.get(
                skillName
            );


        this.skills.set(
            skillName,
            {

                name:
                    skillName,

                handler,

                metadata:
                    safeMetadata,

                enabled:
                    safeMetadata.enabled,

                registeredAt:
                    previous
                        ?.registeredAt ||
                    now,

                updatedAt:
                    now,

                runs:
                    previous?.runs ||
                    0,

                failures:
                    previous?.failures ||
                    0,

                blockedRuns:
                    previous
                        ?.blockedRuns ||
                    0,

                lastRunAt:
                    previous
                        ?.lastRunAt ||
                    null,

                lastResult:
                    previous
                        ?.lastResult ||
                    null

            }
        );


        this.emit(
            "brain:skill:registered",
            {
                skill:
                    skillName,

                metadata:
                    safeMetadata,

                overwrite,

                time:
                    now
            }
        );


        return true;

    },


    /* =====================================================
       UNREGISTER
    ===================================================== */

    unregister(
        name,
        options = {}
    ){

        const skillName =
            this.normalizeName(
                name
            );


        if(!skillName){

            return false;

        }


        const skill =
            this.skills.get(
                skillName
            );


        if(!skill){

            return false;

        }


        if(
            skill.metadata
                ?.internal ===
                true &&
            options.force !==
                true
        ){

            return false;

        }


        const removed =
            this.skills.delete(
                skillName
            );


        if(removed){

            this.emit(
                "brain:skill:unregistered",
                {
                    skill:
                        skillName,

                    time:
                        Date.now()
                }
            );

        }


        return removed;

    },


    /* =====================================================
       LOOKUP
    ===================================================== */

    has(name){

        const skillName =
            this.normalizeName(
                name
            );


        return (
            Boolean(
                skillName
            ) &&
            this.skills.has(
                skillName
            )
        );

    },


    get(name){

        const skillName =
            this.normalizeName(
                name
            );


        if(!skillName){

            return null;

        }


        return (
            this.skills.get(
                skillName
            ) ||
            null
        );

    },


    describe(name){

        const skill =
            this.get(
                name
            );


        if(!skill){

            return null;

        }


        return {

            name:
                skill.name,

            metadata:
                this.clone(
                    skill.metadata
                ),

            enabled:
                skill.enabled,

            registeredAt:
                skill.registeredAt,

            updatedAt:
                skill.updatedAt,

            runs:
                skill.runs,

            failures:
                skill.failures,

            blockedRuns:
                skill.blockedRuns,

            lastRunAt:
                skill.lastRunAt

        };

    },


    all(options = {}){

        let skills =
            [
                ...this.skills.values()
            ];


        if(
            options.enabled ===
                true
        ){

            skills =
                skills.filter(
                    skill =>
                        skill.enabled ===
                            true
                );

        }


        if(
            options.enabled ===
                false
        ){

            skills =
                skills.filter(
                    skill =>
                        skill.enabled !==
                            true
                );

        }


        if(options.mode){

            const mode =
                this.normalizeMode(
                    options.mode
                );


            skills =
                skills.filter(
                    skill =>
                        skill.metadata
                            ?.mode ===
                        mode
                );

        }


        if(options.sourceAppId){

            const sourceAppId =
                this.normalizeName(
                    options.sourceAppId
                );


            skills =
                skills.filter(
                    skill =>
                        skill.metadata
                            ?.sourceAppId ===
                        sourceAppId
                );

        }


        if(options.tag){

            const tag =
                this.normalizeName(
                    options.tag
                );


            skills =
                skills.filter(
                    skill =>
                        Array.isArray(
                            skill.metadata
                                ?.tags
                        ) &&
                        skill.metadata.tags
                            .includes(
                                tag
                            )
                );

        }


        return skills
            .sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.name
                    ).localeCompare(
                        String(
                            b.name
                        )
                    )
            )
            .map(
                skill => ({

                    name:
                        skill.name,

                    metadata:
                        this.clone(
                            skill.metadata
                        ),

                    enabled:
                        skill.enabled,

                    registeredAt:
                        skill.registeredAt,

                    updatedAt:
                        skill.updatedAt,

                    runs:
                        skill.runs,

                    failures:
                        skill.failures,

                    blockedRuns:
                        skill.blockedRuns,

                    lastRunAt:
                        skill.lastRunAt,

                    lastResult:
                        this.clone(
                            skill.lastResult
                        )

                })
            );

    },


    /* =====================================================
       ENABLE / DISABLE
    ===================================================== */

    setEnabled(
        name,
        enabled = true
    ){

        const skill =
            this.get(
                name
            );


        if(!skill){

            return false;

        }


        const next =
            Boolean(
                enabled
            );


        if(
            skill.enabled ===
                next
        ){

            return true;

        }


        skill.enabled =
            next;


        skill.updatedAt =
            Date.now();


        this.emit(
            "brain:skill:state",
            {
                skill:
                    skill.name,

                enabled:
                    skill.enabled,

                time:
                    skill.updatedAt
            }
        );


        return true;

    },


    /* =====================================================
       APPLICATION ORGAN
    ===================================================== */

    getSourceOrgan(skill){

        const sourceAppId =
            skill?.metadata
                ?.sourceAppId ||
            null;


        if(!sourceAppId){

            return null;

        }


        const organSystem =
            this.getService(
                "organSystem"
            );


        if(!organSystem){

            return null;

        }


        try{

            if(
                typeof organSystem.get ===
                    "function"
            ){

                const organ =
                    organSystem.get(
                        sourceAppId
                    );


                if(organ){

                    return organ;

                }

            }


            if(
                typeof organSystem.findBySlug ===
                    "function"
            ){

                const organ =
                    organSystem.findBySlug(
                        sourceAppId
                    );


                if(organ){

                    return organ;

                }

            }

        } catch(error){

            return null;

        }


        return null;

    },


    /* =====================================================
       APPLICATION MANIFEST
    ===================================================== */

    getSourceManifest(skill){

        const sourceAppId =
            skill?.metadata
                ?.sourceAppId ||
            null;


        if(!sourceAppId){

            return null;

        }


        const registry =
            this.getService(
                "appRegistry"
            ) ||
            this.getService(
                "applicationRegistry"
            );


        if(!registry){

            return null;

        }


        const methods = [
            "find",
            "get"
        ];


        for(
            const method of methods
        ){

            if(
                typeof registry[
                    method
                ] !==
                    "function"
            ){

                continue;

            }


            try{

                const manifest =
                    registry[
                        method
                    ](
                        sourceAppId
                    );


                if(manifest){

                    return manifest;

                }

            } catch(error){

                /* next resolver */

            }

        }


        return null;

    },


    /* =====================================================
       APPLICATION AUTHORITY
    ===================================================== */

    validateSourceAuthority(skill){

        const metadata =
            skill?.metadata ||
            {};


        if(
            metadata.internal ===
                true
        ){

            return {
                allowed:
                    true,

                reason:
                    null,

                organ:
                    null,

                manifest:
                    null,

                source:
                    "internal"
            };

        }


        if(
            !metadata.sourceAppId
        ){

            if(
                metadata.mode ===
                    "action"
            ){

                return {
                    allowed:
                        false,

                    reason:
                        "Action skill sourceAppId olmadan çalıştırılamaz.",

                    organ:
                        null,

                    manifest:
                        null
                };

            }


            return {
                allowed:
                    true,

                reason:
                    null,

                organ:
                    null,

                manifest:
                    null,

                source:
                    "unbound-read"
            };

        }


        const manifest =
            this.getSourceManifest(
                skill
            );


        const builtIn =
            manifest?.system ===
                true ||
            manifest?.distribution ===
                "built-in" ||
            manifest?.builtIn ===
                true;


        if(builtIn){

            return {
                allowed:
                    true,

                reason:
                    null,

                organ:
                    this.getSourceOrgan(
                        skill
                    ),

                manifest,

                source:
                    "built-in"
            };

        }


        const organ =
            this.getSourceOrgan(
                skill
            );


        if(!organ){

            return {
                allowed:
                    false,

                reason:
                    "Skill kaynağı olan application kurulu değil.",

                organ:
                    null,

                manifest,

                source:
                    "application"
            };

        }


        /*
         * OrganSystem status is authoritative.
         * Older organs may also expose installed:true.
         */

        const installed =
            organ.installed ===
                true ||
            [
                "active",
                "inactive",
                "paused",
                "disabled",
                "error"
            ].includes(
                String(
                    organ.status ||
                        ""
                )
                    .trim()
                    .toLowerCase()
            );


        if(!installed){

            return {
                allowed:
                    false,

                reason:
                    "Skill kaynağı olan application aktif kurulumda değil.",

                organ,

                manifest,

                source:
                    "application"
            };

        }


        if(
            organ.trusted !==
                true
        ){

            return {
                allowed:
                    false,

                reason:
                    "Skill kaynağı olan application trusted değil.",

                organ,

                manifest,

                source:
                    "application"
            };

        }


        return {
            allowed:
                true,

            reason:
                null,

            organ,

            manifest,

            source:
                "application"
        };

    },


    /* =====================================================
       PERMISSION / CAPABILITY CHECK
    ===================================================== */

    validateRequirements(
        skill,
        authority
    ){

        const metadata =
            skill?.metadata ||
            {};


        const permissions =
            metadata
                .requiredPermissions ||
            [];


        const capabilities =
            metadata
                .requiredCapabilities ||
            [];


        if(
            metadata.internal ===
                true
        ){

            return {
                allowed:
                    true,

                reason:
                    null,

                missingPermissions:
                    [],

                missingCapabilities:
                    []
            };

        }


        const organ =
            authority?.organ ||
            null;


        const manifest =
            authority?.manifest ||
            null;


        const missingPermissions =
            [];


        permissions.forEach(
            permission => {

                let available =
                    false;


                if(organ){

                    try{

                        if(
                            typeof organ.hasPermission ===
                                "function"
                        ){

                            available =
                                organ.hasPermission(
                                    permission
                                ) ===
                                true;

                        }

                    } catch(error){

                        available =
                            false;

                    }


                    if(
                        !available &&
                        Array.isArray(
                            organ.permissions
                        )
                    ){

                        available =
                            organ.permissions
                                .map(
                                    item =>
                                        String(
                                            item
                                        )
                                            .trim()
                                            .toLowerCase()
                                )
                                .includes(
                                    permission
                                );

                    }

                }

             if(!available){

                    missingPermissions.push(
                        permission
                    );

                }

            }
        );


        if(
            missingPermissions.length >
                0
        ){

            return {
                allowed:
                    false,

                reason:
                    `Skill için gerekli permission eksik: ${missingPermissions.join(", ")}`,

                missingPermissions,

                missingCapabilities:
                    []
            };

        }


        const source =
            organ ||
            manifest ||
            null;


        const missingCapabilities =
            [];


        capabilities.forEach(
            capability => {

                let available =
                    false;


                if(source){

                    try{

                        if(
                            typeof source.hasCapability ===
                                "function"
                        ){

                            available =
                                source.hasCapability(
                                    capability
                                ) ===
                                true;

                        }

                    } catch(error){

                        available =
                            false;

                    }


                    if(
                        !available &&
                        Array.isArray(
                            source.capabilities
                        )
                    ){

                        available =
                            source.capabilities
                                .map(
                                    item =>
                                        String(
                                            item
                                        )
                                            .trim()
                                            .toLowerCase()
                                )
                                .includes(
                                    capability
                                );

                    }

                }


                if(!available){

                    missingCapabilities.push(
                        capability
                    );

                }

            }
        );


        if(
            missingCapabilities.length >
                0
        ){

            return {
                allowed:
                    false,

                reason:
                    `Skill için gerekli capability eksik: ${missingCapabilities.join(", ")}`,

                missingPermissions:
                    [],

                missingCapabilities
            };

        }


        return {
            allowed:
                true,

            reason:
                null,

            missingPermissions:
                [],

            missingCapabilities:
                []
        };

    },


    /* =====================================================
       POLICY CHECK
    ===================================================== */

    validatePolicy(
        skill,
        context = {}
    ){

        const metadata =
            skill?.metadata ||
            {};


        if(
            metadata.mode !==
                "action"
        ){

            return {
                allowed:
                    true,

                evaluation:
                    null,

                reason:
                    null
            };

        }


        if(
            !metadata.actionType
        ){

            return {
                allowed:
                    false,

                evaluation:
                    null,

                reason:
                    "Action skill actionType taşımıyor."
            };

        }


        const policy =
            this.getService(
                "brainActionPolicy"
            ) ||
            (
                typeof window !==
                    "undefined"
                    ? window.BrainActionPolicy
                    : null
            );


        if(
            !policy ||
            typeof policy.evaluate !==
                "function"
        ){

            return {
                allowed:
                    false,

                evaluation:
                    null,

                reason:
                    "Brain Action Policy bulunamadı."
            };

        }


        let evaluation =
            null;


        try{

            evaluation =
                policy.evaluate({
                    type:
                        metadata.actionType,

                    skill:
                        skill.name,

                    context
                });

        } catch(error){

            return {
                allowed:
                    false,

                evaluation:
                    null,

                reason:
                    "Skill policy değerlendirilemedi."
            };

        }


        if(
            !evaluation ||
            evaluation.allowed !==
                true ||
            evaluation.blocked ===
                true
        ){

            return {
                allowed:
                    false,

                evaluation,

                reason:
                    evaluation?.reason ||
                    "Skill action policy tarafından engellendi."
            };

        }


        if(
            evaluation.requiresConfirmation ===
                true
        ){

            /*
             * BrainSkills does not create confirmation.
             * It only accepts a context that Brain Core
             * has already marked as a bound confirmation.
             */

            if(
                context.confirmed !==
                    true
            ){

                return {
                    allowed:
                        false,

                    evaluation,

                    reason:
                        "Skill kullanıcı onayı gerektiriyor."
                };

            }


            if(
                context.confirmationMode !==
                    "bound-confirmation"
            ){

                return {
                    allowed:
                        false,

                    evaluation,

                    reason:
                        "Skill için bağlı confirmation doğrulanamadı."
                };

            }

        }


        return {
            allowed:
                true,

            evaluation,

            reason:
                null
        };

    },


    /* =====================================================
       AUTHORIZATION
    ===================================================== */

    authorize(
        skill,
        context = {}
    ){

        const authority =
            this.validateSourceAuthority(
                skill
            );


        if(
            authority.allowed !==
                true
        ){

            return {
                allowed:
                    false,

                reason:
                    authority.reason,

                authority,

                requirements:
                    null,

                policy:
                    null
            };

        }


        const requirements =
            this.validateRequirements(
                skill,
                authority
            );


        if(
            requirements.allowed !==
                true
        ){

            return {
                allowed:
                    false,

                reason:
                    requirements.reason,

                authority,

                requirements,

                policy:
                    null
            };

        }


        const policy =
            this.validatePolicy(
                skill,
                context
            );


        if(
            policy.allowed !==
                true
        ){

            return {
                allowed:
                    false,

                reason:
                    policy.reason,

                authority,

                requirements,

                policy
            };

        }


        return {
            allowed:
                true,

            reason:
                null,

            authority,

            requirements,

            policy
        };

    },


    /* =====================================================
       RESULT NORMALIZATION
    ===================================================== */

    normalizeResult(
        name,
        result
    ){

        if(
            result &&
            typeof result ===
                "object" &&
            !Array.isArray(
                result
            )
        ){

            return {
                skill:
                    name,

                success:
                    result.success !==
                        false,

                ...result
            };

        }


        if(
            typeof result ===
                "boolean"
        ){

            return {
                success:
                    result,

                skill:
                    name,

                message:
                    result
                        ? "Skill tamamlandı."
                        : "Skill başarısız oldu."
            };

        }


        if(
            typeof result ===
                "string"
        ){

            return {
                success:
                    true,

                skill:
                    name,

                message:
                    result
            };

        }


        return {
            success:
                true,

            skill:
                name,

            data:
                result ??
                null
        };

    },


    /* =====================================================
       EXECUTION HISTORY
    ===================================================== */

    createExecutionId(){

        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){

                return crypto.randomUUID();

            }

        } catch(error){

            /* fallback */

        }


        return `skill_exec_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,8)}`;

    },


    recordExecution(entry){

        const normalized = {

            id:
                entry?.id ||
                this.createExecutionId(),

            skill:
                entry?.skill ||
                null,

            success:
                entry?.success ===
                    true,

            blocked:
                entry?.blocked ===
                    true,

            reason:
                entry?.reason ||
                null,

            errorCode:
                entry?.errorCode ||
                null,

            startedAt:
                Number(
                    entry?.startedAt
                ) ||
                Date.now(),

            completedAt:
                Number(
                    entry?.completedAt
                ) ||
                Date.now(),

            duration:
                Math.max(
                    0,
                    Number(
                        entry?.duration
                    ) ||
                    0
                )

        };


        this.executionHistory.push(
            normalized
        );


        if(
            this.executionHistory.length >
                this.historyLimit
        ){

            this.executionHistory =
                this.executionHistory.slice(
                    -this.historyLimit
                );

        }


        return normalized;

    },


    /* =====================================================
       TIMEOUT
    ===================================================== */

    async runWithTimeout(
        handler,
        payload,
        context,
        timeout
    ){

        let timer =
            null;


        const timerAPI =
            typeof globalThis !==
                "undefined"
                ? globalThis
                : null;


        if(
            !timerAPI ||
            typeof timerAPI.setTimeout !==
                "function"
        ){

            return await Promise.resolve(
                handler(
                    payload,
                    context
                )
            );

        }


        try{

            const skillPromise =
                Promise.resolve(
                    handler(
                        payload,
                        context
                    )
                );


            const timeoutPromise =
                new Promise(
                    (
                        resolve,
                        reject
                    ) => {

                        timer =
                            timerAPI.setTimeout(
                                () => {

                                    reject(
                                        new Error(
                                            "skill-timeout"
                                        )
                                    );

                                },
                                this.normalizeTimeout(
                                    timeout
                                )
                            );

                    }
                );


            return await Promise.race([
                skillPromise,
                timeoutPromise
            ]);

        } finally {

            if(
                timer !==
                    null &&
                typeof timerAPI.clearTimeout ===
                    "function"
            ){

                timerAPI.clearTimeout(
                    timer
                );

            }

        }

    },


    /* =====================================================
       RUN
    ===================================================== */

    async run(
        name,
        payload = {},
        context = {}
    ){

        const skillName =
            this.normalizeName(
                name
            );


        const skill =
            this.get(
                skillName
            );


        if(!skill){

            return {
                success:
                    false,

                skill:
                    skillName ||
                    null,

                executed:
                    false,

                error:
                    "skill-not-found",

                message:
                    "Skill bulunamadı."
            };

        }


        if(
            skill.enabled !==
                true
        ){

            return {
                success:
                    false,

                skill:
                    skillName,

                executed:
                    false,

                error:
                    "skill-disabled",

                message:
                    "Skill devre dışı."
            };

        }


        const safePayload =
            payload &&
            typeof payload ===
                "object" &&
            !Array.isArray(
                payload
            )
                ? (
                    this.sanitizeInput(
                        payload
                    ) ||
                    {}
                )
                : {
                    value:
                        this.sanitizeInput(
                            payload
                        )
                };


        const safeContext =
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
            )
                ? (
                    this.sanitizeInput(
                        context
                    ) ||
                    {}
                )
                : {};


        const authorization =
            this.authorize(
                skill,
                safeContext
            );


        if(
            authorization.allowed !==
                true
        ){

            skill.blockedRuns +=
                1;


            const time =
                Date.now();


            const blockedResult = {

                success:
                    false,

                executed:
                    false,

                blocked:
                    true,

                skill:
                    skillName,

                error:
                    "skill-not-authorized",

                reason:
                    authorization.reason,

                message:
                    authorization.reason ||
                    "Skill çalıştırma yetkisi verilmedi.",

                actionType:
                    skill.metadata
                        ?.actionType ||
                    null,

                sourceAppId:
                    skill.metadata
                        ?.sourceAppId ||
                    null,

                time

            };


            skill.lastResult =
                this.clone(
                    blockedResult
                );


            this.recordExecution({
                skill:
                    skillName,

                success:
                    false,

                blocked:
                    true,

                reason:
                    authorization.reason,

                startedAt:
                    time,

                completedAt:
                    time,

                duration:
                    0
            });


            this.emit(
                "brain:skill:blocked",
                {
                    skill:
                        skillName,

                    reason:
                        authorization.reason,

                    actionType:
                        skill.metadata
                            ?.actionType ||
                        null,

                    sourceAppId:
                        skill.metadata
                            ?.sourceAppId ||
                        null,

                    time
                }
            );


            return blockedResult;

        }


        const startedAt =
            Date.now();


        skill.runs +=
            1;


        skill.lastRunAt =
            startedAt;


        this.emit(
            "brain:skill:started",
            {
                skill:
                    skillName,

                mode:
                    skill.metadata
                        ?.mode ||
                    "read",

                actionType:
                    skill.metadata
                        ?.actionType ||
                    null,

                sourceAppId:
                    skill.metadata
                        ?.sourceAppId ||
                    null,

                startedAt
            }
        );


        try{

            const rawResult =
                await this.runWithTimeout(
                    skill.handler,
                    safePayload,
                    safeContext,
                    skill.metadata
                        ?.timeout ||
                    this.defaultTimeout
                );


            const result =
                this.normalizeResult(
                    skillName,
                    rawResult
                );


            const completedAt =
                Date.now();


            const finalResult = {

                ...result,

                executed:
                    result.executed !==
                        undefined
                        ? result.executed ===
                            true
                        : result.success !==
                            false,

                actionType:
                    skill.metadata
                        ?.actionType ||
                    null,

                sourceAppId:
                    skill.metadata
                        ?.sourceAppId ||
                    null,

                startedAt,

                completedAt,

                duration:
                    Math.max(
                        0,
                        completedAt -
                        startedAt
                    )

            };


            skill.lastResult =
                this.clone(
                    finalResult
                );


            if(
                finalResult.success ===
                    false
            ){

                skill.failures +=
                    1;

            }


            this.recordExecution({
                skill:
                    skillName,

                success:
                    finalResult.success ===
                        true,

                blocked:
                    false,

                startedAt,

                completedAt,

                duration:
                    finalResult.duration
            });


            this.emit(
                "brain:skill:completed",
                {
                    skill:
                        skillName,

                    success:
                        finalResult.success ===
                            true,

                    executed:
                        finalResult.executed ===
                            true,

                    duration:
                        finalResult.duration,

                    time:
                        completedAt
                }
            );


            return finalResult;

        } catch(error){

            skill.failures +=
                1;


            const completedAt =
                Date.now();


            const errorCode =
                error?.message ===
                    "skill-timeout"
                    ? "skill-timeout"
                    : "skill-execution-error";


            const result = {

                success:
                    false,

                executed:
                    false,

                skill:
                    skillName,

                error:
                    true,

                errorCode,

                message:
                    errorCode ===
                        "skill-timeout"
                        ? "Skill zaman aşımına uğradı."
                        : (
                            error?.message ||
                            "Skill çalıştırılırken hata oluştu."
                        ),

                actionType:
                    skill.metadata
                        ?.actionType ||
                    null,

                sourceAppId:
                    skill.metadata
                        ?.sourceAppId ||
                    null,

                startedAt,

                completedAt,

                duration:
                    Math.max(
                        0,
                        completedAt -
                        startedAt
                    )

            };


            skill.lastResult =
                this.clone(
                    result
                );


            this.recordExecution({
                skill:
                    skillName,

                success:
                    false,

                blocked:
                    false,

                errorCode,

                startedAt,

                completedAt,

                duration:
                    result.duration
            });


            this.emit(
                "brain:skill:error",
                {
                    skill:
                        skillName,

                    errorCode,

                    message:
                        result.message,

                    duration:
                        result.duration,

                    time:
                        completedAt
                }
            );


            console.error(
                `Brain skill error: ${skillName}`,
                error
            );


            return result;

        }

    },


    /* =====================================================
       HISTORY
    ===================================================== */

    history(limit = 10){

        const numeric =
            Number(
                limit
            );


        const safeLimit =
            Math.max(
                1,
                Math.min(
                    this.historyLimit,
                    Number.isFinite(
                        numeric
                    )
                        ? Math.floor(
                            numeric
                        )
                        : 10
                )
            );


        return (
            this.clone(
                this.executionHistory.slice(
                    -safeLimit
                )
            ) ||
            []
        );

    },


    /* =====================================================
       STATUS
    ===================================================== */

    status(){

        const skills =
            this.all();


        return {
            version:
                this.version,

            total:
                skills.length,

            enabled:
                skills.filter(
                    skill =>
                        skill.enabled ===
                            true
                ).length,

            disabled:
                skills.filter(
                    skill =>
                        skill.enabled !==
                            true
                ).length,

            readSkills:
                skills.filter(
                    skill =>
                        skill.metadata
                            ?.mode ===
                        "read"
                ).length,

            actionSkills:
                skills.filter(
                    skill =>
                        skill.metadata
                            ?.mode ===
                        "action"
                ).length,

            executions:
                this.executionHistory
                    .length,

            failures:
                skills.reduce(
                    (
                        total,
                        skill
                    ) =>
                        total +
                        (
                            Number(
                                skill.failures
                            ) ||
                            0
                        ),
                    0
                ),

            blockedRuns:
                skills.reduce(
                    (
                        total,
                        skill
                    ) =>
                        total +
                        (
                            Number(
                                skill.blockedRuns
                            ) ||
                            0
                        ),
                    0
                ),

            skills

        };

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const status =
            this.status();


        return {
            version:
                this.version,

            total:
                status.total,

            enabled:
                status.enabled,

            disabled:
                status.disabled,

            readSkills:
                status.readSkills,

            actionSkills:
                status.actionSkills,

            executions:
                status.executions,

            failures:
                status.failures,

            blockedRuns:
                status.blockedRuns,

            policyAvailable:
                Boolean(
                    this.getService(
                        "brainActionPolicy"
                    )
                ),

            appRegistryAvailable:
                Boolean(
                    this.getService(
                        "appRegistry"
                    ) ||
                    this.getService(
                        "applicationRegistry"
                    )
                ),

            organSystemAvailable:
                Boolean(
                    this.getService(
                        "organSystem"
                    )
                )

        };

    },


    /* =====================================================
       RESET RUNTIME
    ===================================================== */

    resetRuntime(){

        this.executionHistory =
            [];


        this.skills.forEach(
            skill => {

                skill.runs =
                    0;


                skill.failures =
                    0;


                skill.blockedRuns =
                    0;


                skill.lastRunAt =
                    null;


                skill.lastResult =
                    null;

            }
        );


        this.emit(
            "brain:skills:runtime-reset",
            {
                time:
                    Date.now()
            }
        );


        return true;

    }

};


/* =========================================================
   REGISTER
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        VAERO.register(
            "brainSkills",
            BrainSkills
        );

    }

} catch(error){

    console.error(
        "BrainSkills register edilemedi:",
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

    window.BrainSkills =
        BrainSkills;

}
