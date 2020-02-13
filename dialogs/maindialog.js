const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
var config = require('../config');
const azurest = require('azure-storage');
const tableSvc = azurest.createTableService(config.storageA, config.accessK);
const azureTS = require('azure-table-storage-async');

// Dialogos
const { FotosDialog, FOTOS_DIALOG } = require('./fotos');
const { CheckinDialog, CHECKIN_DIALOG } = require('./checkin');
const { MailerDialog, MAILER_DIALOG } = require('./mailer');

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
        this.addDialog(new MailerDialog());
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
    const data = step.options;
    console.log("Data is: ",data);
    data.query = step.result;
    const rowkey = data.query;
   
    const query = new azurest.TableQuery().where('RowKey eq ?', rowkey);
    const result = await azureTS.queryCustomAsync(tableSvc,config.table1, query);
    await result;
    console.log(result);
    if (result[0] == undefined) {  
        console.log('[mainDialog]:infoConfirmStep <<request fail>>', rowkey);
        
        await step.context.sendActivity(`La serie **${data.query}** no se encontró en la base de datos, verifica la información y vuelve a intentarlo nuevamente.`); 
        return await step.endDialog();
    }

    else {
        console.log('[mainDialog]:infoConfirmStep <<success>>');
        
        for (let r of result) {
            data.proyecto = r.PartitionKey._;
            data.sucursal = r.RowKey._;
            data.direccion = r.Direccion._;

            const msg=(`**Proyecto:** ${data.proyecto} \n\n **Sucursal**: ${data.sucursal} \n\n **Dirección:** ${data.direccion} `);
            await step.context.sendActivity(msg);
            return await step.prompt(CHOICE_PROMPT, {
                prompt: '**¿Esta información es correcta?**',
                choices: ChoiceFactory.toChoices(['Sí', 'No'])
            });
            
            }    
    }

    // const msg=(`**Proyecto:** ${data.proyecto} \n\n **Sucursal**: ${data.sucursal} \n\n **Dirección:** ${data.direccion} `);

    // await step.context.sendActivity(msg);
    // return await step.prompt(CHOICE_PROMPT, {
    //     prompt: '**¿Esta información es correcta?**',
    //     choices: ChoiceFactory.toChoices(['Sí', 'No'])
    // });      
}

async choiceStep(step) {
    console.log('[mainDialog]: choice <<inicia>>');
    const data = step.options;
    const selection = step.result.value;
    switch (selection) {
        
        case 'Sí':
            return await step.prompt(CHOICE_PROMPT,{
                prompt:'¿Qué deseas realizar?',
                choices: ChoiceFactory.toChoices(['Registro', 'Subir Fotos'])
            });
        case 'No':
            await step.context.sendActivity('Se envía notificación a oficina central para la validación de la información');             
            return await step.beginDialog(MAILER_DIALOG, data);
                 
        default:
            break;
    }
}

    async dispatcherStep(step) {
        console.log('[mainDialog]: dispatcher <<inicia>>');
        console.log(step.result.value);
        
        if (step.result.value) {
            const answer = step.result.value;
            console.log(answer);
            
            const data = step.options;
            
        
            if (!answer) {
                // exhausted attempts and no selection, start over
                await step.context.sendActivity('Not a valid option. We\'ll restart the dialog ' +
                    'so you can try again!');
                return await step.endDialog();
            }
            if (answer ==='Registro') {

                return await step.beginDialog(CHECKIN_DIALOG, data);
                
            } 
            if (answer ==='Subir Fotos') {

                return await step.beginDialog(FOTOS_DIALOG, data);
                
            } 
                console.log('[mainDialog]: dispatcher <<termina>>');
                return await step.endDialog();
        } else {
            console.log('[mainDialog]: dispatcher <<termina>>');
            return await step.endDialog();
                
        }
        
    }

    async finalStep(step){
        console.log('[mainDialog]: finalDialog');
    return await step.endDialog();
    
    }
}

module.exports.MainDialog = MainDialog;