class ExtendedArray extends Array{
    findByValue(value){
        return this.find(element => { element === value; });
    }
}

class MediaAudioController{
    static _controllerList = new ExtendedArray();

    constructor(mediaElement){
        this._context = new (window.AudioContext || window.webkitAudioContext);
        this._source = this._context.createMediaElementSource(mediaElement);
        this._gainNode = this._context.createGain();
        this.constructor._sourcedVideoElementList.push(this);
    }

    static getOrCreate(videoElement){
        const findResult = this._controllerList.find(videoElement);
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

    static get(index){
        return this._collection[index];
    }

    static async getAsync(index){
        return this.get(index);
    }
}

main();

function main(){
    chrome.runtime.onMessage.addListener(switchProcessByMessage)
}

function switchProcessByMessage(message){
    switch (message.content) {
        case "Get-Volume-Element-Existence":
            return VideoElementManager.existsAsync();
        case "Update-Volume":
            const videoElement = VideoElementManager.get(0);
            const controller = MediaAudioController.getOrCreate(videoElement);
            controller.updateVolume(message.volumeLevel);
            break;
        default:
            throw new Error("Invalid message");
    }
}