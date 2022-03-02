class ElementManager{
    static findByClassName(className){
        return document.getElementsByClassName(className)[0];
    }
}

class Input extends ElementManager{
    static{
        this.volumePersent = {
            element: this.findByClassName("settings__volume-controller__slider"),
            get: function(){ return this.element.value; },
            set: function(value){ this.element.value = value; },
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
            set: function(value){ this.element.textContent = value; }
        };
    }
}

class MessagePassing{
    static{
        getCurrentTab().then((currentTab) => {
            this.tabId = currentTab.id;
        });
    }

    static request(message){
        return new Promise(async (resolve) => {
            await chrome.tabs.sendMessage(this.tabId, message, (response) => {
                resolve(response);
            });
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
    
    Input.volumePersent.element.addEventListener("input", requestPostVolumeLevel, false);
    Input.volumePersent.element.addEventListener("input", (event) => {
        Display.volumePersent.set(event.currentTarget.value);
    }, false);
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
    const volumePersent = settingsValue.volumeLevel * 100;
    Input.volumePersent.set(volumePersent);
    Display.volumePersent.set(volumePersent);
}

function requestSettingsValue(){
    const message = { content: "Get-Settings-Value" };
    return MessagePassing.request(message);
}

function requestPostVolumeLevel(){
    const volumePersent = Input.volumePersent.get();

    const message = { content: "Post-Volume-Level", volumeLevel: volumePersent / 100 };
    MessagePassing.request(message);
}
