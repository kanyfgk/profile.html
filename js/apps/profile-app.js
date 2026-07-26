const ProfileApp = {

    getDiscoveryAnswers(){

        try {

            if(
                typeof Evolution !== "undefined"
            ){

                const event =
                    Evolution.history.find(item =>
                        item.source === "discovery" &&
                        item.payload &&
                        item.payload.discoveryAnswers
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
                JSON.parse(saved);

            return (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            )
                ? parsed
                : {};

        } catch(error) {

            console.warn(
                "Discovery profili okunamadı:",
                error
            );

            return {};

        }

    },

    formatDiscoveryAnswer(answer){

        if(Array.isArray(answer)){
            return answer.join(" · ");
        }

        return String(
            answer || "Henüz belirlenmedi"
        );

    },

    renderDiscoveryProfile(){

        const answers =
            this.getDiscoveryAnswers();

        if(
            !answers ||
            Object.keys(answers).length === 0
        ){
            return "";
        }

        const rows = [
            {
                label: "Geliş amacı",
                value: answers.purpose
            },
            {
                label: "İlgi alanları",
                value: answers.interest
            },
            {
                label: "Güçlü yönler",
                value: answers.strength
            },
            {
                label: "Şu anki hedef",
                value: answers.goal
            },
            {
                label: "Aradığı bağlantılar",
                value: answers.connection
            },
            {
                label: "VAERO tercihi",
                value: answers.guidance
            }
        ];

        return `
            <div
                class="card discovery-profile-card"
                style="
                    margin-top:${Theme.spacing.md}px;
                    ${Theme.card}
                "
            >
                <div class="eyebrow">
                    KEŞİF PROFİLİ
                </div>

                <p
                    style="
                        margin:10px 0 20px;
                        opacity:.68;
                        line-height:1.55;
                    "
                >
                    İlk Discovery Journey sırasında
                    belirlenen yön ve eşleşme sinyalleri.
                </p>

                ${rows.map((row, index) => `
                    <div class="discovery-profile-row">

                        <span class="discovery-profile-label">
                            ${row.label}
                        </span>

                        <strong class="discovery-profile-value">
                            ${this.formatDiscoveryAnswer(
                                row.value
                            )}
                        </strong>

                    </div>

                    ${
                        index < rows.length - 1
                            ? `
                                <hr
                                    style="
                                        opacity:.1;
                                        margin:15px 0;
                                    "
                                >
                              `
                            : ""
                    }
                `).join("")}

            </div>
        `;

    },

    render(entity){

        VAERO
            .get("brainAwareness")
            .enter("profile");

        return `
            <div
                class="section"
                style="
                    margin-top:24px;
                    padding:24px;
                "
            >

                ${UI.appHeader(
                    entity.name,
                    "PROFILE APP",
                    "👤"
                )}

                ${UI.appCard(
                    "HAKKINDA",
                    "Bu varlık VAERO Evreni içinde oluşturulmuş dijital bir profildir."
                )}

                <div
                    class="card"
                    style="
                        margin-top:${Theme.spacing.md}px;
                        ${Theme.card}
                    "
                >
                    <div class="eyebrow">
                        PROFİL BİLGİLERİ
                    </div>

                    ${UI.infoRow(
                        "İsim",
                        entity.name
                    )}

                    <hr style="opacity:.12;">

                    ${UI.infoRow(
                        "Tür",
                        entity.type
                    )}

                    <hr style="opacity:.12;">

                    ${UI.infoRow(
                        "Kimlik",
                        entity.id
                    )}
                </div>

                ${this.renderDiscoveryProfile()}

                <div
                    class="grid grid-2"
                    style="
                        margin-top:${Theme.spacing.md}px;
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

                ${UI.brainPanel()}

            </div>
        `;

    }

};
