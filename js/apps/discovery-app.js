/* =========================================================
   VAERO DISCOVERY APP
   First Journey / Direction / Matching / Personalisation
========================================================= */

class DiscoveryApp {

    constructor(){

        this.storageKey =
            "vaero:discovery:draft:v3";

        this.legacyStorageKey =
            "vaero:discovery:draft:v2";

        this.answersKey =
            "vaero:discovery:answers";

        this.resultKey =
            "vaero:discovery:result:v2";

        this.completedKey =
            "vaero:discovery:completed";

        this.completedAtKey =
            "vaero:discovery:completedAt";

        this.welcomeCompletedKey =
            "vaero:welcome:completed:v2";

        this.container =
            null;

        this.isCompleting =
            false;


        this.steps = [

            {
                id:
                    "purpose",

                type:
                    "single",

                title:
                    "VAERO’ya neden geldin?",

                description:
                    "Yolculuğunun başlangıç noktasını seç.",

                options:[
                    "Kendimi geliştirmek istiyorum",
                    "Bir fikir veya proje geliştirmek istiyorum",
                    "Doğru insanları bulmak istiyorum",
                    "Yeni fırsatları keşfetmek istiyorum",
                    "Yatırım yapmak veya destek olmak istiyorum"
                ]
            },


            {
                id:
                    "interest",

                type:
                    "multiple",

                title:
                    "Seni hangi dünyalar çekiyor?",

                description:
                    "Bir veya daha fazla alan seçebilirsin.",

                options:[
                    "Teknoloji",
                    "Girişimcilik",
                    "Tasarım ve yaratıcılık",
                    "Finans ve yatırım",
                    "Kişisel gelişim",
                    "Toplumsal etki"
                ]
            },


            {
                id:
                    "strength",

                type:
                    "multiple",

                title:
                    "Bu dünyaya ne katabilirsin?",

                description:
                    "Sana uyan güçlü yönleri seç.",

                options:[
                    "Fikir geliştirebilirim",
                    "Üretebilir ve uygulayabilirim",
                    "Tasarım ve içerik oluşturabilirim",
                    "İnsanları ve ekipleri yönetebilirim",
                    "Bağlantılar kurabilirim",
                    "Sermaye veya kaynak sağlayabilirim",
                    "Henüz güçlü yönümü keşfediyorum"
                ]
            },


            {
                id:
                    "goal",

                type:
                    "single",

                title:
                    "Şu an ulaşmak istediğin nokta ne?",

                description:
                    "VAERO sana göstereceği yolu buna göre şekillendirecek.",

                options:[
                    "Bir proje başlatmak",
                    "Mevcut projemi büyütmek",
                    "Kariyerimi geliştirmek",
                    "Yeni şeyler öğrenmek",
                    "Güçlü bir çevre kurmak",
                    "Doğru yatırım fırsatını bulmak"
                ]
            },


            {
                id:
                    "connection",

                type:
                    "multiple",

                title:
                    "Kimlerle karşılaşmak istersin?",

                description:
                    "Bir veya daha fazla insan grubunu seçebilirsin.",

                options:[
                    "Kurucular ve girişimciler",
                    "Yatırımcılar",
                    "Uzmanlar ve mentorlar",
                    "Üreticiler ve yetenekler",
                    "İş birliği yapabileceğim insanlar",
                    "İlgi alanıma uygun topluluklar"
                ]
            },


            {
                id:
                    "guidance",

                type:
                    "single",

                title:
                    "VAERO sana nasıl eşlik etsin?",

                description:
                    "Kontrol her zaman sende kalacak.",

                options:[
                    "Bana yön göstersin",
                    "Gelişimimi takip etsin",
                    "Doğru insanlarla eşleştirsin",
                    "Fırsatları karşıma çıkarsın",
                    "Hepsini dengeli biçimde yapsın"
                ]
            }

        ];


        const draft =
            this.loadDraft();


        this.currentStep =
            this.normalizeStepIndex(
                draft.currentStep
            );


        this.answers =
            this.sanitizeAnswers(
                draft.answers
            );


        this.saveDraft();

    }


    /* =====================================================
       SAFETY
    ===================================================== */

    escapeHTML(value){

        if(
            window.UI &&
            typeof UI.escapeHTML ===
                "function"
        ){

            return UI.escapeHTML(
                value
            );

        }


        return String(
            value ?? ""
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

    }


    normalizeStepIndex(value){

        const index =
            Number(
                value
            );


        if(
            !Number.isInteger(
                index
            ) ||
            index <
                0 ||
            index >=
                this.steps.length
        ){

            return 0;

        }


        return index;

    }


    /* =====================================================
       SERVICES
    ===================================================== */

    getService(name){

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
                    name
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    }


    getEngine(){

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                VAERO.engine
            ){

                return VAERO.engine;

            }

        } catch(error){

            /* fallback */

        }


