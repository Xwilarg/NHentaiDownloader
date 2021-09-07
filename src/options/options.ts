import CheckBox from "./CheckBox";
import InputField from "./InputField";
import Select from "./Select";

let options = [
    new Select("useZip"),
    new InputField("downloadName"),
    new Select("duplicateBehaviour"),
    new CheckBox("displayCheckbox"),
    new CheckBox("darkMode"),
    new CheckBox("replaceSpaces"),
    new CheckBox("htmlParsing")
]

chrome.storage.sync.get({
    useZip: "zip",
    downloadName: "{pretty}",
    displayCheckbox: true,
    duplicateBehaviour: "rename",
    darkMode: false,
    replaceSpaces: true,
    htmlParsing: false
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