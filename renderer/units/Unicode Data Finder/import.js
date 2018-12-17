//
const unit = document.getElementById ('unicode-data-finder-unit');
//
const tabs = unit.querySelectorAll ('.tab-bar .tab-radio');
const tabPanes = unit.querySelectorAll ('.tab-panes .tab-pane');
const tabInfos = unit.querySelectorAll ('.tab-infos .tab-info');
//
const nameSearchString = unit.querySelector ('.find-by-name .search-string');
const nameWholeWord = unit.querySelector ('.find-by-name .whole-word');
const nameUseRegex = unit.querySelector ('.find-by-name .use-regex');
const nameSearchButton = unit.querySelector ('.find-by-name .search-button');
const nameSearchInfo = unit.querySelector ('.find-by-name .search-info');
const nameSearchData = unit.querySelector ('.find-by-name .search-data');
const nameInstructions = unit.querySelector ('.find-by-name .instructions');
const nameRegexExamples = unit.querySelector ('.find-by-name .regex-examples');
//
const symbolSearchString = unit.querySelector ('.match-symbol .search-string');
const symbolCaseSensitive = unit.querySelector ('.match-symbol .case-sensitive');
const symbolUseRegex = unit.querySelector ('.match-symbol .use-regex');
const symbolSearchButton = unit.querySelector ('.match-symbol .search-button');
const symbolSearchInfo = unit.querySelector ('.match-symbol .search-info');
const symbolSearchData = unit.querySelector ('.match-symbol .search-data');
const symbolInstructions = unit.querySelector ('.match-symbol .instructions');
const symbolRegexExamples = unit.querySelector ('.match-symbol .regex-examples');
//
const blockSpecimen = unit.querySelector ('.list-by-block .specimen');
const blockGoButton = unit.querySelector ('.list-by-block .go-button');
const blockSelectBlockRange = unit.querySelector ('.list-by-block .select-block-range');
const blockSelectBlockName = unit.querySelector ('.list-by-block .select-block-name');
const blockSearchInfo = unit.querySelector ('.list-by-block .search-info');
const blockSearchData = unit.querySelector ('.list-by-block .search-data');
const blockInstructions = unit.querySelector ('.list-by-block .instructions');
//
const nameParams = { };
const symbolParams = { };
const blockParams = { };
//
module.exports.start = function (context)
{
    const { remote } = require ('electron');
    //
    const unicode = require ('../../lib/unicode/unicode.js');
    //
    const dataTable = require ('./data-table.js');
    //
    const rewritePattern = require ('regexpu-core');
    //
    const defaultPrefs =
    {
        tabName: "",
        //
        nameSearchString: "",
        nameWholeWord: false,
        nameUseRegex: false,
        namePageSize: 8,
        nameInstructions: true,
        nameRegexExamples: false,
        //
        symbolSearchString: "",
        symbolCaseSensitive: false,
        symbolUseRegex: false,
        symbolPageSize: 8,
        symbolInstructions: true,
        symbolRegexExamples: false,
        //
        blockSelectBlockRange: "",
        blockSpecimen: "",
        blockPageSize: 8,
        blockInstructions: true
    };
    let prefs = context.getPrefs (defaultPrefs);
    //
    function updateTab (tabName)
    {
        let foundIndex = 0;
        tabs.forEach
        (
            (tab, index) =>
            {
                let match = (tab.parentElement.textContent === tabName);
                if (match)
                {
                    foundIndex = index;
                }
                else
                {
                    tab.checked = false;
                    tabPanes[index].hidden = true;
                    tabInfos[index].hidden = true;
                }
            }
        );
        tabs[foundIndex].checked = true;
        tabPanes[foundIndex].hidden = false;
        tabInfos[foundIndex].hidden = false;
    }
    //
    updateTab (prefs.tabName);
    //
    for (let tab of tabs)
    {
        tab.addEventListener ('click', (event) => { updateTab (event.target.parentElement.textContent); });
    }
    //
    function clearSearch (info, data)
    {
        while (info.firstChild)
        {
            info.firstChild.remove ();
        }
        while (data.firstChild)
        {
            data.firstChild.remove ();
        }
    }
    //
    nameWholeWord.checked = prefs.nameWholeWord;
    nameUseRegex.checked = prefs.nameUseRegex;
    //
    nameSearchString.addEventListener
    (
        'keypress',
        (event) =>
        {
            if (event.key === "Enter")
            {
                event.preventDefault (); // ??
                nameSearchButton.click ();
            }
        }
    );
    nameSearchString.addEventListener
    (
        'input',
        (event) =>
        {
            event.target.classList.remove ('error');
            event.target.title = "";
            if (nameUseRegex.checked)
            {
                try
                {
                    const flags = 'ui';
                    let pattern = event.target.value;
                    pattern = rewritePattern (pattern, flags, { unicodePropertyEscape: true, lookbehind: true, useUnicodeFlag: true });
                    let regex = new RegExp (pattern, flags);
                }
                catch (e)
                {
                    event.target.classList.add ('error');
                    event.target.title = e;
                }
            }
        }
    );
    nameSearchString.value = prefs.nameSearchString;
    nameSearchString.dispatchEvent (new Event ('input'));
    //
    nameUseRegex.addEventListener
    (
        'change',
        (event) => nameSearchString.dispatchEvent (new Event ('input'))
    );
    //
    nameSearchButton.addEventListener
    (
        'click',
        (event) =>
        {
            clearSearch (nameSearchInfo, nameSearchData);
            let searchString = nameSearchString.value;
            if (searchString)
            {
                let regex = null;
                try
                {
                    function characterToEcmaScriptEscape (character)
                    {
                        let num = character.codePointAt (0);
                        let hex = num.toString (16).toUpperCase ();
                        return `\\u{${hex}}`;
                    }
                    //
                    let pattern = (nameUseRegex.checked) ? searchString : Array.from (searchString).map ((char) => characterToEcmaScriptEscape (char)).join ('');
                    if (nameWholeWord.checked)
                    {
                        const beforeWordBoundary = '(?<![\\p{Alphabetic}\\p{Mark}\\p{Decimal_Number}\\p{Connector_Punctuation}\\p{Join_Control}])';
                        const afterWordBoundary = '(?![\\p{Alphabetic}\\p{Mark}\\p{Decimal_Number}\\p{Connector_Punctuation}\\p{Join_Control}])';
                        pattern = `${beforeWordBoundary}(${pattern})${afterWordBoundary}`;
                    }
                    const flags = 'ui';
                    pattern = rewritePattern (pattern, flags, { unicodePropertyEscape: true, lookbehind: true, useUnicodeFlag: true });
                    regex = new RegExp (pattern, flags);
                }
                catch (e)
                {
                }
                if (regex)
                {
                    let start = window.performance.now ();
                    let characters = unicode.findCharactersByData (regex, false);
                    let stop = window.performance.now ();
                    let seconds = ((stop - start) / 1000).toFixed (2);
                    let closeButton = document.createElement ('button');
                    closeButton.type = 'button';
                    closeButton.className = 'close-button';
                    closeButton.innerHTML = '<svg class="close-cross" viewBox="0 0 8 8"><polygon points="1,0 4,3 7,0 8,1 5,4 8,7 7,8 4,5 1,8 0,7 3,4 0,1" /></svg>';
                    closeButton.title = "Clear results";
                    closeButton.addEventListener ('click', event => { clearSearch (nameSearchInfo, nameSearchData); });
                    nameSearchInfo.appendChild (closeButton);
                    let infoText = document.createElement ('span');
                    infoText.innerHTML = `Characters: <strong>${characters.length}</strong>&nbsp;/&nbsp;${unicode.characterCount} (${seconds}&nbsp;seconds)`;
                    nameSearchInfo.appendChild (infoText);
                    if (characters.length > 0)
                    {
                        nameSearchData.appendChild (dataTable.create (characters, nameParams));
                    }
                }
            }
        }
    );
    //
    nameParams.pageSize = prefs.namePageSize;
    nameParams.observer = null;
    nameParams.root = unit;
    //
    nameInstructions.open = prefs.nameInstructions;
    nameRegexExamples.open = prefs.nameRegexExamples;
    //
    symbolCaseSensitive.checked = prefs.symbolCaseSensitive;
    symbolUseRegex.checked = prefs.symbolUseRegex;
    //
    symbolSearchString.addEventListener
    (
        'keypress',
        (event) =>
        {
            if (event.key === "Enter")
            {
                event.preventDefault (); // ??
                symbolSearchButton.click ();
            }
        }
    );
    symbolSearchString.addEventListener
    (
        'input',
        (event) =>
        {
            event.target.classList.remove ('error');
            event.target.title = "";
            if (symbolUseRegex.checked)
            {
                try
                {
                    const flags = symbolCaseSensitive.checked ? 'u' : 'ui';
                    let pattern = event.target.value;
                    pattern = rewritePattern (pattern, flags, { unicodePropertyEscape: true, lookbehind: true, useUnicodeFlag: true });
                    let regex = new RegExp (pattern, flags);
                }
                catch (e)
                {
                    event.target.classList.add ('error');
                    event.target.title = e;
                }
            }
        }
    );
    symbolSearchString.value = prefs.symbolSearchString;
    symbolSearchString.dispatchEvent (new Event ('input'));
    //
    symbolUseRegex.addEventListener
    (
        'change',
        (event) => symbolSearchString.dispatchEvent (new Event ('input'))
    );
    //
    symbolSearchButton.addEventListener
    (
        'click',
        (event) =>
        {
            clearSearch (symbolSearchInfo, symbolSearchData);
            let searchString = symbolSearchString.value;
            if (searchString)
            {
                let regex = null;
                try
                {
                    function characterToEcmaScriptEscape (character)
                    {
                        let num = character.codePointAt (0);
                        let hex = num.toString (16).toUpperCase ();
                        return `\\u{${hex}}`;
                    }
                    //
                    let pattern = (symbolUseRegex.checked) ?
                        searchString :
                        Array.from (searchString).map ((char) => characterToEcmaScriptEscape (char)).join ('');
                    const flags = symbolCaseSensitive.checked ? 'u' : 'ui';
                    pattern = rewritePattern (pattern, flags, { unicodePropertyEscape: true, lookbehind: true, useUnicodeFlag: true });
                    regex = new RegExp (pattern, flags);
                }
                catch (e)
                {
                }
                if (regex)
                {
                    let start = window.performance.now ();
                    let characters = unicode.findCharactersByData (regex, true);
                    let stop = window.performance.now ();
                    let seconds = ((stop - start) / 1000).toFixed (2);
                    let closeButton = document.createElement ('button');
                    closeButton.type = 'button';
                    closeButton.className = 'close-button';
                    closeButton.innerHTML = '<svg class="close-cross" viewBox="0 0 8 8"><polygon points="1,0 4,3 7,0 8,1 5,4 8,7 7,8 4,5 1,8 0,7 3,4 0,1" /></svg>';
                    closeButton.title = "Clear results";
                    closeButton.addEventListener ('click', event => { clearSearch (symbolSearchInfo, symbolSearchData); });
                    symbolSearchInfo.appendChild (closeButton);
                    let infoText = document.createElement ('span');
                    infoText.innerHTML = `Characters: <strong>${characters.length}</strong>&nbsp;/&nbsp;${unicode.characterCount} (${seconds}&nbsp;seconds)`;
                    symbolSearchInfo.appendChild (infoText);
                    if (characters.length > 0)
                    {
                        symbolSearchData.appendChild (dataTable.create (characters, symbolParams));
                    }
                }
            }
        }
    );
    //
    symbolParams.pageSize = prefs.symbolPageSize;
    symbolParams.observer = null;
    symbolParams.root = unit;
    //
    symbolInstructions.open = prefs.symbolInstructions;
    symbolRegexExamples.open = prefs.symbolRegexExamples;
    //
    const allBlocks = require ('../../lib/unicode/parsed-extra-data.js').blocks;
    //
    const tables = require ('../../lib/tables.js');
    //
    const nameIndex = tables.buildKeyIndex (allBlocks, "name", (a, b) => a.localeCompare (b));
    const firstIndex = tables.buildKeyIndex (allBlocks, "first", (a, b) =>  parseInt (a, 16) - parseInt (b, 16));
    //
    let flags = 'u';
    let assignedPattern = rewritePattern ('\\p{Assigned}', flags, { unicodePropertyEscape: true, useUnicodeFlag: true });
    let assignedRegex = new RegExp (assignedPattern, flags);
    //
    let blocks = { };
    //
    allBlocks.forEach
    (
        block =>
        {
            block.key = `${block.first}-${block.last}`;
            blocks[block.key] = block;
            block.range = `U+${block.first}..U+${block.last}`;
            block.firstIndex = parseInt (block.first, 16);
            block.lastIndex = parseInt (block.last, 16);
            block.size = block.lastIndex - block.firstIndex + 1;
            block.characters = [ ];
            for (let index = block.firstIndex; index <= block.lastIndex; index++)
            {
                block.characters.push (String.fromCodePoint (index));
            }
            block.count = block.characters.filter (character => assignedRegex.test (character)).length;
        }
    );
    //
    blockParams.pageSize = prefs.blockPageSize;
    blockParams.observer = null;
    blockParams.root = unit;
    //
    function displayRangeTable (blockKey, charKey)
    {
        blockSearchInfo.textContent = "";
        while (blockSearchData.firstChild)
        {
            blockSearchData.firstChild.remove ();
        }
        let block = blocks[blockKey];
        let hilightedCharacter;
        if (charKey)
        {
            hilightedCharacter = String.fromCodePoint (parseInt (charKey, 16));
        }
        blockSearchInfo.innerHTML = `Assigned characters: <strong>${block.count}</strong>&nbsp;/&nbsp;Block size: <strong>${block.size}</strong>`;
        blockSearchData.appendChild (dataTable.create (block.characters, blockParams, hilightedCharacter));
    }
    //
    firstIndex.forEach
    (
        index =>
        {
            let block = allBlocks[index];
            let option = document.createElement ('option');
            option.value = block.key;
            option.textContent = block.range;
            option.title = block.name;
            blockSelectBlockRange.appendChild (option);
        }
    );
    //
    nameIndex.forEach
    (
        index =>
        {
            let block = allBlocks[index];
            let option = document.createElement ('option');
            option.value = block.key;
            option.textContent = block.name;
            option.title = block.range;
            blockSelectBlockName.appendChild (option);
        }
    );
    //
    blockSpecimen.value = prefs.blockSpecimen;
    //
    const specimenRegex = /^\s*(?:(.)|(?:[Uu]\+)?\s*([0-9a-fA-F]{4,5}|10[0-9a-fA-F]{4}))\s*$/u;
    //
    blockSpecimen.pattern = specimenRegex.source;
    blockSpecimen.addEventListener
    (
        'keypress',
        (event) =>
        {
            if (event.key === "Enter")
            {
                event.preventDefault (); // ??
                blockGoButton.click ();
            }
        }
    );
    //
    blockGoButton.addEventListener
    (
        'click',
        (event) =>
        {
            if (blockSpecimen.value)
            {
                let match = blockSpecimen.value.match (specimenRegex);
                if (match)
                {
                    let num;
                    if (match[1])
                    {
                        num = match[1].codePointAt (0);
                    }
                    else if (match[2])
                    {
                        num = parseInt (match[2], 16);
                    }
                    let hex = num.toString (16).toUpperCase ();
                    if (hex.length < 5)
                    {
                        hex = ("000" + hex).slice (-4);
                    }
                    let blockKey = null;
                    for (let block of allBlocks)
                    {
                        if ((block.firstIndex <= num) && (num <= block.lastIndex))
                        {
                            blockKey = block.key;
                            break;
                        }
                    }
                    if (blockKey)
                    {
                        blockSpecimen.value = `U+${hex}`;
                        blockSelectBlockRange.value = blockKey;
                        blockSelectBlockName.value = blockKey;
                        displayRangeTable (blockKey, hex);
                    }
                    else
                    {
                        remote.shell.beep ();
                        // blockSpecimen.value = "";
                    }
                }
            }
            else
            {
                displayRangeTable (blockSelectBlockRange.value);
            }
        }
    );
    //
    blockSelectBlockRange.value = prefs.blockSelectBlockRange;
    if (blockSelectBlockRange.selectedIndex < 0) // -1: no element is selected
    {
        blockSelectBlockRange.selectedIndex = 0;
    }
    //
    blockSelectBlockName.value = blockSelectBlockRange.value;
    displayRangeTable (blockSelectBlockName.value);
    //
    blockSelectBlockRange.addEventListener
    (
        'input',
        (event) =>
        {
            blockSelectBlockName.value = event.target.value;
            displayRangeTable (event.target.value);
        }
    );
    //
    blockSelectBlockName.addEventListener
    (
        'input',
        (event) =>
        {
            blockSelectBlockRange.value = event.target.value;
            displayRangeTable (event.target.value);
        }
    );
    //
    blockInstructions.open = prefs.blockInstructions;
}
//
module.exports.stop = function (context)
{
    function getCurrentTabName ()
    {
        let currentTabName = "";
        for (let tab of tabs)
        {
            if (tab.checked)
            {
                currentTabName = tab.parentElement.textContent;
            }
        }
        return currentTabName;
    }
    //
    let prefs =
    {
        tabName: getCurrentTabName (),
        //
        nameSearchString: nameSearchString.value,
        nameWholeWord: nameWholeWord.checked,
        nameUseRegex: nameUseRegex.checked,
        namePageSize: nameParams.pageSize,
        nameInstructions: nameInstructions.open,
        nameRegexExamples: nameRegexExamples.open,
        //
        symbolSearchString: symbolSearchString.value,
        symbolCaseSensitive: symbolCaseSensitive.checked,
        symbolUseRegex: symbolUseRegex.checked,
        symbolPageSize: symbolParams.pageSize,
        symbolInstructions: symbolInstructions.open,
        symbolRegexExamples: symbolRegexExamples.open,
        //
        blockSelectBlockRange: blockSelectBlockRange.value,
        blockSpecimen: blockSpecimen.value,
        blockPageSize: blockParams.pageSize,
        blockInstructions: blockInstructions.open
    };
    context.setPrefs (prefs);
};
//