        return (
            window.Engine ||
            null
        );

    }


    getCurrentEntity(){

        const engine =
            this.getEngine();


        return (
            engine?.currentOpenedEntity ||
            engine?.currentEntity ||
            engine?.rootEntity ||
            null
        );

    }


    /* =====================================================
       DRAFT
    ===================================================== */

    loadDraft(){

        try{

            let saved =
                localStorage.getItem(
                    this.storageKey
                );


            if(!saved){

                saved =
                    localStorage.getItem(
                        this.legacyStorageKey
                    );

            }


            if(!saved){

                return {
                    currentStep:
                        0,

                    answers:
                        {}
                };

            }


            const parsed =
                JSON.parse(
                    saved
                );


            if(
                !parsed ||
                typeof parsed !==
                    "object" ||
                Array.isArray(
                    parsed
                )
            ){

                return {
                    currentStep:
                        0,

                    answers:
                        {}
                };

            }


            return {

                currentStep:
                    Number.isInteger(
                        parsed.currentStep
                    )
                        ? parsed.currentStep
                        : 0,

                answers:
                    parsed.answers &&
                    typeof parsed.answers ===
                        "object" &&
                    !Array.isArray(
                        parsed.answers
                    )
                        ? parsed.answers
                        : {}

            };

        } catch(error){

            console.warn(
                "Discovery taslağı okunamadı:",
                error
            );


            return {
                currentStep:
                    0,

                answers:
                    {}
            };

        }

    }


    saveDraft(){

        try{

            localStorage.setItem(
                this.storageKey,
                JSON.stringify({
                    currentStep:
                        this.normalizeStepIndex(
                            this.currentStep
                        ),

                    answers:
                        this.sanitizeAnswers(
                            this.answers
                        ),

                    updatedAt:
                        Date.now()
                })
            );


            return true;

        } catch(error){

            console.warn(
                "Discovery taslağı kaydedilemedi:",
                error
            );


            return false;

        }

    }


    clearDraft(){

        try{

            localStorage.removeItem(
                this.storageKey
            );


            localStorage.removeItem(
                this.legacyStorageKey
            );


            return true;

        } catch(error){

            return false;

        }

    }


    /* =====================================================
       ANSWERS
    ===================================================== */

    getSelectedAnswers(step){

        if(!step){

            return [];

        }


        const answer =
            this.answers[
                step.id
            ];


        if(
            step.type ===
                "multiple"
        ){

            return Array.isArray(
                answer
            )
                ? answer.filter(
                    item =>
                        step.options.includes(
                            item
                        )
                )
                : [];

        }


        return step.options.includes(
            answer
        )
            ? [
                answer
            ]
            : [];

    }


    hasAnswer(step){

        return (
            this
                .getSelectedAnswers(
                    step
                )
                .length >
                0
        );

    }


    sanitizeAnswers(
        source = this.answers
    ){

        const input =
            source &&
            typeof source ===
                "object" &&
            !Array.isArray(
                source
            )
                ? source
                : {};


        const output = {};


        this.steps.forEach(
            step => {

                const value =
                    input[
                        step.id
                    ];


                if(
                    step.type ===
                        "multiple"
                ){

                    const seen =
                        new Set();


                    output[
                        step.id
                    ] =
                        Array.isArray(
                            value
                        )
                            ? value
                                .map(
                                    item =>
                                        String(
                                            item ??
                                            ""
                                        ).trim()
                                )
                                .filter(
                                    item => {

                                        if(
                                            !step.options.includes(
                                                item
                                            )
                                        ){

                                            return false;

                                        }


                                        if(
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
                                )
                            : [];


                    return;

                }


                output[
                    step.id
                ] =
                    step.options.includes(
                        value
                    )
                        ? value
                        : "";

            }
        );


        return output;

    }


    /* =====================================================
       JOURNEY ANALYSIS
    ===================================================== */

    buildSignals(){

        const answers =
            this.sanitizeAnswers();


        const signals = {

            direction:
                [],

            interests:
                [],

            strengths:
                [],

            connectionNeeds:
                [],

            recommendedApps:
                [],

            brainMode:
                "balanced",

            opportunityBias:
                0,

            builderBias:
                0,

            networkBias:
                0,

            growthBias:
                0,

            investmentBias:
                0

        };


        /* =================================================
           PURPOSE
        ================================================= */

        switch(
            answers.purpose
        ){

            case "Kendimi geliştirmek istiyorum":

                signals.growthBias +=
                    3;


                signals.direction.push(
                    "personal-growth"
                );

                break;


            case "Bir fikir veya proje geliştirmek istiyorum":

                signals.builderBias +=
                    4;


                signals.direction.push(
                    "build"
                );

                break;


            case "Doğru insanları bulmak istiyorum":

                signals.networkBias +=
                    4;


                signals.direction.push(
                    "network"
                );

                break;


            case "Yeni fırsatları keşfetmek istiyorum":

                signals.opportunityBias +=
                    4;


                signals.direction.push(
                    "opportunity"
                );

                break;


            case "Yatırım yapmak veya destek olmak istiyorum":

                signals.investmentBias +=
                    4;


                signals.direction.push(
                    "investment"
                );

                break;

        }


        /* =================================================
           INTERESTS
        ================================================= */

        signals.interests =
            Array.isArray(
                answers.interest
            )
                ? [
                    ...answers.interest
                ]
                : [];


        if(
            signals.interests.includes(
                "Girişimcilik"
            )
        ){

            signals.builderBias +=
                2;

        }


        if(
            signals.interests.includes(
                "Finans ve yatırım"
            )
        ){

            signals.investmentBias +=
                2;

        }


        if(
            signals.interests.includes(
                "Kişisel gelişim"
            )
        ){

            signals.growthBias +=
                2;

        }


        /* =================================================
           STRENGTHS
        ================================================= */

        signals.strengths =
            Array.isArray(
                answers.strength
            )
                ? [
                    ...answers.strength
                ]
                : [];


        if(
            signals.strengths.includes(
                "Üretebilir ve uygulayabilirim"
            ) ||
            signals.strengths.includes(
                "Fikir geliştirebilirim"
            )
        ){

            signals.builderBias +=
                2;

        }


        if(
            signals.strengths.includes(
                "Bağlantılar kurabilirim"
            ) ||
            signals.strengths.includes(
                "İnsanları ve ekipleri yönetebilirim"
            )
        ){

            signals.networkBias +=
                2;

        }


        if(
            signals.strengths.includes(
                "Sermaye veya kaynak sağlayabilirim"
            )
        ){

            signals.investmentBias +=
                2;

        }


        /* =================================================
           GOAL
        ================================================= */

        switch(
            answers.goal
        ){

            case "Bir proje başlatmak":
            case "Mevcut projemi büyütmek":

                signals.builderBias +=
                    4;

                break;


            case "Kariyerimi geliştirmek":
            case "Yeni şeyler öğrenmek":

                signals.growthBias +=
                    4;

                break;


            case "Güçlü bir çevre kurmak":

                signals.networkBias +=
                    4;

                break;


            case "Doğru yatırım fırsatını bulmak":

                signals.investmentBias +=
                    4;


                signals.opportunityBias +=
                    2;

                break;

        }


        /* =================================================
           CONNECTION
        ================================================= */

        signals.connectionNeeds =
            Array.isArray(
                answers.connection
            )
                ? [
                    ...answers.connection
                ]
                : [];


        if(
            signals.connectionNeeds
                .length >
            0
        ){

            signals.networkBias +=
                2;

        }


        /* =================================================
           GUIDANCE

           brainMode burada Brain runtime mode değildir.
           Discovery'nin yönlendirme tercihidir.
        ================================================= */

        switch(
            answers.guidance
        ){

            case "Bana yön göstersin":

                signals.brainMode =
                    "direction";

                break;


            case "Gelişimimi takip etsin":

                signals.brainMode =
                    "evolution";

                break;


            case "Doğru insanlarla eşleştirsin":

                signals.brainMode =
                    "connections";


                signals.networkBias +=
                    2;

                break;


            case "Fırsatları karşıma çıkarsın":

                signals.brainMode =
                    "opportunities";


                signals.opportunityBias +=
                    2;

                break;


            default:

                signals.brainMode =
                    "balanced";

        }


        /* =================================================
           RECOMMENDED ENGINE SURFACES
        ================================================= */

        signals.recommendedApps.push(
            "profile"
        );


        if(
            signals.growthBias >
            0
        ){

            signals.recommendedApps.push(
                "evolution",
                "memory",
                "timeline"
            );

        }


        if(
            signals.networkBias >
            0
        ){

            signals.recommendedApps.push(
                "bridge"
            );

        }


        /*
         * World bir Applications catalog uygulaması olmak
         * zorunda değildir. Bu değer Discovery recommendation
         * sinyali olarak korunur.
         */

        if(
            signals.builderBias >
            0
        ){

            signals.recommendedApps.push(
                "worlds"
            );

        }


        signals.recommendedApps = [
            ...new Set(
                signals.recommendedApps
            )
        ];


        return signals;

    }


    /* =====================================================
       PRIMARY DIRECTION
    ===================================================== */

    getPrimaryDirection(signals){

        const rankings = [

            {
                id:
                    "builder",

                score:
                    signals.builderBias,

                label:
                    "Üret ve geliştir",

                description:
                    "Projeler, fikirler ve yeni dünyalar oluşturmak öncelikli yönün."
            },

            {
                id:
                    "network",

                score:
                    signals.networkBias,

                label:
                    "Doğru bağlantıları kur",

                description:
                    "Bridge ve ilişki ağı senin yolculuğunda daha önemli rol oynayacak."
            },

            {
                id:
                    "growth",

                score:
                    signals.growthBias,

                label:
                    "Kendini geliştir",

                description:
                    "Evolution, Memory ve Timeline ilerlemeni görünür hale getirecek."
            },

            {
                id:
                    "investment",

                score:
                    signals.investmentBias,

                label:
                    "Fırsatları değerlendir",

                description:
                    "Kaynak, yatırım ve potansiyel fırsat sinyalleri senin için daha önemli."
            },

            {
                id:
                    "opportunity",

                score:
                    signals.opportunityBias,

                label:
                    "Yeni fırsatları keşfet",

                description:
                    "VAERO yeni yön ve fırsatları keşfetmen için daha geniş bir pencere açacak."
            }

        ];


        rankings.sort(
            (
                a,
                b
            ) =>
                b.score -
                a.score
        );


        const winner =
            rankings[
                0
            ];


        if(
            !winner ||
            winner.score <=
                0
        ){

            return {
                id:
                    "balanced",

                score:
                    0,

                label:
                    "Dengeli keşif",

                description:
                    "VAERO ilk aşamada farklı alanları dengeli biçimde önüne çıkaracak."
            };

        }


        return {
            ...winner
        };

    }


    /* =====================================================
       STARTING ACTIONS
    ===================================================== */

    buildStartingActions(
        signals,
        direction
    ){

        const actions =
            [];


        if(
            signals.builderBias >
            0
        ){

            actions.push({
                id:
                    "create-world",

                title:
                    "İlk dünyanı oluştur",

                description:
                    "Bir proje, fikir veya çalışma alanı için yeni bir World başlat.",

                target:
                    "worlds"
            });

        }


        if(
            signals.networkBias >
            0
        ){

            actions.push({
                id:
                    "build-network",

                title:
                    "Bridge ağını kur",

                description:
                    "İhtiyacın olan insan ve varlık türlerini bağlantı ağına ekle.",

                target:
                    "bridge"
            });

        }


        if(
            signals.growthBias >
            0
        ){

            actions.push({
                id:
                    "define-goal",

                title:
                    "İlk hedefini tanımla",

                description:
                    "Evolution içinde takip edilebilir bir hedef oluştur.",

                target:
                    "evolution"
            });

        }


        if(
            signals.investmentBias >
                0 ||
            signals.opportunityBias >
                0
        ){

            actions.push({
                id:
                    "map-opportunities",

                title:
                    "Fırsat alanlarını belirle",

                description:
                    "İlgilendiğin sektör, insan ve kaynakları profil sinyallerinle eşleştir.",

                target:
                    "profile"
            });

        }


        actions.push({
            id:
                "complete-profile",

            title:
                "Profilini tamamla",

            description:
                "Discovery sinyallerini gerçek profil bilgilerinle güçlendir.",

            target:
                "profile"
        });


        const seen =
            new Set();


        return actions
            .filter(
                action => {

                    if(
                        !action?.id ||
                        seen.has(
                            action.id
                        )
                    ){

                        return false;

                    }


                    seen.add(
                        action.id
                    );


                    return true;

                }
            )
            .slice(
                0,
                3
            );

    }


    buildResult(){

        const answers =
            this.sanitizeAnswers();


        const signals =
            this.buildSignals();


        const primaryDirection =
            this.getPrimaryDirection(
                signals
            );


        return {

            version:
                2,

            journeyVersion:
                3,

            answers,

            signals,

            primaryDirection,

            startingActions:
                this.buildStartingActions(
                    signals,
                    primaryDirection
                ),

            generatedAt:
                Date.now()

        };

    }


    /* =====================================================
       RENDER
    ===================================================== */

    render(container){

        if(!container){

            return false;

        }


        this.container =
            container;


        document.body.classList.add(
            "discovery-active"
        );


        this.currentStep =
            this.normalizeStepIndex(
                this.currentStep
            );


        const step =
            this.steps[
                this.currentStep
            ];


        if(!step){

            return false;

        }


        const selectedAnswers =
            this.getSelectedAnswers(
                step
            );


        const progress =
            Math.max(
                0,
                Math.min(
                    100,
                    (
                        (
                            this.currentStep +
                            1
                        ) /
                        this.steps.length
                    ) *
                    100
                )
            );


        this.container.innerHTML = `
            <div class="discovery-screen">

                <main class="discovery-content">

                    <div class="discovery-navigation">

                        ${
                            this.currentStep >
                                0
                                ? `
                                    <button
                                        type="button"
                                        class="discovery-back"
                                        data-discovery-action="back"
                                    >
                                        ← Geri
                                    </button>
                                  `
                                : `
                                    <span
                                        class="discovery-back-placeholder"
                                        aria-hidden="true"
                                    ></span>
                                  `
                        }


                        <span class="discovery-count">
                            ${this.currentStep + 1}
                            /
                            ${this.steps.length}
                        </span>

                    </div>


                    <div
                        class="discovery-progress"
                        role="progressbar"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow="${Math.round(
                            progress
                        )}"
                        aria-label="Discovery ilerlemesi"
                    >
                        <span
                            style="width:${progress}%"
                        ></span>
                    </div>


                    <header class="discovery-header">

                        <h1>
                            ${this.escapeHTML(
                                step.title
                            )}
                        </h1>


                        <p class="discovery-description">
                            ${this.escapeHTML(
                                step.description
                            )}
                        </p>

                    </header>


                    <div class="discovery-options">

                        ${step.options
                            .map(
                                option => {

                                    const isSelected =
                                        selectedAnswers.includes(
                                            option
                                        );


                                    return `
                                        <button
                                            type="button"
                                            class="discovery-option ${
                                                isSelected
                                                    ? "is-selected"
                                                    : ""
                                            }"
                                            data-discovery-option="${this.escapeHTML(
                                                option
                                            )}"
                                            aria-pressed="${
                                                isSelected
                                                    ? "true"
                                                    : "false"
                                            }"
                                        >

                                            <span>
                                                ${this.escapeHTML(
                                                    option
                                                )}
                                            </span>


                                            ${
                                                step.type ===
                                                    "multiple"
                                                    ? `
                                                        <span
                                                            class="discovery-check"
                                                            aria-hidden="true"
                                                        >
                                                            ${
                                                                isSelected
                                                                    ? "✓"
                                                                    : ""
                                                            }
                                                        </span>
                                                      `
                                                    : ""
                                            }

                                        </button>
                                    `;

                                }
                            )
                            .join("")}

                    </div>


                    ${
                        step.type ===
                            "multiple"
                            ? `
                                <button
                                    type="button"
                                    class="discovery-continue"
                                    data-discovery-action="continue"
                                    ${
                                        this.hasAnswer(
                                            step
                                        )
                                            ? ""
                                            : "disabled"
                                    }
                                >
                                    Devam
                                </button>
                              `
                            : ""
                    }

                </main>

            </div>
        `;


        this.bindContainerEvents();


        return true;

    }


    bindContainerEvents(){

        if(!this.container){

            return false;

        }


        const screen =
            this.container.querySelector(
                ".discovery-screen"
            );


        if(!screen){

            return false;

        }


        screen.addEventListener(
            "click",
            event => {

                const optionButton =
                    event.target.closest(
                        "[data-discovery-option]"
                    );


                if(optionButton){

                    event.preventDefault();


                    this.selectOption(
                        optionButton.dataset
                            .discoveryOption
                    );


                    return;

                }


                const actionButton =
                    event.target.closest(
                        "[data-discovery-action]"
                    );


                if(!actionButton){

                    return;

                }


                event.preventDefault();


                const action =
                    actionButton.dataset
                        .discoveryAction;


                switch(action){

                    case "back":

                        this.goBack();

                        break;


                    case "continue":

                        this.continueJourney();

                        break;


                    case "enter":

                        this.enterEngine();

                        break;

                }

            }
        );


        return true;

    }

