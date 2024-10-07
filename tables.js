const t = document.getElementById('dtable')
const sButton = document.querySelector('.loading-btn')
const dataButton = document.getElementById('data-table')
const settingsButton = document.getElementById('settings-table')

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

    const { records } = await fetch(`https://api.seositeshome.com/tables/${tableName}settings?token=${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(e => e.json())
    if (!records) {
        return
    }
    document.getElementById('tableToShow')?.remove()
    const table = t.cloneNode(true)
    table.removeAttribute('hidden')
    table.id = 'tableToShow'
    const theadtr = table.querySelector('thead tr')

    const childs = table.querySelector('tbody').querySelectorAll('tr:not([hidden])').forEach(e => e.remove())
    sButton.onclick = async (e) => {
        sButton.classList.add('loading')
        sButton.classList.remove('save')
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
                        obj[td.getAttribute('name')] = new Date(td.textContent)
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

    }

    theadtr.innerHTML = ''
    const res = await fetch(`https://api.seositeshome.com/tables/${tableName}?token=${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(e => e.json())
    const mainRecords = res.records
    const originalFilter = table.querySelector('#filterHead')
    
        
    for (const record of records) {
        const th = document.createElement('th')
        th.textContent = record.name
        theadtr.append(th)
        const clonedFilter = originalFilter.cloneNode(true)
        clonedFilter.id = record.name.toLocaleLowerCase()
        originalFilter.parentNode.append(clonedFilter)
        if (record.hidden) {
            th.setAttribute('hidden', '')
        }
    }
    const tbody = table.querySelector('tbody')
    const generateRecord = (record, first) => {
        const tr = document.createElement('tr')
        for (const r of records) {
            const td = document.createElement('td')
            if (r.hidden) {
                td.setAttribute('hidden', '')

            }
            td.textContent = record[r.name]
            td.setAttribute('name', r.name)
            td.setAttribute('type', r.type)
            if (r.cut) {
                td.classList.add('short')
            }
            td.onblur = () => {tr.setAttribute('data-changed', '')
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
    for (const record of mainRecords) {
        generateRecord(record)
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
        for (const r of results) {
            generateRecord({ id: r[0] }, true)
        }
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
    let tr = document.createElement("tr");
    tr.id = "settingsHead";

    // Define the table header names
    const headers = ["Column Name", "Hidden column", "Cut long cell", "Position", "Data type", "Remove"];
    const originalFilter = tableSettings.querySelector('#filterHead')
    // Loop through the headers and create each <th> element
    for (const headerText of headers) {
        let th = document.createElement("th");
        th.textContent = headerText; // Set the text content for <th>
        tr.appendChild(th); // Append the <th> to the <tr>
        const clonedFilter = originalFilter.cloneNode(true)
        clonedFilter.id = headerText.toLocaleLowerCase()
        originalFilter.parentNode.append(clonedFilter)
    }
    originalFilter.remove()
    tableSettings.querySelector('thead').append(tr)
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
        tds[0].onblur = setModified
        // Set the checkbox states for 'hidden' and 'cut'
        tds[1].querySelector('input[type="checkbox"]').checked = record.hidden;
        tds[1].querySelector('input[type="checkbox"]').onchange = setModified
        tds[2].querySelector('input[type="checkbox"]').checked = record.cut;
        tds[2].querySelector('input[type="checkbox"]').onchange = setModified

        // Set the position in the input element
        tds[3].querySelector('input').value = record.position;
        tds[3].querySelector('input').onchange = setModified
        // Set the correct option in the dropdown based on 'type'
        const select = tds[4].querySelector('select');
        select.onchange = setModified
        const typeOption = Array.from(select.options).find(option => option.text.toLowerCase() === record.type?.toLowerCase());
        if (typeOption) {
            select.value = typeOption.value;
        }
        tds[5].querySelector('input').onchange = (e) => {
            setModified(e);
            if (e.target.hasAttribute('checked')) {
                e.target.removeAttribute('checked')
            }
            else {
                e.target.setAttribute('checked', '')
            }

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
    const removeTButton = tableSettings.querySelector('#removeTable')
    removeTButton && (removeTButton.onclick = async (e) => {
        e.target.classList.add('active')
        remove = 1

    })

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
        for (const r of results) {
            generateFromRecord({ id: r[0] }, true)
        }
    }
    sButton.onclick = async (e) => {
        sButton.classList.add('loading')
        sButton.classList.remove('save')
        if (remove) {
            await fetch(`https://api.seositeshome.com/tables/${table}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const e = document.getElementById('table;' + table)
            e.remove()
            tableSettings.setAttribute('hidden', '')
        }
        const changedRows = tableSettings.querySelector('tbody').querySelectorAll('tr[data-changed]');

        // Prepare an array to hold the updated records
        const toDIds = []
        const updatedItems = Array.from(changedRows).map(row => {
            const tds = row.querySelectorAll('td');
            const toDelete = tds[5].querySelector('input').checked
            console.log(tds[5].querySelector('input'));
            if (toDelete) {
                toDIds.push(row.id)
                return undefined
            }
            else {
                return {
                    id: row.id, // The id of the row (record)
                    name: tds[0].textContent.trim(), // Get the name from the first column
                    hidden: tds[1].querySelector('input[type="checkbox"]').checked, // Get the 'hidden' checkbox value
                    cut: tds[2].querySelector('input[type="checkbox"]').checked, // Get the 'cut' checkbox value
                    position: parseInt(tds[3].querySelector('input').value, 10) || 0, // Get the position, default to 0
                    type: tds[4].querySelector('select').value // Get the selected type from the dropdown
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
    document.querySelectorAll('#table td').forEach(function (cell) {
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
    document.querySelectorAll('table tbody td').forEach(function (cell) {
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
        if(e.target.checked){
            generateSettingTable(table, token)
            
            const value = 'settings'
            urlParams.set('show', value);
            history.pushState({}, '', `${window.location.pathname}?${urlParams}`);
        }
    }
    dataButton.onclick = (e) => {
        if(e.target.checked){
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

    sButton.classList.remove('loading')
})