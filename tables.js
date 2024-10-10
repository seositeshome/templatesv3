document.getElementById('reload').addEventListener('click', function () {
    location.reload();
});

const t = document.getElementById('dtable')
const sButton = document.querySelector('.loading-btn')
const dataButton = document.getElementById('data-table')
const settingsButton = document.getElementById('settings-table')
const rButton = document.getElementById('remove')
const saveTable = async (event) => {
    const { value } = document.querySelector('[data-input="create-new-table-input"]')

    r = await fetch('https://api.seositeshome.com/table', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
                table: value,

            }
        ),
    })
    event.target.closest('[data-menu]').setAttribute('hidden', '')
    generateTables()
}
const generateMainTable = async (tableName, token) => {

    let { records } = await fetch(`https://api.seositeshome.com/tables/${tableName}settings?token=${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(e => e.json())
    if (!records) {
        return
    }
    records.sort((a, b) => {return a - b;})
    console.log(JSON.stringify(records))
    records = [{ columnName: 'created', name: 'created' }, ... records.sort((a, b) => {return a - b;})]
    document.getElementById('tableToShow')?.remove()
    const table = t.cloneNode(true)
    table.removeAttribute('hidden')
    table.id = 'tableToShow'
    const theadtr = table.querySelector('thead tr')
    let remove = false
    const childs = table.querySelector('tbody').querySelectorAll('tr:not([hidden])').forEach(e => e.remove())
    sButton.onclick = async (e) => {
        sButton.classList.add('loading')
        sButton.classList.remove('save')
        sButton.classList.remove('loaded')
        if (remove) {
            await fetch(`https://api.seositeshome.com/tables/${table}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const e = document.getElementById('tableToShow')
            e.remove()
            sButton.classList.remove('loading')
            return
        }
        const changedRows = table.querySelector('tbody').querySelectorAll('tr[data-changed]');

        // Prepare an array to hold the updated records
        const updatedItems = Array.from(changedRows).map(row => {
            const tds = row.querySelectorAll('td');

            const obj = { id: parseInt(row.id) }
            for (const td of tds) {
                const type = td.getAttribute('type')
                if (type === 'string') {
                    obj[td.getAttribute('name')] = td.textContent
                }
                else if (type === 'number') {
                    obj[td.getAttribute('name')] = parseFloat(td.textContent)
                }
                else {
                    if (td.getAttribute('name')) {
                        obj[td.getAttribute('name')] = td.textContent ? td.textContent : undefined
                    }

                }

            }
            return obj
        });

        // Now send the updated data to the server via a PUT request
        const { results } = await fetch(`https://api.seositeshome.com/tables/${tableName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: updatedItems, // Send the array of updated records
            }),
        });


        // Log the server response
        console.log(JSON.stringify(results));

        // Optional: Clear the 'data-changed' attribute from rows after successful update
        changedRows.forEach(row => row.removeAttribute('data-changed'));
        sButton.classList.remove('loading')
        sButton.classList.add('loaded')

    }
    rButton.onclick = async (e) => {
        let userInput = prompt("Enter table name to remove table \nEnter row numbers in format 1,3,9-99,200-300 to remove rows\nOr selected rows will appear here");
        sButton.classList.add('save')
        if (userInput === 'table') {
            remove = true
        }


    }
    //theadtr.innerHTML = ''
    const res = await fetch(`https://api.seositeshome.com/tables/${tableName}?token=${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(e => e.json())
    const mainRecords = res.records
    let total = mainRecords.length
    const originalFilter = table.querySelector('#filterHead')

    const th1 = theadtr.querySelector('th')
    theadtr.append(document.createElement('th'))
    originalFilter.parentNode.append(document.createElement('th'))

    for (const record of records) {
        const th = th1.cloneNode(true)
        th.querySelector('span').textContent = record.columnName

        const clonedFilter = originalFilter.cloneNode(true)
        clonedFilter.id = record.name.toLocaleLowerCase()

        if (record.hidden) {
            th.setAttribute('hidden', '')
            clonedFilter.setAttribute('hidden', '')
        }
        const label = th.querySelector('label')
        const input = th.querySelector('input')
        input.id = record.name
        label.setAttribute('for', record.name)
        label.onclick = (e) => {
            const ths = theadtr.querySelectorAll('th')
            for(const t of ths){
                const input1 = t.querySelector('input')
                if(input1 && (!input1.checked ||input.id !==input1.id)){
                    const l = t.querySelector('label')
                    l.classList.remove('desc')
                    l.classList.remove('asc')
                }
            }
            console.log('clicked')
            
            if (label.classList.contains('asc')) {
                // Case where class list includes 'asc'
                label.classList.remove('asc')
                label.classList.add('desc')
            } else if (label.classList.contains('desc')) {
                // Case where class list includes 'desc'
                label.classList.remove('desc')
                label.classList.add('asc')
                console.log('The label has "desc" class');
            } else {
                label.classList.add('desc')
                // Case where class list includes neither 'asc' nor 'desc'
                console.log('The label has neither "asc" nor "desc" class');
            }
        }
        theadtr.append(th)
        originalFilter.parentNode.append(clonedFilter)
    }
    originalFilter.remove()
    th1.remove()
    const tbody = table.querySelector('tbody')
    const generateRecord = (record, first, elementIndex) => {
        const tr = document.createElement('tr')
        tr.setAttribute('index', elementIndex + 1)
        const td = document.createElement('td')
        td.textContent = elementIndex + 1
        tr.append(td)
        for (const r of records) {
            const td = document.createElement('td')
            if (r.hidden) {
                td.setAttribute('hidden', '')

            }

            if (r.name === 'created') {
                const date = new Date(record[r.name]);
                const formattedDate = date.toISOString().slice(0, 19); // Removes milliseconds and 'Z'
                td.textContent = formattedDate;
            }
            else {
                td.textContent = record[r.name]
            }
            td.setAttribute('name', r.name)
            td.setAttribute('type', r.type)
            if (r.cut) {
                td.classList.add('short')
            }
            td.onblur = () => {
                tr.setAttribute('data-changed', '')
                sButton.classList.add('save')
            }
            tr.append(td)

        }
        tr.id = record.id
        if (first) {
            tbody.insertBefore(tr, tbody.firstChild); // Insert `tr` as the first child

        }
        else {
            tbody.append(tr)

        }
    }
    for (let i = 0; i < total; i++) {
        const record = mainRecords[i]
        generateRecord(record, false, i)
    }
    document.getElementById('add').onclick = async (e) => {
        let userInput = prompt("Enter table name to add table \nEnter number to add rows");
        let inputV = parseInt(userInput)
        if (!inputV) {
            r = await fetch('https://api.seositeshome.com/table', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    {
                        table: userInput,

                    }
                ),
            })
            return
        }
        const p = []
        for (i = 0; i < parseInt(inputV); i++) {
            p.push({})
        }
        const { results } = await fetch(`https://api.seositeshome.com/tables/${tableName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    items: p,

                }
            ),
        }).then(e => e.json())
        console.log(JSON.stringify(results))
        for (let i = 0; i < results.length; i++) {
            const r = results[i]
            generateRecord({ id: r[0] }, true, total + i)
        }
        total += results.length
        runScript1()
        runScript2()
        sButton.classList.remove('save')
    }

    t.parentNode.append(table)
    await runScript1()
    await runScript2()


}
const generateSettingTable = async (table, token) => {
    //generate setting table
    const { records } = await fetch(`https://api.seositeshome.com/tables/${table}settings?token=${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(e => e.json())
    if (!records) {
        return
    }
    document.getElementById('tableToShow')?.remove()
    const tableSettings = t.cloneNode(true)
    tableSettings.removeAttribute('hidden')
    tableSettings.id = 'tableToShow'
    const original = document.getElementById('settingsRow')
    let tr = tableSettings.querySelector('thead tr')
    tr.id = "settingsHead";

    // Define the table header names
    const headers = ["Db Name", "Column Name", "Hidden column", "Cut long cell", "Position", "Data type", "Remove","Foreign key"];
    const originalFilter = tableSettings.querySelector('#filterHead')
    // Loop through the headers and create each <th> element
    const o = tr.querySelector('th')
    for (const headerText of headers) {
        let th = o.cloneNode(true)
        th.querySelector('span').textContent = headerText; // Set the text content for <th>
        th.querySelector('label').remove()
        th.querySelector('input').remove()
        tr.appendChild(th); // Append the <th> to the <tr>
        /*
        const clonedFilter = originalFilter.cloneNode(true)
        clonedFilter.id = headerText.toLocaleLowerCase()
        originalFilter.parentNode.append(clonedFilter)
        */
    }
    o.remove()
    originalFilter.remove()
    tableSettings.querySelector('tbody').querySelectorAll('tr:not([hidden])').forEach(e => e.remove())
    let remove = 0
    const generateFromRecord = (record, first) => {
        const cloned = original.cloneNode(true);
        cloned.hidden = false; // Unhide the cloned row
        cloned.id = record.id
        // Populate the cloned row with record data
        const tds = cloned.querySelectorAll('td');
        const setModified = (e) => {
            cloned.setAttribute('data-changed', '')
            sButton.classList.add('save')
        }
        tds[0].textContent = record.name; // Fill 'name' in the first column
        tds[1].textContent = record.columnName
        tds[1].onblur = setModified
        // Set the checkbox states for 'hidden' and 'cut'
        tds[2].querySelector('input[type="checkbox"]').checked = record.hidden;
        tds[2].querySelector('input[type="checkbox"]').onchange = setModified
        tds[3].querySelector('input[type="checkbox"]').checked = record.cut;
        tds[3].querySelector('input[type="checkbox"]').onchange = setModified

        // Set the position in the input element
        tds[4].querySelector('input').value = record.position;
        tds[4].querySelector('input').onchange = setModified
        // Set the correct option in the dropdown based on 'type'
        const select = tds[5].querySelector('select');
        select.onchange = setModified
        const typeOption = Array.from(select.options).find(option => option.text.toLowerCase() === record.type?.toLowerCase());
        if (typeOption) {
            select.value = typeOption.value;
        }
        tds[6].querySelector('input').onchange = (e) => {
            setModified(e);
            if (e.target.hasAttribute('checked')) {
                e.target.removeAttribute('checked')
            }
            else {
                e.target.setAttribute('checked', '')
            }

        }
        const wrapper = tds[7].querySelector('#fWrapper')
        const fkey = wrapper.querySelector('#foreignKey')
        const ftable = wrapper.querySelector('#foreignTable')
        const check = tds[7].querySelector('#foreignCheckbox')
        if(record.ftable){
            
            wrapper.removeAttribute('hidden')
            fkey.value = record.fkey
            ftable.value = record.ftable
            check.setAttribute('hidden','')

        }
        check.onclick = ()=>{
            check.setAttribute('hidden','')
            wrapper.removeAttribute('hidden')
        }
        // Append the cloned row to the table
        if (first) {
            const tbody = tableSettings.querySelector('tbody')
            tbody.insertBefore(cloned, tbody.firstChild); // Insert `tr` as the first child

        }
        else {
            tableSettings.querySelector('tbody').appendChild(cloned);
        }
    }


    document.getElementById('add').onclick = async (e) => {

        let userInput = prompt("Enter table name to add table \nEnter number to add rows");
        let inputV = parseInt(userInput)
        if (!inputV) {
            r = await fetch('https://api.seositeshome.com/table', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    {
                        table: userInput,

                    }
                ),
            })
            return
        }
        const p = []
        const generateName = () => {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            let name = '';
            const length = 10; // Adjust the length of the random string

            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                name += characters[randomIndex];
            }

            return name;
        }
        for (i = 0; i < parseInt(inputV); i++) {
            p.push({ name: generateName() })
        }
        const { results } = await fetch(`https://api.seositeshome.com/tables/${table}settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    items: p,

                }
            ),
        }).then(e => e.json())
        if (!results) {
            return
        }
        let k = 0
        for (const r of results) {
            generateFromRecord({ id: r[0], name: p[k].name }, true)
            k++
        }
    }
    rButton.onclick = async (e) => {
        let userInput = prompt("Enter 'table' to remove table \nEnter row numbers in format 1,3,9-99,200-300 to remove rows\nOr selected rows will appear here");
        sButton.classList.add('save')
        if (userInput === 'table') {
            remove = true
        }


    }
    sButton.onclick = async (e) => {
        sButton.classList.add('loading')
        sButton.classList.remove('save')
        sButton.classList.remove('loaded')
        if (remove) {
            await fetch(`https://api.seositeshome.com/tables/${table}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const e = document.getElementById('tableToShow')
            e.remove()

            sButton.classList.remove('loading')
            return
        }
        const changedRows = tableSettings.querySelector('tbody').querySelectorAll('tr[data-changed]');

        // Prepare an array to hold the updated records
        const toDIds = []
        const updatedItems = Array.from(changedRows).map(row => {
            const tds = row.querySelectorAll('td');
            const toDelete = tds[6].querySelector('input').checked
            console.log(tds[5].querySelector('input'));
            if (toDelete) {
                toDIds.push(row.id)
                return undefined
            }
            else {
                return {
                    id: row.id, // The id of the row (record)
                    name: tds[0].textContent.trim(), // Get the name from the first column
                    columnName: tds[1].textContent.trim(),
                    hidden: tds[2].querySelector('input[type="checkbox"]').checked, // Get the 'hidden' checkbox value
                    cut: tds[3].querySelector('input[type="checkbox"]').checked, // Get the 'cut' checkbox value
                    position: parseInt(tds[4].querySelector('input').value, 10) || 0, // Get the position, default to 0
                    type: tds[5].querySelector('select').value, 
                    fkey: tds[7].querySelector('#foreignKey').value || undefined,
                    ftable: tds[7].querySelector('#foreignTable').value || undefined
                }; 
            }
        });
        console.log('to deleted ' + JSON.stringify(toDIds))
        if (toDIds.length) {
            await fetch(`https://api.seositeshome.com/tables/${table}settings`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ids: toDIds, // Send the array of updated records
                }),
            });
        }

        for (const id of toDIds) {
            document.getElementById(id).remove()

        }

        // Now send the updated data to the server via a PUT request
        const { results } = await fetch(`https://api.seositeshome.com/tables/${table}settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: updatedItems.filter(e => e), // Send the array of updated records
            }),
        });
        await fetch(`https://api.seositeshome.com/tables/${table}/alter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: updatedItems, // Send the array of updated records
            }),
        });

        // Log the server response
        console.log(JSON.stringify(results));

        // Optional: Clear the 'data-changed' attribute from rows after successful update
        changedRows.forEach(row => row.removeAttribute('data-changed'));
        sButton.classList.remove('loading')
        sButton.classList.add('loaded')

    }

    console.log('generating records')
    for (const record of records) {
        generateFromRecord(record)
    }


    t.parentNode.append(tableSettings)

}

