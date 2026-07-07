const BrainSkills = {

    skills: {},

    register(name, handler){
        this.skills[name] = handler;
    },

    async run(name, payload = {}){

        const skill = this.skills[name];

        if(!skill){
            return {
                success:false,
                message:"Skill bulunamadı."
            };
        }

        return await skill(payload);

    }

};

VAERO.register("brainSkills", BrainSkills);
window.BrainSkills = BrainSkills;
