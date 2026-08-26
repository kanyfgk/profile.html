/* =========================================================
   VAERO BRAIN SKILLS
   Policy-Aware Skill Registry / Execution Layer
========================================================= */

const BrainSkills = {

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


    /* =====================================================
       SERVICE ACCESS
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
            ){
                return null;
            }


            return (
                VAERO.get(name) ||
                null
            );

        } catch(error){

            console.warn(
                `Brain Skills servisi okunamadı: ${name}`,
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
            name ?? ""
        )
            .trim()
            .toLowerCase();

    },


    normalizeText(
        value,
        fallback = ""
    ){

        return String(
            value ??
            fallback
        ).trim();

    },


    normalizeArray(value){

        if(
            !Array.isArray(
                value
            )
        ){
            return [];
        }


        return [
            ...new Set(
                value
                    .map(
                        item =>
                            String(
                                item ??
                                ""
                            )
                                .trim()
                                .toLowerCase()
                    )
                    .filter(Boolean)
            )
        ];

    },


    normalizeMode(mode){

        const value =
            String(
                mode ||
                "read"
            )
                .trim()
                .toLowerCase();


        return (
            [
                "read",
                "action"
            ].includes(
                value
            )
                ? value
                : "read"
        );

    },


    normalizeMetadata(
        metadata = {}
    ){

        const safe =
            metadata &&
            typeof metadata === "object" &&
            !Array.isArray(
                metadata
            )
                ? metadata
                : {};


        const mode =
            this.normalizeMode(
                safe.mode
            );


        const timeout =
            Math.max(
                1000,
                Math.min(
                    this.maxTimeout,
                    Number(
                        safe.timeout
                    ) ||
                    this.defaultTimeout
                )
            );


        return {

            title:
                this.normalizeText(
                    safe.title
                ),

            description:
                this.normalizeText(
                    safe.description
                ),

            version:
                this.normalizeText(
                    safe.version,
                    "1.0.0"
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

            timeout,

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
            value === null ||
            value === undefined
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
            value === null ||
            value === undefined
        ){
            return value;
        }


        if(
            depth > 4
        ){
            return "[depth-limit]";
        }


        if(
            typeof value === "string"
        ){

            return value.slice(
                0,
                8000
            );

        }


        if(
            typeof value === "number" ||
            typeof value === "boolean"
        ){

            return value;

        }


        if(
            typeof value === "function"
        ){
            return undefined;
        }


        if(
            Array.isArray(
                value
            )
        ){

            return value
                .slice(
                    0,
                    100
                )
                .map(
                    item =>
                        this.sanitizeInput(
                            item,
                            depth + 1,
                            seen
                        )
                );

        }


        if(
            typeof value === "object"
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
                    "token",
                    "accesstoken",
                    "refreshtoken",
                    "authorization",
                    "apikey",
                    "api_key",
                    "privatekey",
                    "private_key",
                    "cardnumber",
                    "cvv"
                ]);


            const result = {};


            Object.entries(
                value
            )
                .slice(
                    0,
                    120
                )
                .forEach(
                    ([key,item]) => {

                        const normalizedKey =
                            String(
                                key
                            )
                                .trim()
                                .toLowerCase();


                        if(
                            blockedKeys.has(
                                normalizedKey
                            )
                        ){

                            result[key] =
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

                            result[key] =
                                sanitized;

                        }

                    }
                );


            return result;

        }


        return String(
            value
        );

    },


    /* =====================================================
       EVENTS
    ===================================================== */

    emit(
        eventName,
        payload = {}
    ){

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    eventName,
                    payload
                );


                return true;

            }


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
                    eventName,
                    payload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `BrainSkills event gönderilemedi: ${eventName}`,
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


        /*
         * Action-mode skill açık bir actionType
         * olmadan kaydedilmez.
         */

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

    unregister(name){

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


        /*
         * Internal skill normal runtime sırasında
         * sökülemez.
         */

        if(
            skill.metadata
                ?.internal ===
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


        return this.skills.has(
            skillName
        );

    },


    get(name){

        const skillName =
            this.normalizeName(
                name
            );


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
                        skill.enabled
                );

        }


        if(
            options.mode
        ){

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


        if(
            options.sourceAppId
        ){

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


        return skills.map(
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


        skill.enabled =
            Boolean(
                enabled
            );


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

            return (
                organSystem.get?.(
                    sourceAppId
                ) ||
                organSystem
                    .findBySlug?.(
                        sourceAppId
                    ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       APPLICATION AUTHORITY
    ===================================================== */

    validateSourceAuthority(skill){

        const metadata =
            skill?.metadata ||
            {};


        /*
         * VAERO internal skill app organına
         * bağımlı değildir.
         */

        if(
            metadata.internal ===
                true
        ){

            return {
                allowed:true,
                reason:null,
                organ:null
            };

        }


        if(
            !metadata.sourceAppId
        ){

            /*
             * Kaynaksız read skill kullanılabilir.
             * Kaynaksız action skill kullanılmaz.
             */

            if(
                metadata.mode ===
                    "action"
            ){

                return {
                    allowed:false,
                    reason:
                        "Action skill sourceAppId olmadan çalıştırılamaz.",
                    organ:null
                };

            }


            return {
                allowed:true,
                reason:null,
                organ:null
            };

        }


        const registry =
            this.getService(
                "appRegistry"
            );


        let manifest =
            null;


        try{

            manifest =
                registry?.find?.(
                    metadata.sourceAppId
                ) ||
                registry?.get?.(
                    metadata.sourceAppId
                ) ||
                null;

        } catch(error){

            manifest =
                null;

        }


        /*
         * Built-in app doğrudan sistem kaynağıdır.
         */

        if(
            manifest?.system ===
                true ||
            manifest?.distribution ===
                "built-in"
        ){

            return {
                allowed:true,
                reason:null,
                organ:null,
                manifest
            };

        }


        const organ =
            this.getSourceOrgan(
                skill
            );


        if(!organ){

            return {
                allowed:false,
                reason:
                    "Skill kaynağı olan application kurulu değil.",
                organ:null,
                manifest
            };

        }


        if(
            organ.installed !==
                true
        ){

            return {
                allowed:false,
                reason:
                    "Skill kaynağı olan application aktif kurulumda değil.",
                organ,
                manifest
            };

        }


        if(
            organ.trusted !==
                true
        ){

            return {
                allowed:false,
                reason:
                    "Skill kaynağı olan application trusted değil.",
                organ,
                manifest
            };

        }


        return {
            allowed:true,
            reason:null,
            organ,
            manifest
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


        /*
         * Internal skill için gereksinimler skill'in kendi
         * metadata sözleşmesidir. App permission kontrolü
         * uygulanmaz.
         */

        if(
            metadata.internal ===
                true
        ){

            return {
                allowed:true,
                reason:null
            };

        }


        const organ =
            authority?.organ ||
            null;


        if(
            permissions.length > 0
        ){

            if(!organ){

                return {
                    allowed:false,
                    reason:
                        "Skill permission kontrolü için runtime organ bulunamadı."
                };

            }


            const missingPermission =
                permissions.find(
                    permission => {

                        try{

                            if(
                                typeof organ
                                    .hasPermission ===
                                    "function"
                            ){

                                return (
                                    organ.hasPermission(
                                        permission
                                    ) !== true
                                );

                            }

                        } catch(error){

                            return true;

                        }


                        return !(
                            Array.isArray(
                                organ.permissions
                            ) &&
                            organ.permissions
                                .includes(
                                    permission
                                )
                        );

                    }
                );


            if(missingPermission){

                return {
                    allowed:false,
                    reason:
                        `Skill için gerekli permission eksik: ${missingPermission}`
                };

            }

        }


        if(
            capabilities.length > 0
        ){

            const source =
                organ ||
                authority?.manifest ||
                null;


            if(!source){

                return {
                    allowed:false,
                    reason:
                        "Skill capability kaynağı bulunamadı."
                };

            }


            const missingCapability =
                capabilities.find(
                    capability => {

                        try{

                            if(
                                typeof source
                                    .hasCapability ===
                                    "function"
                            ){

                                return (
                                    source.hasCapability(
                                        capability
                                    ) !== true
                                );

                            }

                        } catch(error){

                            return true;

                        }


                        return !(
                            Array.isArray(
                                source.capabilities
                            ) &&
                            source.capabilities
                                .includes(
                                    capability
                                )
                        );

                    }
                );


            if(missingCapability){

                return {
                    allowed:false,
                    reason:
                        `Skill için gerekli capability eksik: ${missingCapability}`
                };

            }

        }


        return {
            allowed:true,
            reason:null
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
                allowed:true,
                evaluation:null,
                reason:null
            };

        }


        if(
            !metadata.actionType
        ){

            return {
                allowed:false,
                evaluation:null,
                reason:
                    "Action skill actionType taşımıyor."
            };

        }


        const policy =
            this.getService(
                "brainActionPolicy"
            ) ||
            window.BrainActionPolicy ||
            null;


        if(
            !policy ||
            typeof policy.evaluate !==
                "function"
        ){

            return {
                allowed:false,
                evaluation:null,
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
                allowed:false,
                evaluation:null,
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
                allowed:false,
                evaluation,
                reason:
                    "Skill action policy tarafından engellendi."
            };

        }


        if(
            evaluation.requiresConfirmation ===
                true
        ){

            if(
                context.confirmed !==
                    true
            ){

                return {
                    allowed:false,
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
                    allowed:false,
                    evaluation,
                    reason:
                        "Skill için bağlı confirmation doğrulanamadı."
                };

            }

        }


        return {
            allowed:true,
            evaluation,
            reason:null
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
                allowed:false,
                reason:
                    authority.reason,
                authority,
                requirements:null,
                policy:null
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
                allowed:false,
                reason:
                    requirements.reason,
                authority,
                requirements,
                policy:null
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
                allowed:false,
                reason:
                    policy.reason,
                authority,
                requirements,
                policy
            };

        }


        return {
            allowed:true,
            reason:null,
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
            typeof result === "object" &&
            !Array.isArray(
                result
            )
        ){

            return {

                success:
                    result.success !==
                        false,

                skill:
                    name,

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

                success:true,

                skill:
                    name,

                message:
                    result

            };

        }


        return {

            success:true,

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

    recordExecution(entry){

        this.executionHistory.push(
            entry
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


        return true;

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
                            window.setTimeout(
                                () => {

                                    reject(
                                        new Error(
                                            "skill-timeout"
                                        )
                                    );

                                },
                                timeout
                            );

                    }
                );


            return await Promise.race([
                skillPromise,
                timeoutPromise
            ]);

        } finally {

            if(timer){

                window.clearTimeout(
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

                success:false,

                skill:
                    skillName ||
                    null,

                executed:false,

                error:
                    "skill-not-found",

                message:
                    "Skill bulunamadı."

            };

        }


        if(!skill.enabled){

            return {

                success:false,

                skill:
                    skillName,

                executed:false,

                error:
                    "skill-disabled",

                message:
                    "Skill devre dışı."

            };

        }


        const safePayload =
            payload &&
            typeof payload === "object" &&
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
            typeof context === "object" &&
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


            const blockedResult = {

                success:false,

                executed:false,

                blocked:true,

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

                time:
                    Date.now()

            };


            skill.lastResult =
                blockedResult;


            this.recordExecution({

                skill:
                    skillName,

                success:false,

                blocked:true,

                reason:
                    authorization.reason,

                startedAt:
                    blockedResult.time,

                completedAt:
                    blockedResult.time,

                duration:0

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

                    time:
                        blockedResult.time

                }
            );


            return blockedResult;

        }


        const startedAt =
            Date.now();


        skill.runs += 1;


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
                    result.success !==
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
                    completedAt -
                    startedAt

            };


            skill.lastResult =
                finalResult;


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
                    finalResult.success,

                blocked:false,

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
                        finalResult.success,

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

                success:false,

                executed:false,

                skill:
                    skillName,

                error:true,

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
                    completedAt -
                    startedAt

            };


            skill.lastResult =
                result;


            this.recordExecution({

                skill:
                    skillName,

                success:false,

                blocked:false,

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

        const safeLimit =
            Math.max(
                1,
                Math.min(
                    this.historyLimit,
                    Number(limit) ||
                    10
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

            total:
                skills.length,

            enabled:
                skills.filter(
                    skill =>
                        skill.enabled
                ).length,

            disabled:
                skills.filter(
                    skill =>
                        !skill.enabled
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


        return true;

    }

};


VAERO.register(
    "brainSkills",
    BrainSkills
);


window.BrainSkills =
    BrainSkills;
