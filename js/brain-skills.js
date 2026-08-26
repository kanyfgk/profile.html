/* =========================================================
   VAERO BRAIN SKILLS
   Skill Registry / Execution Layer
========================================================= */

const BrainSkills = {

    skills: new Map(),

    executionHistory: [],

    historyLimit: 50,


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
            metadata &&
            typeof metadata ===
                "object" &&
            !Array.isArray(
                metadata
            )
                ? {
                    ...metadata
                }
                : {};


        this.skills.set(
            skillName,
            {

                name:
                    skillName,

                handler,

                metadata:
                    safeMetadata,

                enabled:
                    safeMetadata.enabled !==
                    false,

                registeredAt:
                    Date.now(),

                runs:
                    0,

                failures:
                    0,

                lastRunAt:
                    null,

                lastResult:
                    null

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


        return this.skills.delete(
            skillName
        );

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


        const skill =
            this.skills.get(
                skillName
            );


        if(!skill){
            return null;
        }


        return skill;

    },


    all(){

        return [
            ...this.skills.values()
        ].map(
            skill => ({

                name:
                    skill.name,

                metadata:
                    {
                        ...skill.metadata
                    },

                enabled:
                    skill.enabled,

                registeredAt:
                    skill.registeredAt,

                runs:
                    skill.runs,

                failures:
                    skill.failures,

                lastRunAt:
                    skill.lastRunAt,

                lastResult:
                    skill.lastResult

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


        return true;

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

            success:
                true,

            skill:
                name,

            data:
                result ?? null

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
                    skillName || null,

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
                ? payload
                : {
                    value:
                        payload
                };


        const safeContext =
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
            )
                ? context
                : {};


        const startedAt =
            Date.now();


        skill.runs += 1;

        skill.lastRunAt =
            startedAt;


        try{

            const rawResult =
                await skill.handler(
                    safePayload,
                    safeContext
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

                skill.failures += 1;

            }


            this.recordExecution({

                skill:
                    skillName,

                success:
                    finalResult.success,

                startedAt,

                completedAt,

                duration:
                    finalResult.duration

            });


            return finalResult;


        } catch(error){

            skill.failures += 1;


            const completedAt =
                Date.now();


            const result = {

                success:false,

                skill:
                    skillName,

                error:true,

                errorCode:
                    "skill-execution-error",

                message:
                    error?.message ||
                    "Skill çalıştırılırken hata oluştu.",

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

                startedAt,

                completedAt,

                duration:
                    result.duration

            });


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
                    Number(limit) || 10
                )
            );


        return this.executionHistory.slice(
            -safeLimit
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

            executions:
                this.executionHistory.length,

            skills

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
