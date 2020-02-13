const config = require('../config');
const azurest = require('azure-storage');
const image2base64 = require('image-to-base64');
const blobService = azurest.createBlobService(config.storageA,config.accessK);
const tableSvc = azurest.createTableService(config.storageA, config.accessK);
const azureTS = require('azure-table-storage-async');
const moment = require('moment-timezone');

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
        const data = step.options;
        console.log(data);
        var optsbutton = ['Iniciar Actividad','Rack', 'Inst. Previa', 'Instalación', 'Ticket'];
        var Opts = {};
        
        return await step.prompt(CHOICE_PROMPT, {
            prompt: '**Elige que desear realizar.**',
            choices: ChoiceFactory.toChoices(optsbutton)
        });
    }
    
    async adjuntaStep(step) {
        console.log('[FotosDialog]: adjuntaStep');
        const data = step.options;
        const photoAttach = step.result.value;
        data.choice = photoAttach;
    
        switch (photoAttach) {
            case 'Iniciar Actividad': 
                return await step.prompt(CHOICE_PROMPT,{
                    prompt:'**Toca el botón para indicar que vas a iniciar actividades.**',
                    choices: ChoiceFactory.toChoices(['Iniciar Actividad'])
                });
            case 'Rack': 
                return await step.prompt(ATTACH_PROMPT,`Adjunta aquí foto del **${data.choice}**`);
            
            case 'Inst. Previa': 
                   
                return await step.prompt(ATTACH_PROMPT,`Adjunta aquí foto de **${data.choice}**`);
            
            case 'Instalación': 
                   
                return await step.prompt(ATTACH_PROMPT,`Adjunta aquí foto de **${data.choice}**`);
            
            case 'Ticket': 
                   
                return await step.prompt(ATTACH_PROMPT,`Adjunta aquí foto del **${data.choice}**`);    
            
            default:
                break;
        }

    }
    /**
     * Returns an attachment that has been uploaded to the channel's blob storage.
     * @param {Object} step
     */
    async attachStep(step) {
        console.log('[FotosDialog]: attachStep');
        const data = step.options;
        console.log(data);
        
        // console.log(step.context.activity.attachments);
        
        if (step.context.activity.attachments && step.context.activity.attachments.length > 0) {
            // The user sent an attachment and the bot should handle the incoming attachment.
            const attachment = step.context.activity.attachments[0];
            const stype = attachment.contentType.split('/');
            const ctype = stype[1];
            const url = attachment.contentUrl;
            image2base64(url)
            .then(
                (response) => {
                    // console.log(response); //iVBORw0KGgoAAAANSwCAIA...
                    var buffer = Buffer.from(response, 'base64');
                    const blob = new Promise ((resolve, reject) => {

                        blobService.createBlockBlobFromText(config.blobcontainer, data.proyecto +'_'+ data.sucursal +'_'+ data.choice +'_'+ '.'+ ctype, buffer,  function(error, result, response) {
                            if (!error) {
                                console.log("_Archivo subido al Blob Storage",response)
                                resolve();
                           }       
                           else{
                               reject(
                                   console.log('Hubo un error en Blob Storage: '+ error)
                                   );
                                   
                               }
                           });
                           });
                           
                       }
                       )
           .catch(
               (error) => {
                   console.log(error); //Exepection error....
               });

            await step.context.sendActivity(`La foto **${data.proyecto}_${data.sucursal}_${data.choice}** se ha subido correctamente`);
            return await step.prompt(CHOICE_PROMPT, {
                prompt: '¿Deseas adjuntar otra foto?',
                choices: ChoiceFactory.toChoices(['Sí','No'])
            });
        } else {

            const iniact = step.result.value;
            data.iniact = iniact;
            moment.locale('es');
            const cdmx = moment().tz("America/Mexico_City");
            console.log(cdmx.format('LLL'));

            const entidad = {
                PartitionKey : {'_': data.proyecto, '$':'Edm.String'},
                RowKey : {'_': data.sucursal, '$':'Edm.String'},
                Ini_Actividad : {'_': cdmx.format('LLL'), '$':'Edm.String'}
            };
            
            const merge = new Promise((resolve, reject) => {
                // Update Comentarios Azure
                tableSvc.mergeEntity(config.table1, entidad, function (error, result, response) {
                    if (!error) {
                        resolve(
                            console.log(`${data.iniact} ${cdmx.format('LLL')}`)
                            );
                    } else {
                        reject(error);
                    }
                });
            });
            await merge;
            

            // console.log(config.solicitud);
            await step.context.sendActivity(`Se guardo tu hora para ${data.iniact}.`);
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