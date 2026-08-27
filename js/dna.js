/* =========================================================
   VAERO DNA
   Core Principles / Architectural Laws / Invariants
========================================================= */

const DNA = {

    version:
        "2.0",

    name:
        "VAERO DNA",

    id:
        "vaero-dna",

    immutable:
        true,


    /* =====================================================
       PRINCIPLES
    ===================================================== */

    principles: [

        "Everything is an Entity",

        "Everything is Connected",

        "Everything has Identity",

        "Everything has Memory",

        "Everything has a Timeline",

        "Everything Evolves",

        "Nothing depends on a single technology",

        "Everything can be reconstructed"

    ],


    /* =====================================================
       LAWS
    ===================================================== */

    laws: {

        entity:
            "Every object, person, system, world, device, idea or memory can exist as an Entity.",

        connection:
            "Every Entity can be connected through Bridges.",

        identity:
            "Every Entity can possess a persistent Identity independent from its presentation layer.",

        memory:
            "Every meaningful event can be remembered.",

        timeline:
            "Every meaningful action belongs to time.",

        evolution:
            "Every system can change without losing its origin.",

        independence:
            "VAERO Core must not depend on any platform, device, database, company or era.",

        reconstruction:
            "A valid Entity should be understandable and reconstructable in the future."

    },


    /* =====================================================
       INVARIANTS

       These describe architecture-level boundaries.
       They are not runtime permissions.
    ===================================================== */

    invariants: {

        entityFirst:
            "Entity is the universal structural unit of VAERO.",

        identitySeparation:
            "Identity and Profile are separate layers.",

        sourceAuthority:
            "Presentation layers must not become authoritative sources for core data.",

        eventContinuity:
            "Meaningful state changes should be observable through the event architecture.",

        historyContinuity:
            "Evolution must preserve origin and historical continuity.",

        bridgeContinuity:
            "Connections belong to the Bridge layer, not to presentation-specific implementations.",

        technologyIndependence:
            "Core concepts must remain portable across technologies and infrastructure providers.",

        reconstruction:
            "Core state should remain representable in a form that can be migrated, restored or reconstructed."

    },


    /* =====================================================
       CAPABILITIES
    ===================================================== */

    capabilities: [

        "entity",

        "identity",

        "profile",

        "bridge",

        "memory",

        "timeline",

        "evolution",

        "world",

        "universe",

        "organ",

        "brain",

        "runtime"

    ],


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeKey(value){

        return String(
            value ??
            ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );

    },


    /* =====================================================
       PRINCIPLE QUERY
    ===================================================== */

    hasPrinciple(value){

        const text =
            String(
                value ??
                ""
            )
                .trim()
                .toLocaleLowerCase(
                    "en-US"
                );


        if(!text){

            return false;

        }


        return this.principles.some(
            principle =>
                String(
                    principle
                )
                    .toLocaleLowerCase(
                        "en-US"
                    ) ===
                text
        );

    },


    principle(index){

        const value =
            Number(
                index
            );


        if(
            !Number.isInteger(
                value
            ) ||
            value <
                0 ||
            value >=
                this.principles.length
        ){

            return null;

        }


        return this.principles[
            value
        ];

    },


    /* =====================================================
       LAW QUERY
    ===================================================== */

    law(name){

        const key =
            this.normalizeKey(
                name
            );


        if(!key){

            return null;

        }


        return (
            this.laws[
                key
            ] ||
            null
        );

    },


    hasLaw(name){

        return Boolean(
            this.law(
                name
            )
        );

    },


    /* =====================================================
       INVARIANT QUERY
    ===================================================== */

    invariant(name){

        const key =
            String(
                name ??
                ""
            ).trim();


        if(!key){

            return null;

        }


        if(
            Object.prototype.hasOwnProperty.call(
                this.invariants,
                key
            )
        ){

            return this.invariants[
                key
            ];

        }


        const normalized =
            this.normalizeKey(
                key
            );


        const match =
            Object.keys(
                this.invariants
            ).find(
                item =>
                    this.normalizeKey(
                        item
                    ) ===
                    normalized
            );


        return match
            ? this.invariants[
                match
            ]
            : null;

    },


    hasInvariant(name){

        return Boolean(
            this.invariant(
                name
            )
        );

    },


    /* =====================================================
       CAPABILITY QUERY
    ===================================================== */

    hasCapability(name){

        const key =
            this.normalizeKey(
                name
            );


        if(!key){

            return false;

        }


        return this.capabilities.includes(
            key
        );

    },


    /* =====================================================
       VALIDATION
    ===================================================== */

    validate(){

        const issues =
            [];


        if(
            !this.id ||
            !this.name ||
            !this.version
        ){

            issues.push(
                "DNA identity is incomplete."
            );

        }


        if(
            !Array.isArray(
                this.principles
            ) ||
            this.principles.length ===
                0
        ){

            issues.push(
                "DNA principles are missing."
            );

        }


        if(
            !this.laws ||
            typeof this.laws !==
                "object"
        ){

            issues.push(
                "DNA laws are missing."
            );

        }


        const requiredLaws = [

            "entity",
            "connection",
            "identity",
            "memory",
            "timeline",
            "evolution",
            "independence",
            "reconstruction"

        ];


        requiredLaws.forEach(
            lawName => {

                if(
                    !this.laws[
                        lawName
                    ]
                ){

                    issues.push(
                        `Required DNA law missing: ${lawName}`
                    );

                }

            }
        );


        return {

            valid:
                issues.length ===
                    0,

            issues,

            version:
                this.version,

            checkedAt:
                Date.now()

        };

    },


    /* =====================================================
       DESCRIBE
    ===================================================== */

    describe(){

        return {

            id:
                this.id,

            version:
                this.version,

            name:
                this.name,

            immutable:
                this.immutable,

            principles:[
                ...this.principles
            ],

            laws:{
                ...this.laws
            },

            invariants:{
                ...this.invariants
            },

            capabilities:[
                ...this.capabilities
            ]

        };

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const validation =
            this.validate();


        return {

            id:
                this.id,

            version:
                this.version,

            name:
                this.name,

            immutable:
                this.immutable,

            principles:
                this.principles.length,

            laws:
                Object.keys(
                    this.laws
                ).length,

            invariants:
                Object.keys(
                    this.invariants
                ).length,

            capabilities:
                this.capabilities.length,

            valid:
                validation.valid,

            issues:[
                ...validation.issues
            ]

        };

    }

};


/* =========================================================
   FREEZE CORE DNA
========================================================= */

Object.freeze(
    DNA.principles
);


Object.freeze(
    DNA.laws
);


Object.freeze(
    DNA.invariants
);


Object.freeze(
    DNA.capabilities
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
            "dna",
            DNA
        );

    }

} catch(error){

    console.error(
        "DNA register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.DNA =
        DNA;

}
