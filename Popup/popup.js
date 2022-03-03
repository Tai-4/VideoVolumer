class Binding{
    constructor(source, eventType, callback){
        source.element.addEventListener(eventType, () => {
            const value = source.get();
            callback(value);
        }, false);
    }
}

class ElementManager{
    static findByClassName(className){
        return document.getElementsByClassName(className)[0];
    }
}

class Input extends ElementManager{
    static{
        this.volumeLevel = {
            element: this.findByClassName("settings__volume-level-controller__slider"),
            get: function(){ return this.element.value; },
            set: function(value){ this.element.value = value; }
        };
        this.stereoPanLevel = {
            element: this.findByClassName("settings__stereo-pan-level-controller__slider"),
            get: function(){ return this.element.value; },
            set: function(value){ this.element.value = value; }
        };
    }
}

class Display extends ElementManager{
    static{
        this.pagefavicon = {
            element: this.findByClassName("page-info__item__favicon"),
            set: function(value){ this.element.src = value; }
        };
        this.pageTitle = {
            element: this.findByClassName("page-info__item__title"),
            set: function(value){ this.element.textContent = value; }
        };
        this.volumePersent = {
            element: this.findByClassName("settings__volume-persent__current"),
            binding: new Binding(Input.volumeLevel, "input", function(value){ Display.volumePersent.set(value * 10 * 10); }),
            set: function(value){ this.element.textContent = value; }
        };
    }
}

class MessagePassing{
    static request(message, needsResponse = false){
        return new Promise(async (resolve) => {
            if (needsResponse){
                await chrome.tabs.sendMessage(Data.currentTab.id, message, (response) => {
                    resolve(response);
                });
            } else {
                await chrome.tabs.sendMessage(Data.currentTab.id, message);
            }
        });
    }
}

class Data{
    static currentTab;
}

main();

async function main(){
    await initialize();
}

async function initialize(){
    Data.currentTab = await getCurrentTab();
    await initializeUI();
    
    Input.volumeLevel.element.addEventListener("input", requestPostVolumeLevel, false);
    Input.stereoPanLevel.element.addEventListener("input", requestPostStereoPanLevel, false);
}

async function getCurrentTab(){
    const queryOptions = { active: true, currentWindow: true };
    const tabList = await chrome.tabs.query(queryOptions);
    const currentTab = tabList[0];
    return currentTab;
}

async function initializeUI(){
    initializePageInfo();
    await initializeSettingsValue();
}

function initializePageInfo(){
    Display.pagefavicon.set(Data.currentTab.favIconUrl);
    Display.pageTitle.set(Data.currentTab.title);
}

async function initializeSettingsValue(){
    const settingsValue = await requestSettingsValue();

    Input.volumeLevel.set(settingsValue.volumeLevel);
    Display.volumePersent.set(settingsValue.volumeLevel * 10 * 10);
    Input.stereoPanLevel.set(settingsValue.stereoPanLevel);
}

function requestSettingsValue(){
    const message = { content: "Get-Settings-Value" };
    return MessagePassing.request(message, true);
}

function requestPostVolumeLevel(){
    const message = { content: "Post-Volume-Level", volumeLevel: Input.volumeLevel.get() };
    MessagePassing.request(message);
}

function requestPostStereoPanLevel(){
    const message = { content: "Post-Stereo-Pan-Level", stereoPanLevel: Input.stereoPanLevel.get() };
    MessagePassing.request(message);
}
