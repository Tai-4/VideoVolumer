class ElementManager{
    static {
        this._loadingAnimation = this._createLoadingAnimation();
    }

    static _createLoadingAnimation(){
        const noImageBox = this.create("div", "loading-box page-info__item__favicon");
        const noImageMark = this.create("div", "loading-box__mark");
        noImageBox.appendChild(noImageMark);

        return noImageBox;
    }

    static findByClassName(className){
        return document.getElementsByClassName(className)[0];
    }

    static create(tagName, className = ""){
        const element = document.createElement(tagName);
        element.className = className;

        return element;
    }

    static replaceToLoadingAnimation(replacedElement){
        replacedElement.hidden = true;
        this.insertBefore(this._loadingAnimation, replacedElement);
    }

    static insertBefore(insertElement, criteriaElement){
        criteriaElement.parentElement.insertBefore(insertElement, criteriaElement);
    }

    static insertAfter(insertElement, criteriaElement){
        this.insertBefore(insertElement, criteriaElement.nextSibling);
    }
}

class Binding{
    constructor(source, eventType, callback){
        source.element.addEventListener(eventType, () => {
            const value = source.get();
            callback(value);
        }, false);
    }
}

class Input extends ElementManager{
    static{
        this.volumeLevel = {
            element: ElementManager.findByClassName("settings__volume-level-controller__slider"),
            get: function(){ return this.element.value; },
            set: function(value){ this.element.value = value; }
        };
        this.stereoPanLevel = {
            element: ElementManager.findByClassName("settings__stereo-pan-level-controller__slider"),
            get: function(){ return this.element.value; },
            set: function(value){ this.element.value = value; }
        };
    }
}

class Display extends ElementManager{
    static{
        this.pagefavicon = {
            element: ElementManager.findByClassName("page-info__item__favicon"),
            set: function(value){ this.element.src = value; }
        };
        this.pageTitle = {
            element: ElementManager.findByClassName("page-info__item__title"),
            set: function(value){ this.element.textContent = value; }
        };
        this.volumePersent = {
            element: ElementManager.findByClassName("settings__volume-persent__current"),
            binding: new Binding(Input.volumeLevel, "input", function(value){ Display.volumePersent.set(value * 10 * 10); }),
            set: function(value){ this.element.textContent = value; }
        };
    }
}

class Block extends ElementManager{
    static{
        this.pageInfo = {
            element: ElementManager.findByClassName("page-info")
        }
        this.settings = {
            element: ElementManager.findByClassName("settings")
        }
    }
}

class AlertBox{
    constructor(type, detail){
        this.element = this._create();
        this.heading.textContent = type;
        this.detail.textContent = detail;
    }

    _create(){
        const alertBox = ElementManager.create("div", "alert-box");
        this.heading = ElementManager.create("h2", "heading");
        this.detail = ElementManager.create("p", "alert-box__detail");

        alertBox.appendChild(this.heading);
        alertBox.appendChild(this.detail);
        return alertBox;
    }

    insertBefore(criteriaElement){
        ElementManager.insertBefore(this.element, criteriaElement);
    }

    insertAfter(criteriaElement){
        ElementManager.insertAfter(this.element, criteriaElement);
    }
}

class TabManager{
    static async getCurrentTab(){
        const queryOptions = { active: true, currentWindow: true };
        const tabList = await chrome.tabs.query(queryOptions);
        const currentTab = tabList[0];
        return currentTab;
    }

    static isPageLoaded(){
        return Data.currentTab.status === "complete";
    }

    static async waitForPageLoad(){
        await Task.delay(500);
        while (!this.isPageLoaded()){
            await Task.delay(500);
        }
    }
}

class MessagePassing{
    static async tryConnect(){
        const message = { content: "Connect" };
        await this.request(message, true);
        
        if (chrome.runtime.lastError !== undefined){
            const error = new Error("Connection failed.");
            error.name = "ConnectionError"
            throw error;
        }
    }

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

    static requestSettingsValue(){
        const message = { content: "Get-Settings-Value" };
        return MessagePassing.request(message, true);
    }
    
    static requestPostVolumeLevel(){
        const message = { content: "Post-Volume-Level", volumeLevel: Input.volumeLevel.get() };
        MessagePassing.request(message);
    }
    
    static requestPostStereoPanLevel(){
        const message = { content: "Post-Stereo-Pan-Level", stereoPanLevel: Input.stereoPanLevel.get() };
        MessagePassing.request(message);
    }
}

class Task {
    static delay(millisecond){
        return new Promise((resolve) => {
            setTimeout(resolve, millisecond);
        });
    }
}

class Data{
    static currentTab;

    static async initialize(){
        this.currentTab = await TabManager.getCurrentTab();
    }
}

main();

async function main(){
    await initialize().catch(switchProcessByErrorName);
}

async function initialize(){
    await Data.initialize();
    await MessagePassing.tryConnect();
    await initializeUI();

    Input.volumeLevel.element.addEventListener("input", MessagePassing.requestPostVolumeLevel, false);
    Input.stereoPanLevel.element.addEventListener("input", MessagePassing.requestPostStereoPanLevel, false);
}

async function initializeUI(){
    initializePageInfoUI();
    await initializeSettingsUI();
}

function initializePageInfoUI(){
    Display.pageTitle.set(Data.currentTab.title);
    if (Data.currentTab.favIconUrl){
        Display.pagefavicon.set(Data.currentTab.favIconUrl);
    } else {
        ElementManager.replaceToLoadingAnimation(Display.pagefavicon.element);
    }
}

async function initializeSettingsUI(){
    const settingsValue = await MessagePassing.requestSettingsValue();
    Input.volumeLevel.set(settingsValue.volumeLevel);
    Display.volumePersent.set(settingsValue.volumeLevel * 10 * 10);
    Input.stereoPanLevel.set(settingsValue.stereoPanLevel);
}

function switchProcessByErrorName(error){
    switch (error.name) {
        case "ConnectionError": {
            initializePageInfoUI();
            notifyInitializeError(error); 
            break;
        }
        default: {
            break;
        }
    }
}

function notifyInitializeError(error){
    Block.settings.element.hidden = true;
    const alertBox = new AlertBox("Error", error.message);
    alertBox.insertAfter(Block.pageInfo.element);
}