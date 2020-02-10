const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
var config = require('../config');
// const azurest = require('azure-storage');
// const tableSvc = azurest.createTableService(config.storageA, config.accessK);
// const azureTS = require('azure-table-storage-async');

// Dialogos
const { FotosDialog, FOTOS_DIALOG } = require('./fotos');
const { CheckinDialog, CHECKIN_DIALOG } = require('./checkin');
// const { PeticionDialog, PETICION_DIALOG } = require('./PETICION');
// const { GeneralDialog, GENERAL_DIALOG } = require('./GENERAL');

const { ChoiceFactory, ChoicePrompt, TextPrompt, WaterfallDialog} = require('botbuilder-dialogs');

const CHOICE_PROMPT = "CHOICE_PROMPT";
const TEXT_PROMPT = "TEXT_PROMPT";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";

class MainDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'mainDialog');
 
        this.addDialog(new FotosDialog());
        this.addDialog(new CheckinDialog());
 
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.sucursalStep.bind(this),
            this.infoConfirmStep.bind(this),
            this.choiceStep.bind(this),
            this.dispatcherStep.bind(this),
            this.finalStep.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

async sucursalStep(step){
    console.log('[mainDialog]:sucursal');
    await step.context.sendActivity('Recuerda que este bot tiene un tiempo limite de 10 minutos.');
    return await step.prompt(TEXT_PROMPT, `Por favor, **escribe el Número de Sucursal.**`);
}

async infoConfirmStep(step) {
    console.log('[mainDialog]:infoConfirm <<inicia>>');
    step.values.sucursal = step.result;
    const sucursal = step.values.sucursal;
    config.sucursal = sucursal;

    const msg=(`**Proyecto:** StarBucks \n\n **Sucursal**: ${sucursal} \n\n **Dirección:** Gabriel Mancera 1481, Col. Del Valle `);

    await step.context.sendActivity(msg);
    return await step.prompt(CHOICE_PROMPT, {
        prompt: '**¿Esta información es correcta?**',
        choices: ChoiceFactory.toChoices(['Sí', 'No'])
    });      
}

async choiceStep(step) {
    console.log('[mainDialog]: choice <<inicia>>');
    const selection = step.result.value;
    switch (selection) {
        
        case 'Sí':
            return await step.prompt(CHOICE_PROMPT,{
                prompt:'¿Qué deseas realizar?',
                choices: ChoiceFactory.toChoices(['Check-In', 'Subir Fotos'])
            });
        case 'No':
            return await step.context.sendActivity('Se envía notificación a oficina central para la validación de la información');             
                 
        default:
            break;
    }
}

    async dispatcherStep(step) {
        console.log('[mainDialog]: dispatcher <<inicia>>');
        const answer = step.result.value;
     
        
        if (!answer) {
            // exhausted attempts and no selection, start over
            await step.context.sendActivity('Not a valid option. We\'ll restart the dialog ' +
                'so you can try again!');
            return await step.endDialog();
        }
        if (answer ==='Check-In') {

            return await step.beginDialog(CHECKIN_DIALOG);
            
        } 
        if (answer ==='Subir Fotos') {

            return await step.beginDialog(FOTOS_DIALOG);
            
        } 

        console.log('[mainDialog]: dispatcher <<termina>>');
        return await step.endDialog();
    
    }

    async finalStep(step){
        console.log('[mainDialog]: finalDialog');
    return await step.endDialog();
    
    }
}

module.exports.MainDialog = MainDialog;