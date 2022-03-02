class MediaAudioController{
    static _controllerList = [];

    constructor(mediaElement){
        this._context = new (window.AudioContext || window.webkitAudioContext);
        this._source = this._context.createMediaElementSource(mediaElement);
        this._gainNode = this._context.createGain();
        this.constructor._controllerList.push(this);
    }

    static getList(callback){
        if (callback === undefined){
            return this._controllerList;
        }

        _controllerList.forEach(controller => {
            callback(controller);
        });
    }

    static getOrCreate(videoElement){
        const findResult = this._controllerList.find(c => c._source.mediaElement === videoElement);
        const controller = findResult ?? new MediaAudioController(videoElement);
        return controller;
    }

    updateVolume(volumeLevel){
        this._source.connect(this._gainNode);
        this._gainNode.connect(this._context.destination)
        this._gainNode.gain.value = volumeLevel;
    }

    updateStereoPan(panLevel){
        const panner = new StereoPannerNode(this._context, { pan: panLevel });
        this._source.connect(this._gainNode);
        this._gainNode.connect(panner)
        this.panner.connect(this._context.destination);
    }
}

class VideoElementManager{
    static {
        this._collection = document.getElementsByTagName("video");
    }

    static getCollection(callback){
        if (callback === undefined){
            return this._collection;
        }

        for (const videoElement of this._collection) {
            callback(videoElement);
        }
    }

    static get(index){
        return this._collection.item(index);
    }
}

class Data {
    static {
        this.volumeLevel = 1;
        this.panLevel = 0;
    }
}

main();

function main(){
    chrome.runtime.onMessage.addListener(switchProcessByMessage)
}

function switchProcessByMessage(message, sender, sendResponse){
    switch (message.content) {
        case "Get-Settings-Value":
            const response = { volumeLevel: Data.volumeLevel, panLevel: Data.panLevel};
            sendResponse(response);
            break;
        case "Post-Volume-Level":
            Data.volumeLevel = message.volumeLevel;
            VideoElementManager.getCollection((videoElement) => {
                const controller = MediaAudioController.getOrCreate(videoElement);
                controller.updateVolume(Data.volumeLevel);
            })
            break;
        case "Post-Stereo-Pan-Level":
            Data.panLevel = message.panLevel;
            VideoElementManager.getCollection((videoElement) => {
                const controller = MediaAudioController.getOrCreate(videoElement);
                controller.updateStereoPan(Data.panLevel);
            })
            break;
        default:
            throw new Error("Invalid message");
    }
}