const setShowTable = (type) => {
    const stored = localStorage.getItem('showTable')
    const showMain = document.getElementById('showMainTables')
    const showSettings = document.getElementById('showSettingsTables')
    if (type === 'main') {
        if (stored === 'main') {
            localStorage.removeItem('showTable')
            showMain.classList.remove('b-selected')
        }
        else {
            localStorage.setItem('showTable', 'main')
            showMain.classList.add('b-selected')
            showSettings.classList.remove('b-selected')
        }
    }
    else {
        if (stored === 'settings') {
            localStorage.removeItem('showTable')
            showSettings.classList.remove('b-selected')
        }
        else {
            localStorage.setItem('showTable', 'settings')
            showSettings.classList.add('b-selected')
            showMain.classList.remove('b-selected')
        }
    }
}
function createNewTable() {

    var fieldset2 = document.querySelector('[data-element="create-new-table"]');
    fieldset2.removeAttribute('hidden');

}
const runScript1 = () => {
    console.log('running script 1')
    function makeEditable(element) {
        element.setAttribute('contenteditable', 'true');
        element.focus(); // Focus on the element so the user can start typing

        // Remove contenteditable attribute when focus is lost (blur event)
        element.addEventListener('blur', function () {
            element.removeAttribute('contenteditable');
        }, { once: true }); // The listener runs only once per event
    }

    // Function to toggle the 'cell-checked' class when a cell is clicked
    function toggleCellChecked(cell) {
        // Remove 'cell-checked' class from any other cell
        document.querySelectorAll('.table td.cell-checked').forEach(function (checkedCell) {
            checkedCell.classList.remove('cell-checked');
        });

        // Add 'cell-checked' class to the clicked cell
        cell.classList.add('cell-checked');
    }

    // Watch for all table cells with 'data-entity-value' attribute
    document.querySelectorAll('#tableToShow td').forEach(function (cell) {
        // Make cell editable on double-click
        cell.addEventListener('dblclick', function () {
            console.log('double click')
            makeEditable(cell);
        });

        // Add 'cell-checked' class on single click
        cell.addEventListener('click', function (event) {
            toggleCellChecked(cell);
            event.stopPropagation(); // Prevent click event from bubbling up
        });
    });

    // Listen for clicks anywhere on the page to remove 'cell-checked' from any cell
    document.addEventListener('click', function () {
        document.querySelectorAll('.table td.cell-checked').forEach(function (checkedCell) {
            checkedCell.classList.remove('cell-checked');
        });
    });
}
const runScript2 = () => {
    console.log('running script 2')
    let activeCell = null; // Variable to store the currently active cell

    // Track clicks only on <td> elements within the <tbody> of #tableData
    document.querySelectorAll('#tableToShow tbody td').forEach(function (cell) {
        cell.addEventListener('click', function () {
            activeCell = cell; // Set the clicked cell as the active one
            console.log("Active cell set: ", activeCell);
        });
    });

    // Handle paste event
    document.addEventListener('paste', function (event) {
        // Check if an active cell is selected
        if (!activeCell) {
            console.log("No cell selected for pasting!");
            return;
        }

        event.preventDefault(); // Stop the default paste behavior

        // Get data from clipboard
        let clipboardData = (event.clipboardData || window.clipboardData).getData('text');
        console.log("Pasting data:", clipboardData);

        // Split clipboard data by newline to get rows
        let rows = clipboardData.split('\n');
        activeCell.closest('tr').setAttribute('data-changed', 'true')
        sButton.classList.add('save')
        // Get the row and cell index for starting the paste
        let startRow = activeCell.parentElement;
        let startCellIndex = Array.from(startRow.children).indexOf(activeCell);

        let currentRow = startRow; // Track the current row for pasting

        // Loop through each row of clipboard data
        rows.forEach(function (rowData, rowIndex) {
            if (!currentRow) {
                // If we run out of rows in the table, stop
                console.log("Skipping row, as it exceeds available table rows.");
                return;
            }
            rowData
            let cells = rowData.split('\t'); // Split the row by tab to get cell values

            // Loop through each cell in the row
            cells.forEach(function (cellText, cellIndex) {
                let targetCell = currentRow.cells[startCellIndex + cellIndex];

                // If we run out of cells in the row, skip the rest
                if (!targetCell) {
                    console.log("Skipping cell, as it exceeds available table cells.");
                    return;
                }
                targetCell.closest('tr').setAttribute('data-changed', 'true')
                sButton.classList.add('save')
                // Set the text of the cell
                targetCell.textContent = cellText || ''; // Insert empty string if cell is empty
            });

            // Move to the next row in the table for the next line of data
            currentRow = currentRow.nextElementSibling;
        });
    });
}

document.addEventListener('DOMContentLoaded', async function () {

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const table = urlParams.get('table');
    const show = urlParams.get('show');
    settingsButton.onclick = (e) => {
        if (e.target.checked) {
            generateSettingTable(table, token)

            const value = 'settings'
            urlParams.set('show', value);
            history.pushState({}, '', `${window.location.pathname}?${urlParams}`);
        }
    }
    dataButton.onclick = (e) => {
        if (e.target.checked) {
            generateMainTable(table, token)
            const value = 'data'
            urlParams.set('show', value);
            history.pushState({}, '', `${window.location.pathname}?${urlParams}`);
        }
    }
    // Extract the query parameters

    if (!token) {
        window.localion.href = './'
    }
    if (show === 'settings') {
        await generateSettingTable(table, token)
        settingsButton.checked = true

    }
    else {
        await generateMainTable(table, token)
        dataButton.checked = true
    }
    sButton.classList.add('loaded')

    document.querySelector('.current').textContent = table
    sButton.classList.remove('loading')
})