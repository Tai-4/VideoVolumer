class MediaAudioController{
    static _controllerList = [];

    constructor(mediaElement){
        this._context = new (window.AudioContext || window.webkitAudioContext);
        this._source = this._context.createMediaElementSource(mediaElement);
        this._gainNode = this._context.createGain();
        this._panner = new StereoPannerNode(this._context, { pan: 0 });
        this._connect();

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

    _connect(){
        this._source
        .connect(this._gainNode)
        .connect(this._panner)
        .connect(this._context.destination);
    }

    updateVolume(volumeLevel){
        this._gainNode.gain.value = volumeLevel;
    }

    updateStereoPan(stereoPanLevel){
        this._panner.pan.value = stereoPanLevel;
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

class Data{
    static{
        this.volumeLevel = 1;
        this.stereoPanLevel = 0;
    }
}

main();

function main(){
    chrome.runtime.onMessage.addListener(switchProcessByMessage)
}

function switchProcessByMessage(message, sender, sendResponse){
    switch (message.content) {
        case "Connect": {
            const response = { isSucceeded: true };
            sendResponse(response);
            break;
        }
        case "Get-Settings-Value": {
            const response = { volumeLevel: Data.volumeLevel, stereoPanLevel: Data.stereoPanLevel};
            sendResponse(response);
            break;
        }
        case "Post-Volume-Level": {
            Data.volumeLevel = message.volumeLevel;
            VideoElementManager.getCollection((videoElement) => {
                const controller = MediaAudioController.getOrCreate(videoElement);
                controller.updateVolume(Data.volumeLevel);
            })
            break;
        }
        case "Post-Stereo-Pan-Level": {
            Data.stereoPanLevel = message.stereoPanLevel;
            VideoElementManager.getCollection((videoElement) => {
                const controller = MediaAudioController.getOrCreate(videoElement);
                controller.updateStereoPan(Data.stereoPanLevel);
            })
            break;
        }
        default: {
            throw new Error("Invalid message");
        }
    }
}