/* =========================================================
   VAERO GUARDIAN
   Runtime Validation / Integrity Gate
========================================================= */

const Guardian = {

    rules: new Map(),

    violations: [],

    maxViolations: 100,

    maxStringLength: 10000,


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeRuleName(name){

        return String(
            name ?? ""
        )
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-");

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
            this.rules.has(id) &&
            options.overwrite !== true
        ){

            console.warn(
                `Guardian rule zaten kayıtlı: ${id}`
            );

            return false;
        }


        this.rules.set(
            id,
            {
                id,

                name:
                    String(name),

                validator,

                enabled:
                    options.enabled !==
                    false,

                severity:
                    [
                        "low",
                        "medium",
                        "high",
                        "critical"
                    ].includes(
                        options.severity
                    )
                        ? options.severity
                        : "high",

                scope:
                    options.scope ||
                    "entity",

                description:
                    options.description ||
                    null,

                registeredAt:
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


        return this.rules.delete(
            id
        );
    },


    hasRule(name){

        return this.rules.has(
            this.normalizeRuleName(
                name
            )
        );
    },


    setRuleEnabled(
        name,
        enabled = true
    ){

        const id =
            this.normalizeRuleName(
                name
            );


        const rule =
            this.rules.get(
                id
            );


        if(!rule){
            return false;
        }


        rule.enabled =
            Boolean(
                enabled
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
            Array.isArray(value)
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


    isSafeIdentifier(value){

        const text =
            String(
                value ?? ""
            ).trim();


        if(
            !text ||
            text.length > 200
        ){
            return false;
        }


        return /^[a-zA-Z0-9:_\-.]+$/.test(
            text
        );
    },


    hasDangerousObjectKeys(
        value,
        depth = 0
    ){

        if(
            depth > 8 ||
            value === null ||
            value === undefined
        ){
            return false;
        }


        if(
            typeof value !==
            "object"
        ){
            return false;
        }


        const dangerousKeys =
            new Set([
                "__proto__",
                "prototype",
                "constructor"
            ]);


        for(
            const key of
            Object.keys(value)
        ){

            if(
                dangerousKeys.has(
                    key
                )
            ){
                return true;
            }


            const child =
                value[key];


            if(
                child &&
                typeof child ===
                    "object" &&
                this.hasDangerousObjectKeys(
                    child,
                    depth + 1
                )
            ){
                return true;
            }

        }


        return false;
    },


    hasOversizedStrings(
        value,
        depth = 0
    ){

        if(depth > 8){
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


        for(
            const key of
            Object.keys(value)
        ){

            if(
                this.hasOversizedStrings(
                    value[key],
                    depth + 1
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
                (
                    typeof crypto !==
                        "undefined" &&
                    typeof crypto.randomUUID ===
                        "function"
                )
                    ? crypto.randomUUID()
                    : `guardian_${Date.now()}_${Math.random()
                        .toString(36)
                        .slice(2, 8)}`,

            ruleId:
                rule?.id ||
                null,

            ruleName:
                rule?.name ||
                null,

            severity:
                rule?.severity ||
                "high",

            scope:
                rule?.scope ||
                null,

            reason:
                reason ||
                "Validation failed.",

            subjectId:
                subject?.id ||
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


        return violation;
    },


    /* =====================================================
       DETAILED VALIDATION
    ===================================================== */

    validateDetailed(
        subject,
        context = {}
    ){

        const failures = [];


        for(
            const rule of
            this.rules.values()
        ){

            if(!rule.enabled){
                continue;
            }


            if(
                context.scope &&
                rule.scope !==
                    context.scope &&
                rule.scope !==
                    "global"
            ){
                continue;
            }


            try{

                const result =
                    rule.validator(
                        subject,
                        context
                    );


                /*
                 * Guardian'ın ana validate() API'si
                 * synchronous kalıyor.
                 * Promise dönen validator burada sessizce
                 * başarılı kabul edilmez.
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
                            context
                        );


                    failures.push(
                        violation
                    );


                    continue;
                }


                if(result !== true){

                    let reason =
                        "Validation failed.";


                    if(
                        typeof result ===
                        "string"
                    ){

                        reason =
                            result;

                    } else if(
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
                            context
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
                        context
                    );


                failures.push(
                    violation
                );

            }

        }


        return {

            valid:
                failures.length === 0,

            failures,

            checkedRules:
                [
                    ...this.rules.values()
                ]
                    .filter(
                        rule =>
                            rule.enabled
                    )
                    .length,

            checkedAt:
                Date.now()
        };

    },


    /* =====================================================
       BACKWARD-COMPATIBLE VALIDATE
    ===================================================== */

    validate(
        entity,
        context = {}
    ){

        const result =
            this.validateDetailed(
                entity,
                {
                    scope:
                        context.scope ||
                        "entity",

                    ...context
                }
            );


        if(!result.valid){

            const first =
                result.failures[0];


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
    ===================================================== */

    check(
        subject,
        scope = "global",
        context = {}
    ){

        return this.validateDetailed(
            subject,
            {
                ...context,
                scope
            }
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


        return {

            totalRules:
                rules.length,

            activeRules:
                rules.filter(
                    rule =>
                        rule.enabled
                ).length,

            violations:
                this.violations.length,

            criticalViolations:
                this.violations.filter(
                    item =>
                        item.severity ===
                        "critical"
                ).length,

            lastViolation:
                this.violations.length
                    ? this.clone(
                        this.violations[
                            this.violations.length - 1
                        ]
                    )
                    : null

        };
    },


    clearViolations(){

        this.violations =
            [];

        return true;
    }

};


/* =========================================================
   ENTITY INTEGRITY RULES
========================================================= */

Guardian.addRule(
    "Entity Must Be Object",
    entity =>
        Guardian.isPlainObject(
            entity
        ) ||
        (
            entity &&
            typeof entity ===
                "object"
        ),
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

        if(!entity?.id){
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


        if(name.length > 200){
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
   REGISTER
========================================================= */

VAERO.register(
    "guardian",
    Guardian
);


window.Guardian =
    Guardian;
