class Input{
    static{
        this.volumeLevel = {
            element: document.getElementById("volumeLevelInput"),
            getValue: function(){ return this.element.value; }
        };
    }
}

class Display{
    static{
        this.pagefavicon = {
            element: document.getElementById("pagefaviconDisplay"),
            set: function(value){ this.element.src = value; }
        };
        this.pageTitle = {
            element: document.getElementById("pageTitleDisplay"),
            set: function(value){ this.element.innerText = value; }
        };
        this.volumeLevel ={
            element: document.getElementById("volumeLevelDisplay"),
            set: function(value){ this.element.innerText = value + "%"; }
        };
    }
}

main();

async function main(){
    await initializeUI();
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