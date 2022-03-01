class DocumentManager{
    static findElementByClassName(className){
        return document.getElementsByClassName(className)[0];
    }
}

class Input extends DocumentManager{
    static{
        this.volumeLevel = {
            element: this.findElementByClassName("settings__volume-controller__slider"),
            get: function(){ return this.element.value; }
        };
    }
}

class Display extends DocumentManager{
    static{
        this.pagefavicon = {
            element: this.findElementByClassName("page-info__item__favicon"),
            set: function(value){ this.element.src = value; }
        };
        this.pageTitle = {
            element: this.findElementByClassName("page-info__item__title"),
            set: function(value){ this.element.innerText = value; }
        };
        this.volumeLevel ={
            element: this.findElementByClassName("settings__volume-level__current"),
            set: function(value){ this.element.innerText = value; }
        };
    }
}

main();

async function main(){
    await initialize();
}

async function initialize(){
    window.currentTab = await getCurrentTab();
    await initializeUI();

    Input.volumeLevel.element.addEventListener("input", updateDisplayValue, false)
    Input.volumeLevel.element.addEventListener("input", requestVolumeUpdate, false)
}

async function initializeUI(){
    const videoElementExists = await requestVideoElementExistence().catch(() => { return false; });

    Display.pagefavicon.set(window.currentTab.favIconUrl);
    Display.pageTitle.set(window.currentTab.title);
    Input.volumeLevel.element.disabled = !videoElementExists;
}

async function getCurrentTab(){
    const queryOptions = { active: true, currentWindow: true };
    const tabList = await chrome.tabs.query(queryOptions);
    const currentTab = tabList[0];
    return currentTab;
}

function requestVideoElementExistence(){
    return new Promise((resolve) => {
        const message = { content: "Get-Video-Element-Exists" };
        chrome.tabs.sendMessage(window.currentTab.id, message, (response) => {
            resolve(response.videoElementExists);
        });
    });
}

async function requestVolumeUpdate(){
    const volumeLevel = Input.volumeLevel.get() / 100;

    const message = { content: "Update-Volume", volumeLevel: volumeLevel };
    await chrome.tabs.sendMessage(window.currentTab.id, message);
}

function updateDisplayValue(){
    const volumeLevel = Input.volumeLevel.get();
    Display.volumeLevel.set(volumeLevel);
}