/* =====================================================
       SELECTION
    ===================================================== */

    selectOption(answer){

        if(
            this.isCompleting
        ){

            return false;

        }


        const step =
            this.steps[
                this.currentStep
            ];


        if(
            !step ||
            !step.options.includes(
                answer
            )
        ){

            return false;

        }


        if(
            step.type ===
                "multiple"
        ){

            const unknownStrength =
                "Henüz güçlü yönümü keşfediyorum";


            let selected =
                this.getSelectedAnswers(
                    step
                );


            if(
                step.id ===
                    "strength" &&
                answer ===
                    unknownStrength
            ){

                selected = [
                    unknownStrength
                ];

            }

            else {

                if(
                    step.id ===
                        "strength"
                ){

                    selected =
                        selected.filter(
                            item =>
                                item !==
                                    unknownStrength
                        );

                }


                if(
                    selected.includes(
                        answer
                    )
                ){

                    selected =
                        selected.filter(
                            item =>
                                item !==
                                    answer
                        );

                }

                else {

                    selected = [
                        ...selected,
                        answer
                    ];

                }

            }


            this.answers[
                step.id
            ] =
                selected;


            this.answers =
                this.sanitizeAnswers(
                    this.answers
                );


            this.saveDraft();


            this.refreshSelection(
                step,
                selected
            );


            return true;

        }


        this.answers[
            step.id
        ] =
            answer;


        this.answers =
            this.sanitizeAnswers(
                this.answers
            );


        this.saveDraft();


        this.advance();


        return true;

    }


    refreshSelection(
        step,
        selected
    ){

        if(
            !this.container ||
            !step
        ){

            return false;

        }


        const safeSelected =
            Array.isArray(
                selected
            )
                ? selected
                : [];


        this.container
            .querySelectorAll(
                "[data-discovery-option]"
            )
            .forEach(
                button => {

                    const isSelected =
                        safeSelected.includes(
                            button.dataset
                                .discoveryOption
                        );


                    button.classList.toggle(
                        "is-selected",
                        isSelected
                    );


                    button.setAttribute(
                        "aria-pressed",
                        String(
                            isSelected
                        )
                    );


                    const check =
                        button.querySelector(
                            ".discovery-check"
                        );


                    if(check){

                        check.textContent =
                            isSelected
                                ? "✓"
                                : "";

                    }

                }
            );


        const continueButton =
            this.container.querySelector(
                "[data-discovery-action='continue']"
            );


        if(continueButton){

            continueButton.disabled =
                !this.hasAnswer(
                    step
                );

        }


        return true;

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    continueJourney(){

        const step =
            this.steps[
                this.currentStep
            ];


        if(
            !step ||
            !this.hasAnswer(
                step
            )
        ){

            return false;

        }


        return this.advance();

    }


    advance(){

        if(
            this.isCompleting
        ){

            return false;

        }


        if(
            this.currentStep <
            this.steps.length -
                1
        ){

            this.currentStep +=
                1;


            this.saveDraft();


            return this.render(
                this.container
            );

        }


        return this.complete();

    }


    goBack(){

        if(
            this.isCompleting ||
            this.currentStep <=
                0
        ){

            return false;

        }


        this.currentStep -=
            1;


        this.saveDraft();


        return this.render(
            this.container
        );

    }


    /* =====================================================
       COMPLETION STORAGE
    ===================================================== */

    persistCompletion(
        result,
        completedAt
    ){

        try{

            localStorage.setItem(
                this.answersKey,
                JSON.stringify(
                    result.answers
                )
            );


            localStorage.setItem(
                this.resultKey,
                JSON.stringify(
                    result
                )
            );


            localStorage.setItem(
                this.completedKey,
                "true"
            );


            localStorage.setItem(
                this.welcomeCompletedKey,
                "true"
            );


            localStorage.setItem(
                this.completedAtKey,
                String(
                    completedAt
                )
            );


            return true;

        } catch(error){

            console.warn(
                "Discovery sonucu kaydedilemedi:",
                error
            );


            return false;

        }

    }


    /* =====================================================
       COMPLETE
    ===================================================== */

    complete(){

        if(
            this.isCompleting
        ){

            return false;

        }


        const finalStep =
            this.steps[
                this.steps.length -
                1
            ];


        if(
            !this.hasAnswer(
                finalStep
            )
        ){

            return false;

        }


        this.isCompleting =
            true;


        const completedAt =
            Date.now();


        this.answers =
            this.sanitizeAnswers(
                this.answers
            );


        const result =
            this.buildResult();


        const persisted =
            this.persistCompletion(
                result,
                completedAt
            );


        if(!persisted){

            this.isCompleting =
                false;


            return false;

        }


        this.clearDraft();


        try{

            this.recordJourney(
                completedAt,
                result
            );

        } catch(error){

            console.warn(
                "Discovery Evolution kaydı oluşturulamadı:",
                error
            );

        }


        try{

            this.applyDiscoveryToProfile(
                result
            );

        } catch(error){

            console.warn(
                "Discovery Profile senkronizasyonu yapılamadı:",
                error
            );

        }


        this.emitCompleted(
            result,
            completedAt
        );


        this.renderCompletion(
            result
        );


        this.isCompleting =
            false;


        return true;

    }


    /* =====================================================
       EVOLUTION
    ===================================================== */

    getEvolutionEvents(
        evolution,
        entity
    ){

        if(!evolution){

            return [];

        }


        try{

            if(
                entity?.id &&
                typeof evolution.forEntity ===
                    "function"
            ){

                const result =
                    evolution.forEntity(
                        entity.id,
                        {
                            includeArchived:
                                true
                        }
                    );


                if(
                    Array.isArray(
                        result
                    )
                ){

                    return result;

                }

            }

        } catch(error){

            /* fallback */

        }


        try{

            if(
                typeof evolution.all ===
                    "function"
            ){

                const result =
                    evolution.all({
                        includeArchived:
                            true
                    });


                return Array.isArray(
                    result
                )
                    ? result
                    : [];

            }

        } catch(error){

            /* fallback */

        }


        return Array.isArray(
            evolution.history
        )
            ? evolution.history
            : [];

    }


    findExistingJourneyEvent(
        evolution,
        entity
    ){

        const events =
            this.getEvolutionEvents(
                evolution,
                entity
            );


        const entityId =
            entity?.id
                ? String(
                    entity.id
                )
                : null;


        return (
            events.find(
                event => {

                    if(
                        !event ||
                        event.source !==
                            "discovery" ||
                        event.title !==
                            "Discovery Journey tamamlandı"
                    ){

                        return false;

                    }


                    if(
                        entityId &&
                        event.relatedEntityId
                    ){

                        return (
                            String(
                                event.relatedEntityId
                            ) ===
                            entityId
                        );

                    }


                    return !entityId;

                }
            ) ||
            null
        );

    }


    recordJourney(
        completedAt,
        result
    ){

        let evolution =
            this.getService(
                "evolution"
            );


        if(!evolution){

            try{

                if(
                    typeof Evolution !==
                        "undefined"
                ){

                    evolution =
                        Evolution;

                }

            } catch(error){

                evolution =
                    null;

            }

        }


        if(
            !evolution ||
            typeof evolution.record !==
                "function"
        ){

            return null;

        }


        const entity =
            this.getCurrentEntity();


        const engine =
            this.getEngine();


        const existing =
            this.findExistingJourneyEvent(
                evolution,
                entity
            );


        const payload = {

            title:
                "Discovery Journey tamamlandı",

            description:
                "Kullanıcının ilk Discovery Journey profili oluşturuldu.",

            status:
                "completed",

            importance:
                "high",

            source:
                "discovery",

            tags:[
                "discovery",
                "onboarding",
                "ilk-yolculuk"
            ],

            effects:{
                awareness:
                    8,

                experience:
                    6,

                connectionReadiness:
                    5
            },

            xp:
                15,

            organs:[
                "identity",
                "profile",
                "memory",
                "timeline",
                "bridge",
                "brain",
                "evolution"
            ],

            discoveryAnswers:{
                ...result.answers
            },

            discoveryResult:{
                ...result
            },

            primaryDirection:
                result.primaryDirection
                    ?.id ||
                null,

            brainMode:
                result.signals
                    ?.brainMode ||
                "balanced",

            recommendedApps:[
                ...(
                    result.signals
                        ?.recommendedApps ||
                    []
                )
            ],

            relatedEntityId:
                entity?.id ||
                null,

            relatedWorldId:
                engine?.currentWorld
                    ?.id ||
                null,

            journeyVersion:
                3,

            occurredAt:
                completedAt

        };


        if(
            existing &&
            typeof evolution.update ===
                "function"
        ){

            try{

                return evolution.update(
                    existing.id,
                    payload
                );

            } catch(error){

                console.warn(
                    "Discovery milestone güncellenemedi:",
                    error
                );

            }

        }


        return evolution.record(
            "milestone",
            payload.description,
            payload
        );

    }


    /* =====================================================
       PROFILE SYNC
    ===================================================== */

    applyDiscoveryToProfile(result){

        const entity =
            this.getCurrentEntity();


        if(!entity){

            return false;

        }


        const profile =
            this.getService(
                "profile"
            );


        if(
            !profile ||
            typeof profile.update !==
                "function"
        ){

            return false;

        }


        const answers =
            result.answers ||
            {};


        let currentProfile =
            null;


        try{

            if(
                typeof profile.get ===
                    "function"
            ){

                currentProfile =
                    profile.get(
                        entity
                    ) ||
                    null;

            }

        } catch(error){

            currentProfile =
                null;

        }


        currentProfile =
            currentProfile ||
            entity.profile ||
            null;


        if(!currentProfile){

            return false;

        }


        const existingInterests =
            Array.isArray(
                currentProfile.interests
            )
                ? currentProfile.interests
                : [];


        const discoveryInterests =
            Array.isArray(
                answers.interest
            )
                ? answers.interest
                : [];


        const interests =
            [
                ...new Set([
                    ...existingInterests,
                    ...discoveryInterests
                ])
            ];


        const changes = {

            interests,

            metadata:{
                ...(
                    currentProfile.metadata ||
                    {}
                ),

                discovery:{
                    purpose:
                        answers.purpose ||
                        null,

                    goal:
                        answers.goal ||
                        null,

                    connection:
                        Array.isArray(
                            answers.connection
                        )
                            ? [
                                ...answers.connection
                            ]
                            : [],

                    guidance:
                        answers.guidance ||
                        null,

                    primaryDirection:
                        result.primaryDirection
                            ?.id ||
                        null,

                    brainMode:
                        result.signals
                            ?.brainMode ||
                        "balanced",

                    updatedAt:
                        Date.now()
                }
            }

        };


        try{

            const updated =
                profile.update(
                    currentProfile,
                    changes
                );


            return updated !==
                false;

        } catch(error){

            console.warn(
                "Discovery Profile güncellemesi başarısız:",
                error
            );


            return false;

        }

    }


    /* =====================================================
       COMPLETION EVENT
    ===================================================== */

    emitCompleted(
        result,
        completedAt
    ){

        const payload = {

            answers:{
                ...result.answers
            },

            result,

            completedAt

        };


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    "discovery:completed",
                    payload
                );

            }

        } catch(error){

            /* non-fatal */

        }


        try{

            this.getService(
                "events"
            )?.emit?.(
                "discovery:completed",
                payload
            );

        } catch(error){

            /* non-fatal */

        }


        return true;

    }


    /* =====================================================
       COMPLETION UI
    ===================================================== */

    renderCompletion(result){

        if(!this.container){

            return false;

        }


        const direction =
            result.primaryDirection ||
            {};


        const actions =
            Array.isArray(
                result.startingActions
            )
                ? result.startingActions
                : [];


        this.container.innerHTML = `
            <div class="discovery-screen">

                <main
                    class="
                        discovery-content
                        discovery-completion
                    "
                >

                    <div
                        class="discovery-completion-mark"
                        aria-hidden="true"
                    >
                        ✓
                    </div>


                    <p class="discovery-completion-label">
                        KEŞİF TAMAMLANDI
                    </p>


                    <h1>
                        ${this.escapeHTML(
                            direction.label ||
                            "Yolculuğun hazır."
                        )}
                    </h1>


                    <p class="discovery-description">
                        ${this.escapeHTML(
                            direction.description ||
                            "VAERO ilk yönünü, ilgi alanlarını ve bağlantı beklentilerini öğrendi."
                        )}
                    </p>


                    ${
                        actions.length
                            ? `
                                <div class="discovery-starting-actions">

                                    ${actions
                                        .map(
                                            (
                                                action,
                                                index
                                            ) => `
                                                <div class="discovery-starting-action">

                                                    <span>
                                                        ${String(
                                                            index +
                                                            1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                    </span>


                                                    <div>

                                                        <strong>
                                                            ${this.escapeHTML(
                                                                action.title ||
                                                                ""
                                                            )}
                                                        </strong>


                                                        <small>
                                                            ${this.escapeHTML(
                                                                action.description ||
                                                                ""
                                                            )}
                                                        </small>

                                                    </div>

                                                </div>
                                            `
                                        )
                                        .join("")}

                                </div>
                              `
                            : ""
                    }


                    <div class="discovery-result-meta">

                        <span>

                            Brain

                            <strong>
                                ${this.escapeHTML(
                                    this.getBrainModeLabel(
                                        result.signals
                                            ?.brainMode
                                    )
                                )}
                            </strong>

                        </span>


                        <span>

                            Başlangıç

                            <strong>
                                ${
                                    Array.isArray(
                                        result.signals
                                            ?.recommendedApps
                                    )
                                        ? result.signals
                                            .recommendedApps
                                            .length
                                        : 0
                                } uygulama
                            </strong>

                        </span>

                    </div>


                    <button
                        type="button"
                        class="discovery-enter"
                        data-discovery-action="enter"
                    >
                        VAERO’ya Gir
                    </button>

                </main>

            </div>
        `;


        this.bindContainerEvents();


        return true;

    }


    getBrainModeLabel(mode){

        const labels = {

            direction:
                "Yön",

            evolution:
                "Gelişim",

            connections:
                "Eşleşme",

            opportunities:
                "Fırsat",

            balanced:
                "Dengeli"

        };


        return (
            labels[
                mode
            ] ||
            "Dengeli"
        );

    }


    /* =====================================================
       ENTER ENGINE
    ===================================================== */

    enterEngine(){

        if(!this.container){

            return false;

        }


        const screen =
            this.container.querySelector(
                ".discovery-screen"
            );


        screen?.classList.add(
            "is-leaving"
        );


        let transitionLayer =
            null;


        if(screen){

            try{

                transitionLayer =
                    screen.cloneNode(
                        true
                    );


                transitionLayer
                    .classList
                    .add(
                        "discovery-transition-layer"
                    );


                transitionLayer.setAttribute(
                    "aria-hidden",
                    "true"
                );


                document.body.appendChild(
                    transitionLayer
                );

            } catch(error){

                transitionLayer =
                    null;

            }

        }


        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.start !==
                "function"
        ){

            transitionLayer
                ?.remove();


            screen?.classList.remove(
                "is-leaving"
            );


            console.error(
                "Engine.start kullanılamıyor."
            );


            return false;

        }


        try{

    engine.start();


    /*
     * Discovery ilk girişte çalışıyorsa start()
     * Engine'i normal şekilde başlatır.
     *
     * Discovery zaten çalışan Engine içinden
     * açılmışsa start() yeniden başlatmaz.
     * Bu durumda mevcut Engine görünümünü
     * tekrar mount ederek boş ekranı önleriz.
     */

    const entity =
        engine.currentOpenedEntity ||
        engine.currentEntity ||
        engine.rootEntity ||
        null;


    if(
        entity &&
        typeof engine.mount ===
            "function"
    ){

        engine.mount(
            entity
        );

    }

} catch(error){

    console.error(
        "Engine başlatılamadı:",
        error
    );


    transitionLayer
        ?.remove();


    screen?.classList.remove(
        "is-leaving"
    );


    return false;

}


        window.setTimeout(
            () => {

                document.body
                    .classList
                    .remove(
                        "discovery-active"
                    );


                transitionLayer
                    ?.remove();

            },
            450
        );


        return true;

    }


    /* =====================================================
       RESULT API
    ===================================================== */

    getResult(){

        try{

            const saved =
                localStorage.getItem(
                    this.resultKey
                );


            if(!saved){

                return null;

            }


            const parsed =
                JSON.parse(
                    saved
                );


            if(
                !parsed ||
                typeof parsed !==
                    "object" ||
                Array.isArray(
                    parsed
                )
            ){

                return null;

            }


            return parsed;

        } catch(error){

            return null;

        }

    }


    isCompleted(){

        try{

            return (
                localStorage.getItem(
                    this.completedKey
                ) ===
                "true"
            );

        } catch(error){

            return false;

        }

    }


    getCompletedAt(){

    try{

        const stored =
            localStorage.getItem(
                this.completedAtKey
            );


        if(!stored){

            return null;

        }


        const value =
            Number(
                stored
            );


        return (
            Number.isFinite(
                value
            ) &&
            value > 0
        )
            ? value
            : null;

    } catch(error){

        return null;

    }

}

    /* =====================================================
       RESTART
    ===================================================== */

    restart(){

        this.currentStep =
            0;


        this.answers =
            {};


        this.isCompleting =
            false;


        try{

            localStorage.removeItem(
                this.completedKey
            );


            localStorage.removeItem(
                this.completedAtKey
            );


            localStorage.removeItem(
                this.answersKey
            );


            localStorage.removeItem(
                this.resultKey
            );


            localStorage.removeItem(
                this.welcomeCompletedKey
            );

        } catch(error){

            /* continue */

        }


        this.saveDraft();


        if(this.container){

            this.render(
                this.container
            );

        }


        return true;

    }

}


/* =========================================================
   INSTANCE
========================================================= */

window.DiscoveryApp =
    new DiscoveryApp();


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
            "discoveryApp",
            window.DiscoveryApp
        );

    }

} catch(error){

    /* global instance remains available */

}
