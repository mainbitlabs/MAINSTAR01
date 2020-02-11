const config = require('../config');
// const azurest = require('azure-storage');
// const tableSvc = azurest.createTableService(config.storageA, config.accessK);
const { ComponentDialog, WaterfallDialog, ChoicePrompt, ChoiceFactory, TextPrompt,AttachmentPrompt } = require('botbuilder-dialogs');


const CHECKIN_DIALOG = "CHECKIN_DIALOG";
const CHOICE_PROMPT = "CHOICE_PROMPT";
const TEXT_PROMPT = "TEXT_PROMPT";
const ATTACH_PROMPT = "ATTACH_PROMPT";
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';


class CheckinDialog extends ComponentDialog {
    constructor(){
        super(CHECKIN_DIALOG);

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new AttachmentPrompt(ATTACH_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.gerenteStep.bind(this),
            this.checkinStep.bind(this),
            this.finalStep.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;

    }

    async gerenteStep(step) {
    console.log('[CheckinDialog]: gerenteStep <<Inicia>>');
    return await step.prompt(TEXT_PROMPT, "Escribe el Nombre del Gerente");
}
    async checkinStep(step) {
    console.log('[CheckinDialog]: check-in <<Inicia>>');
    const details = step.options;
    const gerente = step.result;
    details.gerente = gerente;
    details.tiempo = step.timestamp;
   
    return await step.prompt(CHOICE_PROMPT,{
        prompt:'**Toca el botón para indicar que has llegado.**',
        choices: ChoiceFactory.toChoices(['Check-In'])
    });
}
async finalStep(step){
    console.log('[CheckinDialog]: finalStep');
    const details = step.options;

    
    const check = step.result.value;
   config.check = check;
    // console.log(config.solicitud);
    await step.context.sendActivity(`Hemos guardado tu hora de entrada.`);
    return await step.endDialog();
}



    

}
module.exports.CheckinDialog = CheckinDialog;
module.exports.CHECKIN_DIALOG = CHECKIN_DIALOG;