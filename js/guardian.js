/* =========================================================
   VAERO GUARDIAN
   Runtime Validation / Integrity Gate
========================================================= */

const Guardian = {

    rules:
        new Map(),

    violations:
        [],

    maxViolations:
        100,

    maxStringLength:
        10000,

    maxValidationDepth:
        8,


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeRuleName(name){

        return String(
            name ??
            ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );

    },


    normalizeScope(scope){

        const value =
            String(
                scope ??
                "global"
            )
                .trim()
                .toLowerCase();


        return (
            value ||
            "global"
        );

    },


    normalizeSeverity(
        severity
    ){

        const value =
            String(
                severity ??
                ""
            )
                .trim()
                .toLowerCase();


        if(
            [
                "low",
                "medium",
                "high",
                "critical"
            ].includes(
                value
            )
        ){

            return value;

        }


        return "high";

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

            /* fallback below */

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
       ID
    ===================================================== */

    createViolationId(){

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

            /* fallback below */

        }


        return `guardian_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       SAFE SERVICE ACCESS
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

            return null;

        }

    },


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
                `Guardian event gönderilemedi: ${name}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       RULE REGISTRY
    ===================================================== */

    addRule(
        name,
        validator,
        options = {}
    ){

        const id =
            this.normalizeRuleName(
                name
            );


        if(!id){

            console.warn(
                "Guardian rule adı geçersiz."
            );


            return false;

        }


        if(
            typeof validator !==
                "function"
        ){

            console.warn(
                `Guardian rule validator geçersiz: ${id}`
            );


            return false;

        }


        if(
            this.rules.has(
                id
            ) &&
            options.overwrite !==
                true
        ){

            console.warn(
                `Guardian rule zaten kayıtlı: ${id}`
            );


            return false;

        }


        const rule = {

            id,

            name:
                this.normalizeText(
                    name,
                    200
                ) ||
                id,

            validator,

            enabled:
                options.enabled !==
                    false,

            severity:
                this.normalizeSeverity(
                    options.severity
                ),

            scope:
                this.normalizeScope(
                    options.scope ||
                    "entity"
                ),

            description:
                options.description
                    ? this.normalizeText(
                        options.description,
                        1000
                    )
                    : null,

            registeredAt:
                Date.now()

        };


        this.rules.set(
            id,
            rule
        );


        this.emit(
            "guardian:rule:added",
            {
                id:
                    rule.id,

                scope:
                    rule.scope,

                severity:
                    rule.severity,

                time:
                    Date.now()
            }
        );


        return true;

    },


    removeRule(name){

        const id =
            this.normalizeRuleName(
                name
            );


        if(!id){

            return false;

        }


        const removed =
            this.rules.delete(
                id
            );


        if(removed){

            this.emit(
                "guardian:rule:removed",
                {
                    id,

                    time:
                        Date.now()
                }
            );

        }


        return removed;

    },


    hasRule(name){

        const id =
            this.normalizeRuleName(
                name
            );


        if(!id){

            return false;

        }


        return this.rules.has(
            id
        );

    },


    getRule(name){

        const id =
            this.normalizeRuleName(
                name
            );


        if(!id){

            return null;

        }


        return (
            this.rules.get(
                id
            ) ||
            null
        );

    },


    allRules(options = {}){

        let rules =
            [
                ...this.rules.values()
            ];


        if(options.scope){

            const scope =
                this.normalizeScope(
                    options.scope
                );


            rules =
                rules.filter(
                    rule =>
                        rule.scope ===
                            scope ||
                        rule.scope ===
                            "global"
                );

        }


        if(
            options.enabled ===
                true
        ){

            rules =
                rules.filter(
                    rule =>
                        rule.enabled ===
                            true
                );

        }


        if(
            options.enabled ===
                false
        ){

            rules =
                rules.filter(
                    rule =>
                        rule.enabled ===
                            false
                );

        }


        return [
            ...rules
        ];

    },


    setRuleEnabled(
        name,
        enabled = true
    ){

        const rule =
            this.getRule(
                name
            );


        if(!rule){

            return false;

        }


        rule.enabled =
            Boolean(
                enabled
            );


        this.emit(
            "guardian:rule:state",
            {
                id:
                    rule.id,

                enabled:
                    rule.enabled,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       BASIC SECURITY HELPERS
    ===================================================== */

    isPlainObject(value){

        if(
            !value ||
            typeof value !==
                "object" ||
            Array.isArray(
                value
            )
        ){

            return false;

        }


        const prototype =
            Object.getPrototypeOf(
                value
            );


        return (
            prototype ===
                Object.prototype ||
            prototype ===
                null
        );

    },


    isObjectLike(value){

        return Boolean(
            value &&
            typeof value ===
                "object" &&
            !Array.isArray(
                value
            )
        );

    },


    isSafeIdentifier(value){

        const text =
            String(
                value ??
                ""
            ).trim();


        if(
            !text ||
            text.length >
                200
        ){

            return false;

        }


        return /^[a-zA-Z0-9:_\-.]+$/.test(
            text
        );

    },


    hasDangerousObjectKeys(
        value,
        depth = 0,
        visited = new WeakSet()
    ){

        if(
            depth >
                this.maxValidationDepth ||
            value ===
                null ||
            value ===
                undefined
        ){

            return false;

        }


        if(
            typeof value !==
                "object"
        ){

            return false;

        }


        if(
            visited.has(
                value
            )
        ){

            return false;

        }


        visited.add(
            value
        );


        const dangerousKeys =
            new Set([
                "__proto__",
                "prototype",
                "constructor"
            ]);


        let keys = [];


        try{

            keys =
                Object.keys(
                    value
                );

        } catch(error){

            return true;

        }


        for(
            const key of keys
        ){

            if(
                dangerousKeys.has(
                    key
                )
            ){

                return true;

            }


            let child;


            try{

                child =
                    value[
                        key
                    ];

            } catch(error){

                return true;

            }


            if(
                child &&
                typeof child ===
                    "object" &&
                this.hasDangerousObjectKeys(
                    child,
                    depth + 1,
                    visited
                )
            ){

                return true;

            }

        }


        return false;

    },


    hasOversizedStrings(
        value,
        depth = 0,
        visited = new WeakSet()
    ){

        if(
            depth >
                this.maxValidationDepth
        ){

            return false;

        }


        if(
            typeof value ===
                "string"
        ){

            return (
                value.length >
                this.maxStringLength
            );

        }


        if(
            !value ||
            typeof value !==
                "object"
        ){

            return false;

        }


        if(
            visited.has(
                value
            )
        ){

            return false;

        }


        visited.add(
            value
        );


        let keys = [];


        try{

            keys =
                Object.keys(
                    value
                );

        } catch(error){

            return true;

        }


        for(
            const key of keys
        ){

            let child;


            try{

                child =
                    value[
                        key
                    ];

            } catch(error){

                return true;

            }


            if(
                this.hasOversizedStrings(
                    child,
                    depth + 1,
                    visited
                )
            ){

                return true;

            }

        }


        return false;

    },


    /* =====================================================
       VIOLATION LOG
    ===================================================== */

    recordViolation(
        rule,
        subject,
        reason = null,
        context = {}
    ){

        const violation = {

            id:
                this.createViolationId(),

            ruleId:
                rule?.id ||
                null,

            ruleName:
                rule?.name ||
                null,

            severity:
                this.normalizeSeverity(
                    rule?.severity
                ),

            scope:
                this.normalizeScope(
                    rule?.scope ||
                    context?.scope ||
                    "global"
                ),

            reason:
                this.normalizeText(
                    reason ||
                    "Validation failed.",
                    2000
                ) ||
                "Validation failed.",

            subjectId:
                this.normalizeText(
                    subject?.id ||
                    subject?.slug ||
                    "",
                    200
                ) ||
                null,

            operation:
                this.normalizeText(
                    context?.operation ||
                    "",
                    120
                ) ||
                null,

            context:
                this.clone(
                    context
                ),

            detectedAt:
                Date.now()

        };


        this.violations.push(
            violation
        );


        if(
            this.violations.length >
                this.maxViolations
        ){

            this.violations =
                this.violations.slice(
                    -this.maxViolations
                );

        }


        this.emit(
            "guardian:violation",
            violation
        );


        return violation;

    },


    /* =====================================================
       RULE SCOPE
    ===================================================== */

    shouldRunRule(
        rule,
        requestedScope
    ){

        if(
            !rule ||
            rule.enabled !==
                true
        ){

            return false;

        }


        const scope =
            this.normalizeScope(
                requestedScope
            );


        return (
            rule.scope ===
                "global" ||
            rule.scope ===
                scope
        );

    },


    /* =====================================================
       DETAILED VALIDATION
    ===================================================== */

    validateDetailed(
        subject,
        context = {}
    ){

        const safeContext =
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
            )
                ? context
                : {};


        const scope =
            this.normalizeScope(
                safeContext.scope ||
                "entity"
            );


        const failures =
            [];


        let checkedRules =
            0;


        for(
            const rule of
            this.rules.values()
        ){

            if(
                !this.shouldRunRule(
                    rule,
                    scope
                )
            ){

                continue;

            }


            checkedRules +=
                1;


            try{

                const result =
                    rule.validator(
                        subject,
                        {
                            ...safeContext,

                            scope
                        }
                    );


                /*
                 * Guardian is intentionally synchronous.
                 * An async rule cannot silently pass a
                 * synchronous integrity gate.
                 */

                if(
                    result &&
                    typeof result.then ===
                        "function"
                ){

                    const violation =
                        this.recordViolation(
                            rule,
                            subject,
                            "Async validator synchronous Guardian kapısında kullanılamaz.",
                            {
                                ...safeContext,

                                scope
                            }
                        );


                    failures.push(
                        violation
                    );


                    continue;

                }


                if(
                    result !==
                        true
                ){

                    let reason =
                        "Validation failed.";


                    if(
                        typeof result ===
                            "string"
                    ){

                        reason =
                            result;

                    }

                    else if(
                        result &&
                        typeof result ===
                            "object" &&
                        result.reason
                    ){

                        reason =
                            String(
                                result.reason
                            );

                    }


                    const violation =
                        this.recordViolation(
                            rule,
                            subject,
                            reason,
                            {
                                ...safeContext,

                                scope
                            }
                        );


                    failures.push(
                        violation
                    );

                }

            } catch(error){

                const violation =
                    this.recordViolation(
                        rule,
                        subject,
                        error?.message ||
                        "Validator exception.",
                        {
                            ...safeContext,

                            scope
                        }
                    );


                failures.push(
                    violation
                );

            }

        }


        const result = {

            valid:
                failures.length ===
                    0,

            failures,

            checkedRules,

            scope,

            checkedAt:
                Date.now()

        };


        this.emit(
            result.valid
                ? "guardian:passed"
                : "guardian:blocked",
            {
                subjectId:
                    subject?.id ||
                    subject?.slug ||
                    null,

                scope,

                operation:
                    safeContext.operation ||
                    null,

                failures:
                    failures.length,

                checkedRules,

                time:
                    result.checkedAt
            }
        );


        return result;

    },


    /* =====================================================
       BACKWARD-COMPATIBLE VALIDATE
    ===================================================== */

    validate(
        entity,
        context = {}
    ){

        const safeContext =
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
            )
                ? context
                : {};


        const result =
            this.validateDetailed(
                entity,
                {
                    ...safeContext,

                    scope:
                        safeContext.scope ||
                        "entity"
                }
            );


        if(
            !result.valid
        ){

            const first =
                result.failures[
                    0
                ];


            console.warn(
                "Guardian blocked:",
                first?.ruleName ||
                "unknown-rule"
            );

        }


        return result.valid;

    },


    /* =====================================================
       GENERIC CHECK

       OrganSystem uses:
       guardian.check(organ, "organ", context)

       check() deliberately returns the detailed result.
    ===================================================== */

    check(
        subject,
        scope = "global",
        context = {}
    ){

        const safeContext =
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
            )
                ? context
                : {};


        return this.validateDetailed(
            subject,
            {
                ...safeContext,

                scope:
                    this.normalizeScope(
                        scope
                    )
            }
        );

    },


    /* =====================================================
       VIOLATION QUERY
    ===================================================== */

    allViolations(
        options = {}
    ){

        let items =
            [
                ...this.violations
            ];


        if(options.scope){

            const scope =
                this.normalizeScope(
                    options.scope
                );


            items =
                items.filter(
                    item =>
                        item.scope ===
                            scope
                );

        }


        if(options.severity){

            const severity =
                this.normalizeSeverity(
                    options.severity
                );


            items =
                items.filter(
                    item =>
                        item.severity ===
                            severity
                );

        }


        if(options.subjectId){

            const subjectId =
                String(
                    options.subjectId
                ).trim();


            items =
                items.filter(
                    item =>
                        item.subjectId ===
                            subjectId
                );

        }


        return items.sort(
            (
                a,
                b
            ) =>
                Number(
                    b.detectedAt
                ) -
                Number(
                    a.detectedAt
                )
        );

    },


    /* =====================================================
       SECURITY STATUS
    ===================================================== */

    status(){

        const rules =
            [
                ...this.rules.values()
            ];


        const violations =
            [
                ...this.violations
            ];


        return {

            totalRules:
                rules.length,

            activeRules:
                rules.filter(
                    rule =>
                        rule.enabled
                ).length,

            entityRules:
                rules.filter(
                    rule =>
                        rule.scope ===
                            "entity"
                ).length,

            organRules:
                rules.filter(
                    rule =>
                        rule.scope ===
                            "organ"
                ).length,

            globalRules:
                rules.filter(
                    rule =>
                        rule.scope ===
                            "global"
                ).length,

            violations:
                violations.length,

            criticalViolations:
                violations.filter(
                    item =>
                        item.severity ===
                            "critical"
                ).length,

            highViolations:
                violations.filter(
                    item =>
                        item.severity ===
                            "high"
                ).length,

            lastViolation:
                violations.length
                    ? this.clone(
                        violations[
                            violations.length -
                            1
                        ]
                    )
                    : null

        };

    },


    clearViolations(options = {}){

        if(
            !options ||
            Object.keys(
                options
            ).length ===
                0
        ){

            const count =
                this.violations.length;


            this.violations =
                [];


            this.emit(
                "guardian:violations:cleared",
                {
                    count,

                    time:
                        Date.now()
                }
            );


            return true;

        }


        const removeSet =
            new Set(
                this.allViolations(
                    options
                )
                    .map(
                        item =>
                            item.id
                    )
            );


        if(
            removeSet.size ===
                0
        ){

            return false;

        }


        this.violations =
            this.violations.filter(
                item =>
                    !removeSet.has(
                        item.id
                    )
            );


        this.emit(
            "guardian:violations:cleared",
            {
                count:
                    removeSet.size,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const status =
            this.status();


        return {

            ...status,

            healthy:
                status.criticalViolations ===
                    0,

            rules:
                [
                    ...this.rules.values()
                ].map(
                    rule => ({
                        id:
                            rule.id,

                        scope:
                            rule.scope,

                        severity:
                            rule.severity,

                        enabled:
                            rule.enabled
                    })
                ),

            recentViolations:
                this.allViolations()
                    .slice(
                        0,
                        10
                    )

        };

    }

};


/* =========================================================
   ENTITY INTEGRITY RULES
========================================================= */

Guardian.addRule(
    "Entity Must Be Object",
    entity => {

        return Guardian.isObjectLike(
            entity
        )
            ? true
            : "Entity geçerli bir object olmalı.";

    },
    {
        scope:
            "entity",

        severity:
            "critical",

        description:
            "Entity must be a valid object."
    }
);


Guardian.addRule(
    "Entity Must Have ID",
    entity => {

        if(
            !entity?.id
        ){

            return "Entity ID eksik.";

        }


        if(
            !Guardian.isSafeIdentifier(
                entity.id
            )
        ){

            return "Entity ID geçersiz formatta.";

        }


        return true;

    },
    {
        scope:
            "entity",

        severity:
            "critical"
    }
);


Guardian.addRule(
    "Entity Must Have Name",
    entity => {

        const name =
            String(
                entity?.name ??
                ""
            ).trim();


        if(!name){

            return "Entity adı eksik.";

        }


        if(
            name.length >
                200
        ){

            return "Entity adı izin verilen uzunluğu aşıyor.";

        }


        return true;

    },
    {
        scope:
            "entity",

        severity:
            "high"
    }
);


Guardian.addRule(
    "Entity Must Not Contain Dangerous Keys",
    entity => {

        return Guardian
            .hasDangerousObjectKeys(
                entity
            )
            ? "Entity tehlikeli object anahtarı içeriyor."
            : true;

    },
    {
        scope:
            "entity",

        severity:
            "critical"
    }
);


Guardian.addRule(
    "Entity Payload Size Guard",
    entity => {

        return Guardian
            .hasOversizedStrings(
                entity
            )
            ? "Entity içerisinde aşırı büyük metin alanı bulundu."
            : true;

    },
    {
        scope:
            "entity",

        severity:
            "high"
    }
);


/* =========================================================
   ORGAN INTEGRITY RULES
========================================================= */

Guardian.addRule(
    "Organ Must Be Object",
    organ => {

        return Guardian.isObjectLike(
            organ
        )
            ? true
            : "Organ geçerli bir object olmalı.";

    },
    {
        scope:
            "organ",

        severity:
            "critical"
    }
);


Guardian.addRule(
    "Organ Must Have Identifier",
    organ => {

        const id =
            organ?.id ||
            organ?.slug;


        if(!id){

            return "Organ ID veya slug eksik.";

        }


        if(
            !Guardian.isSafeIdentifier(
                id
            )
        ){

            return "Organ identifier geçersiz formatta.";

        }


        return true;

    },
    {
        scope:
            "organ",

        severity:
            "critical"
    }
);


Guardian.addRule(
    "Organ Must Have Valid Status",
    organ => {

        const status =
            String(
                organ?.status ??
                ""
            )
                .trim()
                .toLowerCase();


        if(!status){

            /*
             * Creation path may validate an organ before
             * its default runtime status is attached.
             */

            return true;

        }


        const allowed =
            new Set([
                "active",
                "inactive",
                "paused",
                "disabled",
                "installing",
                "updating",
                "error"
            ]);


        return allowed.has(
            status
        )
            ? true
            : `Organ status geçersiz: ${status}`;

    },
    {
        scope:
            "organ",

        severity:
            "high"
    }
);


Guardian.addRule(
    "Organ Permissions Must Be Valid",
    organ => {

        const collections = [
            organ?.permissions,
            organ?.requestedPermissions
        ];


        for(
            const collection of collections
        ){

            if(
                collection ===
                    undefined ||
                collection ===
                    null
            ){

                continue;

            }


            if(
                !Array.isArray(
                    collection
                ) &&
                !(collection instanceof Set) &&
                !Guardian.isPlainObject(
                    collection
                )
            ){

                return "Organ permission yapısı geçersiz.";

            }

        }


        return true;

    },
    {
        scope:
            "organ",

        severity:
            "high"
    }
);


Guardian.addRule(
    "Organ Dependencies Must Be Valid",
    organ => {

        const dependencies =
            organ?.dependencies;


        if(
            dependencies ===
                undefined ||
            dependencies ===
                null
        ){

            return true;

        }


        if(
            !Array.isArray(
                dependencies
            ) &&
            !(dependencies instanceof Set)
        ){

            return "Organ dependencies listesi geçersiz.";

        }


        for(
            const dependency of
            dependencies
        ){

            if(
                !Guardian.isSafeIdentifier(
                    dependency
                )
            ){

                return `Geçersiz Organ dependency: ${String(
                    dependency ??
                    ""
                )}`;

            }

        }


        return true;

    },
    {
        scope:
            "organ",

        severity:
            "high"
    }
);


Guardian.addRule(
    "Organ Must Not Contain Dangerous Keys",
    organ => {

        return Guardian
            .hasDangerousObjectKeys(
                organ
            )
            ? "Organ tehlikeli object anahtarı içeriyor."
            : true;

    },
    {
        scope:
            "organ",

        severity:
            "critical"
    }
);


Guardian.addRule(
    "Organ Payload Size Guard",
    organ => {

        return Guardian
            .hasOversizedStrings(
                organ
            )
            ? "Organ içerisinde aşırı büyük metin alanı bulundu."
            : true;

    },
    {
        scope:
            "organ",

        severity:
            "high"
    }
);


/* =========================================================
   GLOBAL INTEGRITY RULES
========================================================= */

Guardian.addRule(
    "Global Payload Dangerous Keys",
    subject => {

        return Guardian
            .hasDangerousObjectKeys(
                subject
            )
            ? "Runtime payload tehlikeli object anahtarı içeriyor."
            : true;

    },
    {
        scope:
            "global",

        severity:
            "critical"
    }
);


Guardian.addRule(
    "Global Payload Size Guard",
    subject => {

        return Guardian
            .hasOversizedStrings(
                subject
            )
            ? "Runtime payload içerisinde aşırı büyük metin alanı bulundu."
            : true;

    },
    {
        scope:
            "global",

        severity:
            "high"
    }
);


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
            "guardian",
            Guardian
        );

    }

} catch(error){

    console.error(
        "Guardian register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.Guardian =
        Guardian;

}
