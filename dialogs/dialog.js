// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { MainDialog } = require('./mainDialog');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const MAIN_DIALOG = 'mainDialog';

class Dialog extends ComponentDialog {
    constructor() {
        super('MainDialog');
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(new MainDialog(MAIN_DIALOG))
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                // this.introStep.bind(this),
                this.firstStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} dialogContext
     */
    async run(context, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async firstStep(step) {
        console.log('[Dialog]:firstStep <<inicia>>');
        return await step.beginDialog("mainDialog");
    }
        
    async finalStep(step) {
        console.log('[Dialog]: finalStep');
        await step.context.sendActivity('Hemos terminado por ahora.');
        return await step.endDialog();
    }
}

module.exports.Dialog = Dialog;
