/* =========================================================
   VAERO PROFILE APP
   Identity + Discovery Profile
========================================================= */

const ProfileApp = {

    /* =====================================================
       HTML SAFETY
    ===================================================== */

    escapeHTML(value){

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

    },


    /* =====================================================
       DISCOVERY DATA
    ===================================================== */

    getDiscoveryAnswers(){

        try{

            if(
                typeof Evolution !==
                    "undefined" &&
                Array.isArray(
                    Evolution.history
                )
            ){

                const event =
                    Evolution.history.find(
                        item =>
                            item &&
                            item.source ===
                                "discovery" &&
                            item.payload &&
                            item.payload
                                .discoveryAnswers
                    );


                if(event){

                    return {
                        ...event.payload
                            .discoveryAnswers
                    };

                }

            }


            const saved =
                localStorage.getItem(
                    "vaero:discovery:answers"
                );


            if(!saved){
                return {};
            }


            const parsed =
                JSON.parse(
                    saved
                );


            return (
                parsed &&
                typeof parsed ===
                    "object" &&
                !Array.isArray(
                    parsed
                )
            )
                ? parsed
                : {};


        } catch(error){

            console.warn(
                "Discovery profili okunamadı:",
                error
            );

            return {};

        }

    },


    /* =====================================================
       DISCOVERY FORMAT
    ===================================================== */

    formatDiscoveryAnswer(answer){

        if(
            Array.isArray(answer)
        ){

            const cleanAnswers =
                answer
                    .filter(Boolean)
                    .map(
                        item =>
                            this.escapeHTML(
                                item
                            )
                    );


            return cleanAnswers.length
                ? cleanAnswers.join(
                    " · "
                )
                : "Henüz belirlenmedi";

        }


        if(
            answer === null ||
            answer === undefined ||
            answer === ""
        ){

            return "Henüz belirlenmedi";

        }


        return this.escapeHTML(
            answer
        );

    },


    /* =====================================================
       DISCOVERY PROFILE
    ===================================================== */

    renderDiscoveryProfile(){

        const answers =
            this.getDiscoveryAnswers();


        if(
            !answers ||
            Object.keys(
                answers
            ).length === 0
        ){

            return "";

        }


        const rows = [

            {
                label:"Geliş amacı",
                value:
                    answers.purpose
            },

            {
                label:"İlgi alanları",
                value:
                    answers.interest
            },

            {
                label:"Güçlü yönler",
                value:
                    answers.strength
            },

            {
                label:"Şu anki hedef",
                value:
                    answers.goal
            },

            {
                label:"Aradığı bağlantılar",
                value:
                    answers.connection
            },

            {
                label:"VAERO tercihi",
                value:
                    answers.guidance
            }

        ];


        return `

            <div
                class="
                    card
                    discovery-profile-card
                "
                style="
                    margin-top:10px;
                    padding:14px;
                "
            >

                <div class="eyebrow">
                    KEŞİF PROFİLİ
                </div>


                <p
                    style="
                        margin:0 0 10px;
                        opacity:.58;
                        font-size:9px;
                        line-height:1.4;
                    "
                >
                    İlk Discovery Journey sırasında
                    oluşan yön ve eşleşme sinyalleri.
                </p>


                <div
                    style="
                        display:grid;
                        grid-template-columns:
                            repeat(
                                2,
                                minmax(0,1fr)
                            );
                        gap:6px;
                    "
                >

                    ${rows
                        .map(
                            row => `

                                <div
                                    style="
                                        min-width:0;
                                        padding:8px 9px;
                                        border:
                                            1px solid
                                            rgba(
                                                255,
                                                255,
                                                255,
                                                .05
                                            );
                                        border-radius:10px;
                                        background:
                                            rgba(
                                                255,
                                                255,
                                                255,
                                                .018
                                            );
                                    "
                                >

                                    <span
                                        class="
                                            discovery-profile-label
                                        "
                                        style="
                                            display:block;
                                            margin-bottom:3px;
                                            font-size:7px;
                                        "
                                    >
                                        ${this.escapeHTML(
                                            row.label
                                        )}
                                    </span>


                                    <strong
                                        class="
                                            discovery-profile-value
                                        "
                                        style="
                                            display:block;
                                            overflow:hidden;
                                            font-size:8px;
                                            line-height:1.35;
                                            text-overflow:ellipsis;
                                        "
                                    >
                                        ${this.formatDiscoveryAnswer(
                                            row.value
                                        )}
                                    </strong>

                                </div>

                            `
                        )
                        .join("")}

                </div>

            </div>

        `;

    },


    /* =====================================================
       PROFILE INFO
    ===================================================== */

    renderProfileInfo(entity){

        return `

            <div
                class="card"
                style="
                    margin-top:10px;
                    padding:14px;
                "
            >

                <div class="eyebrow">
                    PROFİL BİLGİLERİ
                </div>


                ${UI.infoRow(
                    "İsim",
                    this.escapeHTML(
                        entity.name
                    )
                )}


                <hr
                    style="
                        margin:7px 0;
                        border:0;
                        border-top:
                            1px solid
                            rgba(
                                255,
                                255,
                                255,
                                .06
                            );
                    "
                >


                ${UI.infoRow(
                    "Tür",
                    this.escapeHTML(
                        entity.type
                    )
                )}


                <hr
                    style="
                        margin:7px 0;
                        border:0;
                        border-top:
                            1px solid
                            rgba(
                                255,
                                255,
                                255,
                                .06
                            );
                    "
                >


                ${UI.infoRow(
                    "Kimlik",
                    this.escapeHTML(
                        entity.id
                    )
                )}

            </div>

        `;

    },


    /* =====================================================
       STATS
    ===================================================== */

    renderStats(){

        return `

            <div
                class="grid grid-2"
                style="
                    margin-top:10px;
                    gap:7px;
                "
            >

                ${UI.statsCard(
                    "TAKİPÇİ",
                    "0"
                )}

                ${UI.statsCard(
                    "TAKİP EDİLEN",
                    "0"
                )}

                ${UI.statsCard(
                    "SEVİYE",
                    "1"
                )}

                ${UI.statsCard(
                    "XP",
                    "0 XP"
                )}

            </div>

        `;

    },


    /* =====================================================
       BRAIN AWARENESS
    ===================================================== */

    enterBrainContext(){

        try{

            const brainAwareness =
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.get ===
                    "function"
                    ? VAERO.get(
                        "brainAwareness"
                    )
                    : null;


            if(
                brainAwareness &&
                typeof brainAwareness.enter ===
                    "function"
            ){

                brainAwareness.enter(
                    "profile"
                );

            }

        } catch(error){

            console.warn(
                "Profile Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(entity){

        if(!entity){

            return `

                <div class="section">

                    <div
                        class="engine-error-state"
                    >

                        <h1>
                            Profil bulunamadı.
                        </h1>

                        <p>
                            Bu varlığın profil bilgileri
                            şu anda kullanılamıyor.
                        </p>

                    </div>

                </div>

            `;

        }


        this.enterBrainContext();


        const safeName =
            this.escapeHTML(
                entity.name ||
                "İsimsiz Varlık"
            );


        return `

            <div
                class="section"
                style="
                    margin:0;
                    padding:16px;
                    overflow:hidden;
                "
            >


                ${UI.appHeader(
                    safeName,
                    "PROFILE APP",
                    "👤"
                )}


                ${UI.appCard(
                    "HAKKINDA",
                    "Bu varlık VAERO Evreni içinde oluşturulmuş dijital bir profildir."
                )}


                <div
                    style="
                        display:grid;
                        grid-template-columns:
                            minmax(0,.9fr)
                            minmax(0,1.1fr);
                        gap:10px;
                        align-items:start;
                    "
                >

                    <div>

                        ${this.renderProfileInfo(
                            entity
                        )}

                        ${this.renderStats()}

                    </div>


                    <div>

                        ${this.renderDiscoveryProfile()}

                    </div>

                </div>


                ${UI.brainPanel()}


            </div>

        `;

    }

};


window.ProfileApp =
    ProfileApp;
