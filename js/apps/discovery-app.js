/* =========================================================
   VAERO DISCOVERY APP
   Identity / Focus / Direction Journey
========================================================= */

class DiscoveryApp {

    constructor(){

        this.storageKey =
            "vaero:discovery:draft:v2";

        this.completedKey =
            "vaero:discovery:completed";

        this.answersKey =
            "vaero:discovery:answers";

        this.completedAtKey =
            "vaero:discovery:completedAt";

        this.container = null;

        this.isEnteringEngine = false;


        /* =================================================
           STEPS
        ================================================= */

        this.steps = [

            {
                id:"purpose",
                type:"single",

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
                id:"interest",
                type:"multiple",

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
                id:"strength",
                type:"multiple",

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
                id:"goal",
                type:"single",

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
                id:"connection",
                type:"multiple",

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
                id:"guidance",
                type:"single",

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


        /* =================================================
           RESTORE DRAFT
        ================================================= */

        const draft =
            this.loadDraft();

        this.currentStep =
            draft.currentStep;

        this.answers =
            draft.answers;

        this.normalizeCurrentStep();

    }


    /* =====================================================
       COMPLETION STATE
    ===================================================== */

    hasCompleted(){

        return (
            localStorage.getItem(
                this.completedKey
            ) === "true"
        );

    }


    /* =====================================================
       DRAFT
    ===================================================== */

    loadDraft(){

        try{

            const saved =
                localStorage.getItem(
                    this.storageKey
                );

            if(!saved){

                return {
                    currentStep:0,
                    answers:{}
                };

            }

            const parsed =
                JSON.parse(
                    saved
                );

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
                currentStep:0,
                answers:{}
            };

        }

    }


    saveDraft(){

        try{

            localStorage.setItem(
                this.storageKey,
                JSON.stringify({
                    currentStep:
                        this.currentStep,

                    answers:
                        this.answers
                })
            );

        } catch(error){

            console.warn(
                "Discovery taslağı kaydedilemedi:",
                error
            );

        }

    }


    normalizeCurrentStep(){

        if(
            !Number.isInteger(
                this.currentStep
            ) ||
            this.currentStep < 0 ||
            this.currentStep >=
                this.steps.length
        ){

            this.currentStep = 0;

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

            return Array.isArray(answer)
                ? answer
                : [];

        }

        return (
            typeof answer ===
                "string" &&
            answer.length > 0
        )
            ? [answer]
            : [];

    }


    hasAnswer(step){

        return (
            this
                .getSelectedAnswers(
                    step
                )
                .length > 0
        );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    render(container){

        if(!container){
            return;
        }

        this.container =
            container;

        this.isEnteringEngine =
            false;

        document.body.classList.add(
            "discovery-active"
        );


        /*
         * If Discovery has already been completed and
         * something explicitly calls render(), show the
         * completion gateway rather than starting the
         * questionnaire again.
         */

        if(this.hasCompleted()){

            this.renderCompletion();

            return;

        }


        this.normalizeCurrentStep();


        const step =
            this.steps[
                this.currentStep
            ];

        const selectedAnswers =
            this.getSelectedAnswers(
                step
            );

        const progress =
            (
                (
                    this.currentStep +
                    1
                ) /
                this.steps.length
            ) * 100;


        container.innerHTML = `

            <div class="discovery-screen">

                <main class="discovery-content">


                    <!-- NAVIGATION -->

                    <div class="discovery-navigation">

                        ${
                            this.currentStep > 0
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


                    <!-- PROGRESS -->

                    <div
                        class="discovery-progress"
                        aria-hidden="true"
                    >
                        <span
                            style="width:${progress}%"
                        ></span>
                    </div>


                    <!-- HEADER -->

                    <header class="discovery-header">

                        <h1>
                            ${step.title}
                        </h1>

                        <p class="discovery-description">
                            ${step.description}
                        </p>

                    </header>


                    <!-- OPTIONS -->

                    <div class="discovery-options">

                        ${step.options
                            .map(
                                option => {

                                    const isSelected =
                                        selectedAnswers
                                            .includes(
                                                option
                                            );

                                    return `

                                        <button
                                            type="button"
                                            class="
                                                discovery-option
                                                ${
                                                    isSelected
                                                        ? "is-selected"
                                                        : ""
                                                }
                                            "
                                            data-discovery-option="${option}"
                                            aria-pressed="${isSelected}"
                                        >

                                            <span>
                                                ${option}
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


        this.bindScreenEvents();

    }


    /* =====================================================
       SCREEN EVENTS
    ===================================================== */

    bindScreenEvents(){

        if(!this.container){
            return;
        }

        const screen =
            this.container.querySelector(
                ".discovery-screen"
            );

        if(!screen){
            return;
        }


        screen.addEventListener(
            "click",
            event => {


                /* OPTION */

                const optionButton =
                    event.target.closest(
                        "[data-discovery-option]"
                    );

                if(optionButton){

                    this.selectOption(
                        optionButton.dataset
                            .discoveryOption
                    );

                    return;

                }


                /* ACTION */

                const actionButton =
                    event.target.closest(
                        "[data-discovery-action]"
                    );

                if(!actionButton){
                    return;
                }


                const action =
                    actionButton.dataset
                        .discoveryAction;


                if(action === "back"){

                    this.goBack();

                    return;

                }


                if(
                    action ===
                    "continue"
                ){

                    this.continueJourney();

                    return;

                }


                if(action === "enter"){

                    this.enterEngine();

                }

            }
        );

    }


    /* =====================================================
       OPTION SELECTION
    ===================================================== */

    selectOption(answer){

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
            return;
        }


        /* =================================================
           MULTIPLE
        ================================================= */

        if(
            step.type ===
            "multiple"
        ){

            const discoveryStrengthOption =
                "Henüz güçlü yönümü keşfediyorum";

            let selected =
                this.getSelectedAnswers(
                    step
                );


            /*
             * The "still discovering" strength option
             * remains exclusive from all concrete
             * strengths.
             */

            if(
                step.id === "strength" &&
                answer ===
                    discoveryStrengthOption
            ){

                selected = [
                    discoveryStrengthOption
                ];

            } else {


                if(
                    step.id ===
                    "strength"
                ){

                    selected =
                        selected.filter(
                            item =>
                                item !==
                                discoveryStrengthOption
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

                } else {

                    selected = [
                        ...selected,
                        answer
                    ];

                }

            }


            this.answers[
                step.id
            ] = selected;

            this.saveDraft();

            this.updateCurrentSelectionUI(
                selected
            );

            return;

        }


        /* =================================================
           SINGLE
        ================================================= */

        this.answers[
            step.id
        ] = answer;

        this.saveDraft();

        this.advance();

    }


    /* =====================================================
       SELECTION UI
    ===================================================== */

    updateCurrentSelectionUI(
        selected
    ){

        if(!this.container){
            return;
        }


        this.container
            .querySelectorAll(
                "[data-discovery-option]"
            )
            .forEach(
                button => {

                    const option =
                        button.dataset
                            .discoveryOption;

                    const isSelected =
                        selected.includes(
                            option
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
                selected.length === 0;

        }

    }


    /* =====================================================
       CONTINUE
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
            return;
        }

        this.advance();

    }


    /* =====================================================
       ADVANCE
    ===================================================== */

    advance(){

        if(
            this.currentStep <
            this.steps.length - 1
        ){

            this.currentStep +=
                1;

            this.saveDraft();

            this.render(
                this.container
            );

            return;

        }

        this.complete();

    }


    /* =====================================================
       BACK
    ===================================================== */

    goBack(){

        if(
            this.currentStep <= 0
        ){
            return;
        }

        this.currentStep -=
            1;

        this.saveDraft();

        this.render(
            this.container
        );

    }


    /* =====================================================
       COMPLETE
    ===================================================== */

    complete(){

        const completedAt =
            Date.now();


        localStorage.setItem(
            this.answersKey,
            JSON.stringify(
                this.answers
            )
        );


        localStorage.setItem(
            this.completedKey,
            "true"
        );


        localStorage.setItem(
            "vaero:welcome:completed:v2",
            "true"
        );


        localStorage.setItem(
            this.completedAtKey,
            String(
                completedAt
            )
        );


        localStorage.removeItem(
            this.storageKey
        );


        this.recordJourney(
            completedAt
        );


        this.renderCompletion();

    }


    /* =====================================================
       EVOLUTION RECORD
    ===================================================== */

    recordJourney(
        completedAt
    ){

        if(
            typeof Evolution ===
                "undefined" ||
            typeof Evolution.record !==
                "function"
        ){
            return;
        }


        const history =
            Array.isArray(
                Evolution.history
            )
                ? Evolution.history
                : [];


        const existingEvent =
            history.find(
                event =>
                    event &&
                    event.source ===
                        "discovery" &&
                    event.title ===
                        "Discovery Journey tamamlandı"
            );


        if(existingEvent){

            existingEvent.payload = {

                ...(
                    existingEvent.payload ||
                    {}
                ),

                discoveryAnswers:{
                    ...this.answers
                },

                journeyVersion:2

            };


            existingEvent.updatedAt =
                completedAt;


            if(
                typeof Evolution.save ===
                "function"
            ){

                Evolution.save();

            }

            return;

        }


        const event =
            Evolution.record(

                "milestone",

                "Kullanıcı ilk keşif yolculuğunu tamamladı.",

                {

                    title:
                        "Discovery Journey tamamlandı",

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
                        awareness:8,
                        experience:6,
                        connectionReadiness:5
                    },

                    xp:15,

                    organs:[
                        "identity",
                        "profile",
                        "memory",
                        "timeline",
                        "bridge",
                        "brain"
                    ],

                    discoveryAnswers:{
                        ...this.answers
                    },

                    journeyVersion:2,

                    occurredAt:
                        completedAt

                }

            );


        if(
            event &&
            typeof Evolution
                .publishLifeEvent ===
                "function"
        ){

            Evolution.publishLifeEvent(
                event
            );

        }

    }


    /* =====================================================
       COMPLETION SCREEN
    ===================================================== */

    renderCompletion(){

        if(!this.container){
            return;
        }


        document.body.classList.add(
            "discovery-active"
        );


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
                        Yolculuğun hazır.
                    </h1>


                    <p class="discovery-description">

                        VAERO ilk yönünü,
                        ilgi alanlarını ve
                        bağlantı beklentilerini öğrendi.

                        Sistem bundan sonra
                        seninle birlikte gelişecek.

                    </p>


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


        this.bindScreenEvents();

    }


    /* =====================================================
       ENTER ENGINE
    ===================================================== */

    enterEngine(){

        if(
            this.isEnteringEngine
        ){
            return;
        }


        if(
            !this.container
        ){
            return;
        }


        this.isEnteringEngine =
            true;


        const discoveryScreen =
            this.container.querySelector(
                ".discovery-screen"
            );


        /*
         * Engine.start() can replace the contents of
         * #engine immediately. Therefore the visual
         * transition lives temporarily outside #engine.
         */

        let transitionLayer =
            null;


        if(discoveryScreen){

            transitionLayer =
                discoveryScreen.cloneNode(
                    true
                );


            transitionLayer.classList.add(
                "discovery-transition-layer"
            );


            transitionLayer
                .querySelectorAll(
                    "button"
                )
                .forEach(
                    button => {

                        button.disabled =
                            true;

                    }
                );


            document.body.appendChild(
                transitionLayer
            );

        }


        /*
         * Start Engine underneath the transition
         * layer.
         */

        if(
            window.Engine &&
            typeof window.Engine.start ===
                "function"
        ){

            window.Engine.start();

        } else {

            console.error(
                "VAERO Engine başlatılamadı."
            );

            this.isEnteringEngine =
                false;

            if(transitionLayer){
                transitionLayer.remove();
            }

            return;

        }


        /*
         * Start fade only after the Engine has been
         * rendered underneath.
         */

        if(transitionLayer){

            window.requestAnimationFrame(
                () => {

                    window.requestAnimationFrame(
                        () => {

                            transitionLayer
                                .classList
                                .add(
                                    "is-leaving"
                                );

                        }
                    );

                }
            );

        }


        window.setTimeout(
            () => {

                document.body
                    .classList
                    .remove(
                        "discovery-active"
                    );


                if(transitionLayer){

                    transitionLayer.remove();

                }


                this.isEnteringEngine =
                    false;

            },
            450
        );

    }


    /* =====================================================
       RESET
    ===================================================== */

    reset(){

        localStorage.removeItem(
            this.storageKey
        );

        localStorage.removeItem(
            this.completedKey
        );

        localStorage.removeItem(
            this.answersKey
        );

        localStorage.removeItem(
            this.completedAtKey
        );


        this.currentStep =
            0;

        this.answers =
            {};

        this.isEnteringEngine =
            false;

    }

}


/* =========================================================
   GLOBAL INSTANCE
========================================================= */

window.DiscoveryApp =
    new DiscoveryApp();
