const config = require('../config');
const azurest = require('azure-storage');
const tableSvc = azurest.createTableService(config.storageA, config.accessK);
const moment = require('moment-timezone');

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
    const data = step.options;
    const gerente = step.result;
    data.gerente = gerente;
    
   
    return await step.prompt(CHOICE_PROMPT,{
        prompt:'**Toca el botón para indicar que has llegado.**',
        choices: ChoiceFactory.toChoices(['Check-In'])
    });
}
async finalStep(step){
    console.log('[CheckinDialog]: finalStep');
    const data = step.options;
    const check = step.result.value;
    data.check = check;
    moment.locale('es');
    const cdmx = moment().tz("America/Mexico_City");
    console.log(cdmx.format('LLL'));

    const entidad = {
        PartitionKey : {'_': data.proyecto, '$':'Edm.String'},
        RowKey : {'_': data.sucursal, '$':'Edm.String'},
        Check_In : {'_': cdmx.format('LLL'), '$':'Edm.String'},
        Gerente : {'_': data.gerente, '$':'Edm.String'}
    };
    
    const merge = new Promise((resolve, reject) => {
        // Update Comentarios Azure
        tableSvc.mergeEntity(config.table1, entidad, function (error, result, response) {
            if (!error) {
                resolve(
                    console.log(`${data.check} ${cdmx.format('LLL')}`)
                    );
            } else {
                reject(error);
            }
        });
    });
    await merge;

    // console.log(config.solicitud);
    await step.context.sendActivity(`Hemos guardado tu hora de entrada.`);
    return await step.endDialog();
}



    

}
module.exports.CheckinDialog = CheckinDialog;
module.exports.CHECKIN_DIALOG = CHECKIN_DIALOG;