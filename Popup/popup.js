class Input{
    static{
        this.volumeLevel = {
            element: document.getElementById("volumeLevelInput"),
            getValue: function(){ return; }
        };
    }
}

class Display{
    static{
        this.pagefavicon = {
            element: document.getElementById("pagefaviconDisplay"),
            set = function(value){ element.src = value; }
        };
        this.pageTitle = {
            element: document.getElementById("pageTitleDisplay"),
            set = function(value){ element.innerText = value; }
        };
        this.volumeLevel ={
            element: document.getElementById("volumeLevelDisplay"),
            set = function(value){ content.innerText = value + "%"; }
        };
    }
}

main();

function main(){
    initializeUI();
}

function initializeUI(){
    const currentTab = await getCurrentTab();
    Display.pagefavicon.set();
    Display.pageTitle.set(currentTab.title);
    Display.volumeLevel.set(100);
}

async function getCurrentTab(){
    const queryOptions = { active: true, currentWindow: true };
    const tabList = await chrome.tabs.query(queryOptions);
    const currentTab = tabList[0];
    return currentTab;
}