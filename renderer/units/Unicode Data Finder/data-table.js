//
const unicode = require ('../../lib/unicode/unicode.js');
//
const rewritePattern = require ('regexpu-core');
//
const deferredSymbols = (process.platform === 'darwin');
//
module.exports.create = function (characters, params, highlightedCharacter)
{
    function updateDataPage (dataPage)
    {
        // Update pagination bar
        firstPageButton.disabled = (params.pageIndex === 0);
        firstPageButton.title = `First page: ${0 + 1}`;
        prevPageButton.disabled = (params.pageIndex === 0);
        prevPageButton.title = `Previous page: ${params.pageIndex - 1 + 1}`;
        if (pageSelect.value !== (params.pageIndex + 1))
        {
            pageSelect.value = params.pageIndex + 1;
        }
        pageSelect.disabled = (pages.length === 1);
        pageSelect.title = `Current page: ${params.pageIndex + 1}`;
        nextPageButton.disabled = (params.pageIndex === (pages.length - 1));
        nextPageButton.title = `Next page: ${params.pageIndex + 1 + 1}`;
        lastPageButton.disabled = (params.pageIndex === (pages.length - 1));
        lastPageButton.title = `Last page: ${pages.length}`;
        //
        let characters = pages[params.pageIndex];
        while (dataPage.firstChild)
        {
            dataPage.firstChild.remove ();
        }
        if (deferredSymbols)
        {
            params.observer = new IntersectionObserver
            (
                (entries, observer) =>
                {
                    entries.forEach
                    (
                        entry =>
                        {
                            if (entry.isIntersecting)
                            {
                                let symbol = entry.target;
                                if (symbol.textContent !== symbol.dataset.character)
                                {
                                    symbol.textContent = symbol.dataset.character;
                                    observer.unobserve (symbol);
                                }
                            }
                        }
                    );
                },
                { root: params.root, rootMargin: '50% 0%' }
            );
        }
        let table = document.createElement ('table');
        table.className = 'data-table';
        //
        let header = document.createElement ('tr');
        header.className = 'header';
        let symbolHeader = document.createElement ('th');
        symbolHeader.className = 'symbol-header';
        symbolHeader.textContent = "Symbol";
        header.appendChild (symbolHeader);
        let codePointHeader = document.createElement ('th');
        codePointHeader.className = 'code-point-header';
        codePointHeader.textContent = "Code\xA0Point";
        header.appendChild (codePointHeader);
        let nameHeader = document.createElement ('th');
        nameHeader.className = 'name-header';
        nameHeader.textContent = "Name";
        header.appendChild (nameHeader);
        let blockNameHeader = document.createElement ('th');
        blockNameHeader.className = 'block-name-header';
        blockNameHeader.textContent = "Block";
        header.appendChild (blockNameHeader);
        table.appendChild (header);
        //
        let flags = 'u';
        let pattern = rewritePattern ('\\p{Assigned}', flags, { unicodePropertyEscape: true, useUnicodeFlag: true });
        let regex = new RegExp (pattern, flags);
        for (let character of characters)
        {
            let data = unicode.getCharacterBasicData (character);
            let isAssignedCharacter = regex.test (character);
            let row = document.createElement ('tr');
            row.className = 'row';
            if (!isAssignedCharacter)
            {
                row.classList.add ('unassigned');
            }
            let symbol = document.createElement ('td');
            symbol.className = 'symbol';
            if (isAssignedCharacter)
            {
                if (deferredSymbols)
                {
                    symbol.textContent = "\xA0";
                    symbol.dataset.character = ((data.name === "<control>") || (character === " ")) ? "\xA0" : data.character;
                    params.observer.observe (symbol);
                }
                else
                {
                    symbol.textContent = ((data.name === "<control>") || (character === " ")) ? "\xA0" : data.character;
                }
            }
            else
            {
                symbol.textContent = "\xA0";
            }
            row.appendChild (symbol);
            let codePoint = document.createElement ('td');
            codePoint.className = 'code-point';
            if (character === highlightedCharacter)
            {
                let span =  document.createElement ('span');
                span.className = 'highlighted';
                span.textContent = data.codePoint;
                codePoint.appendChild (span);
                setTimeout (() => codePoint.scrollIntoView ({ behavior: 'auto', block: 'nearest', inline: 'nearest' }));
            }
            else
            {
                codePoint.textContent = data.codePoint;
            }
            row.appendChild (codePoint);
            let names = document.createElement ('td');
            names.className = 'names';
            let name = document.createElement ('div');
            name.className = 'name';
            name.textContent = data.name || "<unassigned>";
            names.appendChild (name);
            if (data.alias)
            {
                let alias = document.createElement ('div');
                alias.className = 'alias';
                alias.textContent = data.alias;
                names.appendChild (alias);
            }
            if (data.correction)
            {
                let alias = document.createElement ('div');
                alias.className = 'correction';
                alias.textContent = data.correction;
                alias.title = "CORRECTION";
                names.appendChild (alias);
            }
            row.appendChild (names);
            let blockName = document.createElement ('td');
            blockName.className = 'block-name';
            blockName.title = data.blockRange;
            blockName.innerHTML = data.blockName.replace (/ (.)$/, "\u00A0$1").replace (/(\b\w*-\w*\b)/g, '<span class="no-wrap">$1</span>');
            row.appendChild (blockName);
            table.appendChild (row);
        }
        //
        dataPage.appendChild (table);
    }
    //
    let pages;
    //
    let dataTable = document.createElement ('div');
    //
    let paginationBar = document.createElement ('div');
    paginationBar.className = 'pagination-bar';
    //
    let navigationGroup = document.createElement ('div');
    navigationGroup.className = 'pagination-group';
    //
    let firstPageButton = document.createElement ('button');
    firstPageButton.type = 'button';
    firstPageButton.className = 'page-nav-button first-page-button';
    firstPageButton.innerHTML = '<svg class="page-nav-icon" viewBox="0 0 10 10"><polygon points="0,5 4,1 5,2 2,5 5,8 4,9" /><polygon points="4,5 8,1 9,2 6,5 9,8 8,9" /></svg>';
    firstPageButton.addEventListener
    (
        'click',
        (event) =>
        {
            if (params.pageIndex > 0)
            {
                params.pageIndex = 0;
                updateDataPage (dataPage);
            }
        }
    );
    navigationGroup.appendChild (firstPageButton);
    //
    let prevPageButton = document.createElement ('button');
    prevPageButton.type = 'button';
    prevPageButton.className = 'page-nav-button prev-page-button';
    prevPageButton.innerHTML = '<svg class="page-nav-icon" viewBox="0 0 10 10"><polygon points="2,5 6,1 7,2 4,5 7,8 6,9" /></svg>';
    prevPageButton.addEventListener
    (
        'click',
        (event) =>
        {
            if (params.pageIndex > 0)
            {
                params.pageIndex = params.pageIndex - 1;
                updateDataPage (dataPage);
            }
        }
    );
    navigationGroup.appendChild (prevPageButton);
    //
    let pageSelect = document.createElement ('input');
    pageSelect.type = 'number';
    pageSelect.className = 'page-select';
    pageSelect.addEventListener
    (
        'input',
        (event) =>
        {
            if (event.target.value !== "")
            {
                if (event.target.value < 1)
                {
                    event.target.value = 1;
                }
                else if (event.target.value > pages.length)
                {
                    event.target.value = pages.length;
                }
                params.pageIndex = event.target.value - 1;
                updateDataPage (dataPage);
            }
        }
    );
    pageSelect.addEventListener
    (
        'blur',
        (event) =>
        {
            if (event.target.value === "")
            {
                event.target.value = params.pageIndex + 1;
            }
        }
    );
    navigationGroup.appendChild (pageSelect);
    //
    let nextPageButton = document.createElement ('button');
    nextPageButton.type = 'button';
    nextPageButton.className = 'page-nav-button next-page-button';
    nextPageButton.innerHTML = '<svg class="page-nav-icon" viewBox="0 0 10 10"><polygon points="6,5 3,2 4,1 8,5 4,9 3,8" /></svg>';
    nextPageButton.addEventListener
    (
        'click',
        (event) =>
        {
            if (params.pageIndex < (pages.length - 1))
            {
                params.pageIndex = params.pageIndex + 1;
                updateDataPage (dataPage);
            }
        }
    );
    navigationGroup.appendChild (nextPageButton);
    //
    let lastPageButton = document.createElement ('button');
    lastPageButton.type = 'button';
    lastPageButton.className = 'page-nav-button last-page-button';
    lastPageButton.innerHTML = '<svg class="page-nav-icon" viewBox="0 0 10 10"><polygon points="4,5 1,2 2,1 6,5 2,9 1,8" /><polygon points="8,5 5,2 6,1 10,5 6,9 5,8" /></svg>';
    lastPageButton.addEventListener
    (
        'click',
        (event) =>
        {
            if (params.pageIndex < (pages.length - 1))
            {
                params.pageIndex = pages.length - 1;
                updateDataPage (dataPage);
            }
        }
    );
    navigationGroup.appendChild (lastPageButton);
    //
    paginationBar.appendChild (navigationGroup);
    //
    let pageInfoGroup = document.createElement ('div');
    pageInfoGroup.className = 'pagination-group';
    //
    let pageInfo = document.createElement ('div');
    pageInfo.className = 'page-info';
    //
    pageInfoGroup.appendChild (pageInfo);
    //
    paginationBar.appendChild (pageInfoGroup);
    //
    const pageSizes = [ 4, 8, 16, 32, 64, 128, 256, 512, 1024 ];
    //
    let pageSizeGroup = document.createElement ('div');
    pageSizeGroup.className = 'pagination-group';
    //
    let pageSizeLabel = document.createElement ('label');
    let pageSizeSelect = document.createElement ('select');
    pageSizeSelect.className = 'page-size-select';
    pageSizes.forEach
    (
        (pageSize) =>
        {
            let pageSizeOption = document.createElement ('option');
            pageSizeOption.textContent = pageSize;
            pageSizeSelect.appendChild (pageSizeOption);
        }
    );
    //
    pageSizeLabel.appendChild (pageSizeSelect);
    let pageSizeText = document.createTextNode ("\xA0\xA0per page");
    pageSizeLabel.appendChild (pageSizeText);
    pageSizeGroup.appendChild (pageSizeLabel);
    //
    pageSizeSelect.value = params.pageSize;
    if (pageSizeSelect.selectedIndex < 0) // -1: no element is selected
    {
        pageSizeSelect.selectedIndex = 0;
    }
    //
    function paginate ()
    {
        pages = [ ];
        for (let startIndex = 0; startIndex < characters.length; startIndex += params.pageSize)
        {
            pages.push (characters.slice (startIndex, startIndex + params.pageSize));
        }
        let pageCount = pages.length;
        pageSelect.min = 1;
        pageSelect.max = pageCount;
        pageSelect.value = params.pageIndex + 1;
        pageInfo.innerHTML = (pageCount > 1) ? `<strong>${pageCount}</strong>&nbsp;pages` : "";
        updateDataPage (dataPage);
    }
    //
    pageSizeSelect.addEventListener
    (
        'input',
        (event) =>
        {
            params.pageSize = parseInt (event.target.value);
            params.pageIndex = (highlightedCharacter) ? Math.trunc (characters.indexOf (highlightedCharacter) / params.pageSize) : 0;
            paginate ();
        }
    );
    //
    paginationBar.appendChild (pageSizeGroup);
    //
    dataTable.appendChild (paginationBar);
    let dataPage = document.createElement ('div');
    dataTable.appendChild (dataPage);
    //
    if (highlightedCharacter)
    {
        params.pageIndex = Math.trunc (characters.indexOf (highlightedCharacter) / params.pageSize);
    }
    paginate ();
    //
    return dataTable;
}
//
