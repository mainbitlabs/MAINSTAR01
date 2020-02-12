const config = require('../config');
// const azurest = require('azure-storage');
// const image2base64 = require('image-to-base64');
// const blobService = azurest.createBlobService(config.storageA,config.accessK);
// const tableSvc = azurest.createTableService(config.storageA, config.accessK);
const { ComponentDialog, WaterfallDialog, ChoicePrompt, ChoiceFactory, TextPrompt,AttachmentPrompt } = require('botbuilder-dialogs');

const FOTOS_DIALOG = "FOTOS_DIALOG";
const CHOICE_PROMPT = "CHOICE_PROMPT";
const TEXT_PROMPT = "TEXT_PROMPT";
const ATTACH_PROMPT = "ATTACH_PROMPT";
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';


class FotosDialog extends ComponentDialog {
    constructor(){
        super(FOTOS_DIALOG);
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new AttachmentPrompt(ATTACH_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            // this.firstStep.bind(this),
            this.choiceStep.bind(this),
            this.adjuntaStep.bind(this),
            this.attachStep.bind(this),
            this.dispatcherStep.bind(this),
        ]));
        this.initialDialogId = WATERFALL_DIALOG;

    }

    async firstStep(step) {
    console.log('[FotosDialog]: firstStep');
       
        return await step.prompt(TEXT_PROMPT, "");
    }
    async choiceStep(step) {
    console.log('[FotosDialog]: choiceStep');
    var optsbutton = ['Iniciar Actividad','Foto 1', 'Foto 2', 'Foto 3', 'Foto 4'];
    var Opts = {};
       
        return await step.prompt(CHOICE_PROMPT, {
            prompt: '**Elige que desear realizar.**',
            choices: ChoiceFactory.toChoices(optsbutton)
        });
    }

    async adjuntaStep(step) {
        const photoAttach = step.result.value;
        config.foto = photoAttach;
    
        switch (photoAttach) {
            case 'Iniciar Actividad': 
                return await step.prompt(CHOICE_PROMPT,{
                    prompt:'**Toca el botón para indicar que vas a iniciar actividades.**',
                    choices: ChoiceFactory.toChoices(['Iniciar Actividad'])
                });
            case "Foto 1": 
                return await step.prompt(ATTACH_PROMPT,`Adjunta aquí ${config.foto}`);
            
            case "Foto 2": 
                   
                return await step.prompt(ATTACH_PROMPT,`Adjunta aquí ${config.foto}`);
            
            case "Foto 3": 
                   
                return await step.prompt(ATTACH_PROMPT,`Adjunta aquí ${config.foto}`);
            
            case "Foto 4": 
                   
                return await step.prompt(ATTACH_PROMPT,`Adjunta aquí ${config.foto}`);    
            
            default:
                break;
        }

    }
    /**
     * Returns an attachment that has been uploaded to the channel's blob storage.
     * @param {Object} step
     */
    async attachStep(step) {
        console.log(step.context.activity.attachments);
        
        if (step.context.activity.attachments && step.context.activity.attachments.length > 0) {
            
            await step.context.sendActivity(`La foto **${config.sucursal}_${config.foto}** se ha subido correctamente`);
            return await step.prompt(CHOICE_PROMPT, {
                prompt: '¿Deseas adjuntar otra foto?',
                choices: ChoiceFactory.toChoices(['Sí','No'])
            });
        } else {

           const check = step.result.value;
   config.check = check;
    // console.log(config.solicitud);
    await step.context.sendActivity(`Se guardo tu hora de inicio de actividades.`);
    return await step.endDialog();
        }

    }

    async dispatcherStep(step) {
        const selection = step.result.value;
        switch (selection) {
            
            case 'Sí':
                return await step.beginDialog(FOTOS_DIALOG);
            case 'No':
            await step.context.sendActivity('De acuerdo.');             
            // TERMINA EL DIÁLOGO
            return await step.endDialog();  
            default:
                break;
        }
    }


    

}
module.exports.FotosDialog = FotosDialog;
module.exports.FOTOS_DIALOG = FOTOS_DIALOG;