import CheckBox from "./CheckBox";
import InputField from "./InputField";
import Select from "./Select";

let options = [
    new Select("useZip"),
    new InputField("downloadName"),
    new CheckBox("displayCheckbox"),
    new CheckBox("openSaveDialogue"),
    new CheckBox("darkMode"),
    new Select("duplicateBehaviour"),
    new CheckBox("downloadSeparately"),
    new CheckBox("replaceSpaces"),
    new CheckBox("htmlParsing"),
    new Select("maxConcurrentDownloads")
]

chrome.storage.sync.get({
    useZip: "zip",
    downloadName: "{pretty}",
    displayCheckbox: true,
    openSaveDialogue: false,
    duplicateBehaviour: "rename",
    darkMode: false,
    replaceSpaces: true,
    htmlParsing: false,
    downloadSeparately: false,
    maxConcurrentDownloads: "3"
}, function(elems) {
    options.forEach(o => {
        o.init(elems);
        document.getElementById(o.getId())!.addEventListener("change", function() {
            let value = o.update(this);
            if (value !== null) {
                let obj: Record<string, any> = {};
                obj[o.getId()] = value;
                chrome.storage.sync.set(obj);
            }
        })
    })
})