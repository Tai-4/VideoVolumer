class MediaAudioController{
    static _controllerList = [];

    constructor(mediaElement){
        this._context = new (window.AudioContext || window.webkitAudioContext);
        this._source = this._context.createMediaElementSource(mediaElement);
        this._gainNode = this._context.createGain();
        this.constructor._controllerList.push(this);
    }

    static getOrCreate(videoElement){
        const findResult = this._controllerList.find(c => c._source.mediaElement === videoElement);
        if (findResult !== undefined){
            return findResult;
        }

        return new MediaAudioController(videoElement);
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
    
    static exists(){
        return this._collection.length !== 0;
    }

    static async existsAsync(){
        return this.exists();
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

    static async getAsync(index){
        return this.get(index);
    }
}

main();

function main(){
    chrome.runtime.onMessage.addListener(switchProcessByMessage)
}

function switchProcessByMessage(message, sender, sendResponse){
    switch (message.content) {
        case "Get-Video-Element-Exists":
            const exists = VideoElementManager.exists();
            sendResponse({ videoElementExists: exists });
            break;
        case "Update-Volume":
            VideoElementManager.getCollection((videoElement) => {
                const controller = MediaAudioController.getOrCreate(videoElement);
                controller.updateVolume(message.volumeLevel);
            })
            break;
        case "Update-Stereo-Pan":
            VideoElementManager.getCollection((videoElement) => {
                const controller = MediaAudioController.getOrCreate(videoElement);
                controller.updateStereoPan(message.panLevel);
            })
            break;
        default:
            throw new Error("Invalid message");
    }
}