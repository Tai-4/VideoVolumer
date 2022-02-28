class DocumentManager{
    static findElementByClassName(className){
        return document.getElementsByClassName(className)[0];
    }
}

class Input extends DocumentManager{
    static{
        this.volumeLevel = {
            element: this.findElementByClassName("volume-controller__slider"),
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
            element: this.findElementByClassName("volume-info__level"),
            set: function(value){ this.element.innerText = value; }
        };
    }
}

main();

async function main(){
    await initialize();
}

async function initialize(){
    await initializeUI();
    Input.volumeLevel.element.addEventListener("input", requestVolumeUpdate, false)
}

async function initializeUI(){
    const currentTab = await getCurrentTab();

    Display.pagefavicon.set(currentTab.favIconUrl);
    Display.pageTitle.set(currentTab.title);
    Display.volumeLevel.set(100);
}

async function getCurrentTab(){
    const queryOptions = { active: true, currentWindow: true };
    const tabList = await chrome.tabs.query(queryOptions);
    const currentTab = tabList[0];
    return currentTab;
}

async function requestVolumeUpdate(){
    const currentTab = await getCurrentTab();
    const volumeLevel = Input.volumeLevel.get() / 100;

    const message = { content: "Update-Volume", volumeLevel: volumeLevel };
    await chrome.tabs.sendMessage(currentTab.id, message);
}