document.getElementById('reload').addEventListener('click', function () {
    location.reload();
});
var socket
const t = document.getElementById('dtable')
const sButton = document.querySelector('.loading-btn')
const dataButton = document.getElementById('data-table')
const settingsButton = document.getElementById('settings-table')
const rButton = document.getElementById('remove')
const emitCellChanged = (rowId, rowName, value) => {
    const data = {
        date: new Date(),
        rowId,
        rowName,
        value
    };

    // Emit 'cellChanged' event to the server
    socket.emit('cellChanged', data);
}
const saveTable = async (event) => {
    const { value } = document.querySelector('[data-input="create-new-table-input"]')

    r = await fetch(`https://api.seositeshome.com/table?token=${token}`, {
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
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
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


    records = records.sort((a, b) => a.position - b.position);
    console.log(JSON.stringify(records))
    records = [...records]
    document.getElementById('tableToShow')?.remove()
    const table = t.cloneNode(true)
    table.removeAttribute('hidden')
    table.id = 'tableToShow'
    table.setAttribute('data-table', '')
    const theadtr = table.querySelector('thead tr')
    let remove = false
    const childs = table.querySelector('tbody').querySelectorAll('tr:not([hidden])').forEach(e => e.remove())
    sButton.onclick = async (e) => {
        sButton.classList.add('loading')
        sButton.classList.remove('save')
        sButton.classList.remove('loaded')
        if (remove) {
            await fetch(`https://api.seositeshome.com/tables/${tableName}?token=${token}`, {
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
                        obj[td.getAttribute('name')] = td.textContent ? td.textContent : null
                    }

                }

            }
            return obj
        });

        // Now send the updated data to the server via a PUT request
        const { results } = await fetch(`https://api.seositeshome.com/tables/${tableName}?token=${token}`, {
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
        let userInput = prompt(`Enter table name to remove table \nEnter row numbers in format 1,3,9-99,200-300 to remove rows\nOr selected rows will appear here`);
        sButton.classList.add('save')
        if (userInput == tableName) {
            remove = true
        }
        else {

            async function removeElements(input) {
                const elements = input.split(',');
                const indexes = []
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];

                    if (element.includes('-')) {
                        const range = element.split('-');
                        const start = parseInt(range[0], 10);
                        const end = parseInt(range[1], 10);

                        for (let j = start; j <= end; j++) {
                            indexes.push(j)
                        }
                    } else {
                        indexes.push(parseInt(element, 10));
                    }
                }
                const delements = indexes.map(index => {
                    const element = document.querySelector(`[index="${index}"]`)
                    return element
                })
                const ids = Array.from(delements).map(element => element.id)
                await fetch(`https://api.seositeshome.com/tables/${tableName}?token=${token}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ids
                    }),
                });
                delements.forEach(e => e.remove())
            }
            removeElements(userInput)
        }


    }
    //theadtr.innerHTML = ''
    let url = `https://api.seositeshome.com/tables/${tableName}?token=${token}`
    const urlParams = new URLSearchParams(window.location.search);
    const filters = urlParams.get('filters')
    const sort = urlParams.get('sort')
    const sortType = urlParams.get('sortType')
    if (sort) {
        url += `&sort=${sort}&sortType=${sortType}`
    }
    if (filters) {
        url += `&filters=${filters}`
    }
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(e => e.json())
    const mainRecords = res.records
    let total = mainRecords.length
    const originalFilter = table.querySelector('#filterHead')
    const tbody = table.querySelector('tbody')
    const generateFilteredRecords = async () => {
        console.log('generating filtered')
        const urlParams = new URLSearchParams(window.location.search);
        const filters = urlParams.get('filters')
        const sort = urlParams.get('sort')
        const sortType = urlParams.get('sortType')
        document.querySelectorAll('[index]').forEach(e => e.remove())

        const filtered = mainRecords.filter(record => {
            // Loop through each filter and apply it to the record
            for (const filter of JSON.parse(filters) || []) {
                const { type, field, value } = filter;

                // Convert the record field to a string for comparison
                const recordValue = String(record[field]);

                // Apply the filter based on type
                switch (type) {
                    case 'contains':
                        if (!recordValue.toLocaleLowerCase().includes(value.toLowerCase())) {
                            return false; // If the record doesn't match the filter, exclude it
                        }
                        break;

                    case 'more':
                        if (parseFloat(recordValue) <= parseFloat(value)) {
                            return false; // If the record value is not greater, exclude it
                        }
                        break;

                    case 'less':
                        if (parseFloat(recordValue) >= parseFloat(value)) {
                            return false; // If the record value is not smaller, exclude it
                        }
                        break;

                    case 'equal':
                        if (recordValue.toLocaleLowerCase() !== value.toLocaleLowerCase()) {
                            return false; // If the record value doesn't match exactly, exclude it
                        }
                        break;

                    case 'beginswith':
                        if (!recordValue.toLowerCase().startsWith(value.toLowerCase())) {
                            return false; // If the record value doesn't start with the value, exclude it
                        }
                        break;

                    case 'endswith':
                        if (!recordValue.toLowerCase().endsWith(value.toLowerCase())) {
                            return false; // If the record value doesn't end with the value, exclude it
                        }
                        break;

                    default:
                        return false; // If filter type is unknown, exclude this record
                }
            }

            return true; // If the record passes all filters, include it in the result
        });
        console.log('filtered ' + JSON.stringify(filtered))
        if (sort && sortType) {
            filtered.sort((a, b) => {
                const valueA = a[sort];
                const valueB = b[sort];

                // If values are non-comparable (like undefined or null), handle them gracefully
                if (valueA === undefined || valueA === null) return 1;
                if (valueB === undefined || valueB === null) return -1;

                // For numerical sorting, use parseFloat. For other cases (e.g., strings), use localeCompare
                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    return (sortType === 'desc' ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB));
                } else {
                    return (sortType === 'desc' ? valueB - valueA : valueA - valueB);
                }
            });
        } else {
            // If no sort or sortType is provided, use a default sorting mechanism, for example, by 'id' (ascending)
            filtered.sort((a, b) => a.id - b.id);
        }
        for (let i = 0; i < filtered.length; i++) {
            const record = filtered[i]
            generateRecord(record, false, i)
        }

        activateWebhookButtons()
        createInvoiceButtons()
        importTransactionsButtons()
        activateTrackingButtons()
        cancelInvoiceButtons()
        openQueryButtons()
        loadTradesButton()
        await runScript1()
        await runScript2()


    }
    const th1 = theadtr.querySelector('th')
    theadtr.append(document.createElement('th'))
    originalFilter.parentNode.append(document.createElement('th'))

    for (const record of records) {
        const th = th1.cloneNode(true)
        th.querySelector('span').textContent = record.columnName

        const clonedFilter = originalFilter.cloneNode(true)
        clonedFilter.id = record.name.toLocaleLowerCase()
        const filterInput = clonedFilter.querySelector('input')
        const selectElement = clonedFilter.querySelector('select');
        const updateQuery = (e) => {
            const value = filterInput.value;

            const selectedType = selectElement.value;
            const selectedField = record.name

            // Get the current query string from the browser's URL
            const urlParams = new URLSearchParams(window.location.search);
            let filters = JSON.parse(urlParams.get('filters') || '[]'); // Get the 'filters' query param or an empty array if it doesn't exist

            // Check if the value is empty
            if (value.trim() === '') {
                // If the value is empty, remove the filter object from the array
                filters = filters.filter(f => f.field !== selectedField);
            } else {
                // Otherwise, check if the filter already exists by field name
                const existingFilterIndex = filters.findIndex(f => f.field === selectedField);

                if (existingFilterIndex !== -1) {
                    // If the field already exists, update the filter object
                    filters[existingFilterIndex] = { type: selectedType, value, field: selectedField };
                } else {
                    // Otherwise, add the new filter object
                    filters.push({ type: selectedType, value, field: selectedField });
                }
            }

            // Update the 'filters' parameter in the URL with the updated filters array
            urlParams.set('filters', JSON.stringify(filters));

            // Update the browser's URL without reloading the page
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
            generateFilteredRecords()
        }
        filterInput.addEventListener('input', updateQuery);
        selectElement.onchange = updateQuery;

        if (record.hidden) {
            th.setAttribute('hidden', '')
            clonedFilter.setAttribute('hidden', '')
        }
        const label = th.querySelector('label')
        const input = th.querySelector('input')
        input.id = record.name
        label.setAttribute('for', record.name)
        const urlParams = new URLSearchParams(window.location.search);
        const filters = JSON.parse(urlParams.get('filters') || '[]'); // Parses 'filters' if it exists, or defaults to an empty array
        const sort1 = urlParams.get('sort')
        const sortType1 = urlParams.get('sortType')
        if (sort1 && sortType1 && sort1 === record.name) {
            label.classList.add(sortType1)
            input.checked = true
        }

        // Find the filter object that matches the 'field' with the 'record.name'
        const filter = filters.find(f => f.field === record.name);


        // If the filter is found, set the input's value
        if (filter) {
            filterInput.value = filter.value;
        } else {
            // If no matching filter is found, optionally clear the input or set a default value
            filterInput.value = ''; // or you can set a default value here
        }

        let sortField = urlParams.get('sort');
        let sortType = urlParams.get('sortType')
        label.onclick = (e) => {
            const ths = theadtr.querySelectorAll('th')
            for (const t of ths) {
                const input1 = t.querySelector('input')
                if (input1 && (!input1.checked || input.id !== input1.id)) {
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
                sortField = record.name
                sortType = 'desc'
            } else if (label.classList.contains('desc')) {
                // Case where class list includes 'desc'
                label.classList.remove('desc')
                label.classList.add('asc')
                console.log('The label has "desc" class');
                sortField = record.name
                sortType = 'asc'
            } else {
                label.classList.add('desc')
                // Case where class list includes neither 'asc' nor 'desc'
                sortField = record.name
                sortType = 'desc'
                console.log('The label has neither "asc" nor "desc" class');
            }
            urlParams.set('sort', sortField);
            urlParams.set('sortType', sortType);
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
            generateFilteredRecords()
        }
        theadtr.append(th)
        originalFilter.parentNode.append(clonedFilter)
    }
    originalFilter.remove()
    th1.remove()

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


            if (r.type === 'date' || r.type === 'date ISO 8601 UTC') {
                const f = record[r.name]?.replace('T', ' ').slice(0, 19);
                console.log(f)
                td.textContent = record[r.name]?.replace('T', ' ').slice(0, 19);
            }
            else if (r.type.startsWith('button')) {
                const parsed = JSON.parse(r.type.replace('button', ''))
                const { name } = parsed
                const value = parsed['data-button']
                const button = document.createElement('button')
                button.textContent = name
                button.setAttribute('data-button', value)
                td.append(button)
            }
            else {
                td.textContent = record[r.name]

            }
            td.setAttribute('name', r.name)
            td.setAttribute('cname', r.columnName)
            td.setAttribute('type', r.type)
            if (r.cut || r.name === 'shortId') {
                td.classList.add('short')
            }
            td.onblur = () => {
                tr.setAttribute('data-changed', '')
                emitCellChanged(tr.id, td.name, td.value)
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
            r = await fetch(`https://api.seositeshome.com/table?token=${token}`, {
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
            const p1 = {}
            if (records.find(e => e.name === 'shortId')) {
                p1.shortId = generateUUID().replaceAll('-', '')
            }
            p.push(p1)
        }
        const { results } = await fetch(`https://api.seositeshome.com/tables/${tableName}?token=${token}`, {
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

    activateWebhookButtons()
    createInvoiceButtons()
    importTransactionsButtons()
    activateTrackingButtons()
    cancelInvoiceButtons()
    openQueryButtons()
    loadTradesButton()
    await runScript1()
    await runScript2()

}
const generateQuery = async (query, token) => {

    let { result, records } = await fetch(`https://api.seositeshome.com/query/${query}?token=${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(e => e.json())
    if (!result) {
        return
    }
    console.log(result)

    document.getElementById('tableToShow')?.remove()
    const table = t.cloneNode(true)
    table.removeAttribute('hidden')
    table.id = 'tableToShow'
    table.setAttribute('data-table', '')
    const theadtr = table.querySelector('thead tr')
    let remove = false
    const childs = table.querySelector('tbody').querySelectorAll('tr:not([hidden])').forEach(e => e.remove())
    sButton.onclick = async (e) => {
        sButton.classList.add('loading')
        sButton.classList.remove('save')
        sButton.classList.remove('loaded')
        if (remove) {
            await fetch(`https://api.seositeshome.com/tables/${tableName}?token=${token}`, {
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
                        obj[td.getAttribute('name')] = td.textContent ? td.textContent : null
                    }

                }

            }
            return obj
        });

        // Now send the updated data to the server via a PUT request
        const { results } = await fetch(`https://api.seositeshome.com/tables/${tableName}?token=${token}`, {
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
        let userInput = prompt(`Enter table name to remove table \nEnter row numbers in format 1,3,9-99,200-300 to remove rows\nOr selected rows will appear here`);
        sButton.classList.add('save')
        if (userInput == tableName) {
            remove = true
        }
        else {

            async function removeElements(input) {
                const elements = input.split(',');
                const indexes = []
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];

                    if (element.includes('-')) {
                        const range = element.split('-');
                        const start = parseInt(range[0], 10);
                        const end = parseInt(range[1], 10);

                        for (let j = start; j <= end; j++) {
                            indexes.push(j)
                        }
                    } else {
                        indexes.push(parseInt(element, 10));
                    }
                }
                const delements = indexes.map(index => {
                    const element = document.querySelector(`[index="${index}"]`)
                    return element
                })
                const ids = Array.from(delements).map(element => element.id)
                await fetch(`https://api.seositeshome.com/tables/${tableName}?token=${token}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ids
                    }),
                });
                delements.forEach(e => e.remove())
            }
            removeElements(userInput)
        }


    }
    //theadtr.innerHTML = ''

    const mainRecords = result
    let total = mainRecords.length
    const originalFilter = table.querySelector('#filterHead')

    const th1 = theadtr.querySelector('th')
    theadtr.append(document.createElement('th'))
    originalFilter.parentNode.append(document.createElement('th'))
    const tbody = table.querySelector('tbody')
    const generateFilteredRecords = async () => {
        console.log('generating filtered')
        const urlParams = new URLSearchParams(window.location.search);
        const filters = urlParams.get('filters')
        const sort = urlParams.get('sort')
        const sortType = urlParams.get('sortType')
        document.querySelectorAll('[index]').forEach(e => e.remove())

        const filtered = mainRecords.filter(record => {
            // Loop through each filter and apply it to the record
            for (const filter of JSON.parse(filters) || []) {
                const { type, field, value } = filter;

                // Convert the record field to a string for comparison
                const recordValue = String(record[field]);

                // Apply the filter based on type
                switch (type) {
                    case 'contains':
                        if (!recordValue.toLocaleLowerCase().includes(value.toLowerCase())) {
                            return false; // If the record doesn't match the filter, exclude it
                        }
                        break;

                    case 'more':
                        if (parseFloat(recordValue) <= parseFloat(value)) {
                            return false; // If the record value is not greater, exclude it
                        }
                        break;

                    case 'less':
                        if (parseFloat(recordValue) >= parseFloat(value)) {
                            return false; // If the record value is not smaller, exclude it
                        }
                        break;

                    case 'equal':
                        if (recordValue.toLocaleLowerCase() !== value.toLocaleLowerCase()) {
                            return false; // If the record value doesn't match exactly, exclude it
                        }
                        break;

                    case 'beginswith':
                        if (!recordValue.toLowerCase().startsWith(value.toLowerCase())) {
                            return false; // If the record value doesn't start with the value, exclude it
                        }
                        break;

                    case 'endswith':
                        if (!recordValue.toLowerCase().endsWith(value.toLowerCase())) {
                            return false; // If the record value doesn't end with the value, exclude it
                        }
                        break;

                    default:
                        return false; // If filter type is unknown, exclude this record
                }
            }

            return true; // If the record passes all filters, include it in the result
        });
        console.log('filtered ' + JSON.stringify(filtered))
        if (sort && sortType) {
            filtered.sort((a, b) => {
                const valueA = a[sort];
                const valueB = b[sort];

                // If values are non-comparable (like undefined or null), handle them gracefully
                if (valueA === undefined || valueA === null) return 1;
                if (valueB === undefined || valueB === null) return -1;

                // For numerical sorting, use parseFloat. For other cases (e.g., strings), use localeCompare
                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    return (sortType === 'desc' ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB));
                } else {
                    return (sortType === 'desc' ? valueB - valueA : valueA - valueB);
                }
            });
        } else {
            // If no sort or sortType is provided, use a default sorting mechanism, for example, by 'id' (ascending)
            filtered.sort((a, b) => a.id - b.id);
        }
        for (let i = 0; i < filtered.length; i++) {
            const record = filtered[i]
            generateRecord(record, false, i)
        }


    }
    for (const record of records) {
        const th = th1.cloneNode(true)
        th.querySelector('span').textContent = record.columnName

        const clonedFilter = originalFilter.cloneNode(true)
        clonedFilter.id = record.name.toLocaleLowerCase()
        const filterInput = clonedFilter.querySelector('input')
        const selectElement = clonedFilter.querySelector('select');
        const updateQuery = (e) => {
            const value = filterInput.value;

            const selectedType = selectElement.value;
            const selectedField = record.name

            // Get the current query string from the browser's URL
            const urlParams = new URLSearchParams(window.location.search);
            let filters = JSON.parse(urlParams.get('filters') || '[]'); // Get the 'filters' query param or an empty array if it doesn't exist

            // Check if the value is empty
            if (value.trim() === '') {
                // If the value is empty, remove the filter object from the array
                filters = filters.filter(f => f.field !== selectedField);
            } else {
                // Otherwise, check if the filter already exists by field name
                const existingFilterIndex = filters.findIndex(f => f.field === selectedField);

                if (existingFilterIndex !== -1) {
                    // If the field already exists, update the filter object
                    filters[existingFilterIndex] = { type: selectedType, value, field: selectedField };
                } else {
                    // Otherwise, add the new filter object
                    filters.push({ type: selectedType, value, field: selectedField });
                }
            }

            // Update the 'filters' parameter in the URL with the updated filters array
            urlParams.set('filters', JSON.stringify(filters));

            // Update the browser's URL without reloading the page
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
            generateFilteredRecords()
        }
        filterInput.addEventListener('input', updateQuery);
        selectElement.onchange = updateQuery;
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
            for (const t of ths) {
                const input1 = t.querySelector('input')
                if (input1 && (!input1.checked || input.id !== input1.id)) {
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
            generateFilteredRecords()
        }
        theadtr.append(th)
        originalFilter.parentNode.append(clonedFilter)
    }
    originalFilter.remove()
    th1.remove()
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


            if (r.type === 'date' || r.type === 'date ISO 8601 UTC') {
                const f = record[r.name]?.replace('T', ' ').slice(0, 19);
                console.log(f)
                td.textContent = record[r.name]?.replace('T', ' ').slice(0, 19);
            }
            else if (r.type.startsWith('button')) {
                const parsed = JSON.parse(r.type.replace('button', ''))
                const { name } = parsed
                const value = parsed['data-button']
                const button = document.createElement('button')
                button.textContent = name
                button.setAttribute('data-button', value)
                td.append(button)
            }
            else {
                td.textContent = record[r.name]

            }
            td.setAttribute('name', r.name)
            td.setAttribute('cname', r.columnName)
            td.setAttribute('type', r.type)
            if (r.cut || r.name === 'shortId') {
                td.classList.add('short')
            }
            td.onblur = () => {
                tr.setAttribute('data-changed', '')
                emitCellChanged('cell2', td.value)
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
            r = await fetch(`https://api.seositeshome.com/table?token=${token}`, {
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
            const p1 = {}
            if (records.find(e => e.name === 'shortId')) {
                p1.shortId = generateUUID().replaceAll('-', '')
            }
            p.push(p1)
        }
        const { results } = await fetch(`https://api.seositeshome.com/tables/${tableName}?token=${token}`, {
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
    activateWebhookButtons()
    createInvoiceButtons()
    importTransactionsButtons()
    activateTrackingButtons()
    cancelInvoiceButtons()
    openQueryButtons()
    loadTradesButton()

}
const generateSettingTable = async (table, token) => {
    //generate setting table
    const { records } = await fetch(`https://api.seositeshome.com/tables/${table}settings?token=${token}&sort=position`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(e => e.json())
    document.getElementById('add').onclick = async (e) => {

        let userInput = prompt("Enter table name to add table \nEnter number to add rows");
        let inputV = parseInt(userInput)
        if (!inputV) {
            r = await fetch(`https://api.seositeshome.com/table?token=${token}`, {
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
        const { results } = await fetch(`https://api.seositeshome.com/tables/${table}settings?token=${token}`, {
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
    if (!records) {
        return
    }


    document.getElementById('tableToShow')?.remove()
    const tableSettings = t.cloneNode(true)
    tableSettings.removeAttribute('hidden')
    tableSettings.id = 'tableToShow'
    tableSettings.setAttribute('data-settings-table', '')
    const original = document.getElementById('settingsRow')
    let tr = tableSettings.querySelector('thead tr')
    tr.id = "settingsHead";

    // Define the table header names
    const headers = ["Db Name", "Column Name", "Hidden column", "Cut long cell", "Position", "Data type", "Remove", "Foreign key", "button"];
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
        tds[8].querySelector('#buttonName').onchange = setModified
        tds[8].querySelector('#buttonName').onchange = setModified
        if (record.type?.startsWith('button')) {
            const parsed = JSON.parse(record.type.replace('button', ''))
            tds[8].querySelector('#buttonName').value = parsed.name

            tds[8].querySelector('#buttonValue').value = parsed['data-button']

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

        const ftable = wrapper.querySelector('#foreignTable')
        const check = tds[7].querySelector('#foreignCheckbox')
        if (record.ftable) {

            wrapper.removeAttribute('hidden')
            ftable.value = record.ftable
            check.setAttribute('hidden', '')

        }
        check.onclick = (e) => {
            check.setAttribute('hidden', '')
            wrapper.removeAttribute('hidden')
            setModified(e)
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
            await fetch(`https://api.seositeshome.com/tables/${table}?token=${token}`, {
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
                const name = tds[8].querySelector('#buttonName').value
                const value = tds[8].querySelector('#buttonValue').value
                const result = {
                    id: row.id, // The id of the row (record)
                    name: tds[0].textContent.trim(), // Get the name from the first column
                    columnName: tds[1].textContent.trim(),
                    hidden: tds[2].querySelector('input[type="checkbox"]').checked, // Get the 'hidden' checkbox value
                    cut: tds[3].querySelector('input[type="checkbox"]').checked, // Get the 'cut' checkbox value
                    position: parseInt(tds[4].querySelector('input').value, 10) || 0, // Get the position, default to 0
                    type: tds[5].querySelector('select').value,
                    ftable: tds[7].querySelector('#foreignTable').value || undefined,

                };
                if (name && value) {
                    result.type = 'button' + JSON.stringify({ name, "data-button": value })
                }
                return result
            }
        });
        console.log('to deleted ' + JSON.stringify(toDIds))
        if (toDIds.length) {
            await fetch(`https://api.seositeshome.com/tables/${table}settings?token=${token}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ids: toDIds,
                }),
            });
        }

        for (const id of toDIds) {
            document.getElementById(id).remove()

        }

        // Now send the updated data to the server via a PUT request
        const { results } = await fetch(`https://api.seositeshome.com/tables/${table}settings?token=${token}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: updatedItems.filter(e => e), // Send the array of updated records

            }),
        });
        await fetch(`https://api.seositeshome.com/tables/${table}/alter?token=${token}`, {
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
    for (const record of records.filter(e => !(e.name === 'shortId' || e.name === 'created'))) {
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
function copyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}
const runScript1 = () => {
    let isSelecting = false;
    console.log('running script 1')
    let isEditable = false
    function makeEditable(element) {
        const selection = window.getSelection();

        // If element is already editable, just clear the selection and return.
        if (element.hasAttribute('contenteditable')) {
            const range = document.createRange();
            range.selectNodeContents(element);
            selection.removeAllRanges();  // Clear previous selections
            selection.addRange(range); // Select the entire content of the element
            return;
        }

        // Make the element editable
        element.setAttribute('contenteditable', 'true');
        element.classList.add('cell-checked'); // Add a class when the element is editable
        element.focus();

        // Handle blur event to remove contenteditable and the class
        const blurHandler = function () {
            element.removeAttribute('contenteditable');
            element.classList.remove('cell-checked');
            element.removeEventListener('blur', blurHandler); // Remove the event listener after it runs
            isEditable = null
        };
        element.addEventListener('blur', blurHandler, { once: true });

        // Select the entire content of the element
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();  // Clear previous selections
        selection.addRange(range); // Select the entire content of the element
        isEditable = element
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
    document.querySelectorAll('#tableToShow tr').forEach(function (row) {
        const arr = row.querySelectorAll('td')
        for (let i = 1; i < arr.length; i++) {
            const cell = arr[i]
            if (!cell.querySelector('button')) {
                cell.addEventListener('dblclick', function (event) {
                    event.preventDefault()
                    console.log('double click');
                    makeEditable(cell);
                });

                // Add 'cell-checked' class on single click, skip if cell contains a <button>
                cell.addEventListener('click', function (event) {
                    if (isEditable) {
                        if (isEditable === cell) {
                            return
                        } else {
                            isEditable.removeAttribute('contenteditable');
                            isEditable.classList.remove('cell-checked');
                            // Remove any active text selection (deselect)
                            const selection = window.getSelection();
                            selection.removeAllRanges();

                            isEditable = false
                        }
                    }


                    toggleCellChecked(cell);
                    event.stopPropagation(); // Prevent click event from bubbling up
                });
            }
        }

    });
    document.addEventListener('keydown', function (event) {
        // Check if Ctrl or Cmd is pressed along with 'C' key
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            console.log('clicked ctrl+c')
            // Find all the checked cells in the table
            const checkedCells = document.querySelectorAll('.table td.cell-checked');

            if (checkedCells.length > 0 && !isEditable) {
                // Prevent the default copy action
                console.log('cells checked')
                event.preventDefault();

                // Group checked cells by their row (tr)
                const rows = [];

                // Iterate through the checked cells
                checkedCells.forEach(cell => {
                    if (cell === cell.closest('tr').querySelector('td:first-child')) {
                        return; // Skip this cell
                    }
                    const row = cell.closest('tr');  // Find the parent row of the cell
                    const rowIndex = rows.findIndex(rowData => rowData.row === row); // Find if the row is already in our group

                    if (rowIndex === -1) {
                        // If the row is not already in the rows array, create a new entry
                        rows.push({ row: row, cells: [] });
                    }

                    // Push the cell's text content into the corresponding row
                    rows[rows.findIndex(rowData => rowData.row === row)].cells.push(cell.textContent.trim());
                });

                // Format the rows into a tab-separated string (similar to table format)
                const tableContent = rows.map(rowData => rowData.cells.join('\t')).join('\n'); // Tab-separated cells

                // Copy the formatted table content to the clipboard
                copyToClipboard(tableContent);
            }
        }
    });

    // Listen for clicks anywhere on the page to remove 'cell-checked' from any cell

    document.addEventListener('click', function () {
        if (isSelecting) {
            isSelecting = false
            return
        }

        document.querySelectorAll('.table td.cell-checked').forEach(function (checkedCell) {
            checkedCell.classList.remove('cell-checked');
        });
    });
    document.querySelectorAll('#tableToShow tr').forEach(function (row) {
        const cells = row.querySelectorAll('td');

        if (!cells.length) {

            return
        }
        for (let i = 1; i < cells.length; i++) {
            const cell = cells[i];
            cell.addEventListener('mousedown', function (event) {
                if (isEditable) {
                    return
                }
                event.preventDefault(); // Prevent text selection during mouse down
                event.stopPropagation(); // Prevent click event from bubbling up

                isSelecting = true;
                let selectedCells = new Set();  // Track selected cells

                // Function to select a single cell, excluding those with buttons
                function selectCell(cell) {
                    if (cell && !cell.querySelector('button')) {
                        cell.classList.add('cell-checked');
                        selectedCells.add(cell);
                    }
                }

                // Initial selection of the first clicked cell (only this one cell)
                selectCell(cell);

                // Handle mousemove to select neighboring cells (individually, not the whole row)
                const onMouseMove = (moveEvent) => {
                    const targetCell = moveEvent.target.closest('td');  // Find the closest cell to the mouse pointer
                    if (targetCell && targetCell !== cell && !targetCell.querySelector('button')) {
                        selectCell(targetCell);  // Select individual cell on mouse move
                    }
                };

                // Mouseup to stop selecting
                const onMouseUp = () => {
                    event.preventDefault();  // Prevent text selection during mouse down
                    event.stopPropagation();  // Prevent click event from bubbling up
                    document.removeEventListener('mousemove', onMouseMove);  // Stop mousemove event
                    document.removeEventListener('mouseup', onMouseUp);  // Stop mouseup event
                };

                // Add mousemove and mouseup listeners to continue selecting on mousemove
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }
        // Handle mouse down to start selecting cells
        const firstCell = cells[0]
        firstCell.addEventListener('mousedown', function (event) {
            isSelecting = true
            let selectedCells = new Set();
            event.preventDefault(); // Prevent text selection during mouse down
            event.stopPropagation(); // Prevent click event from bubbling up
            // Function to select cells in a row, excluding those with buttons
            function selectCellsInRow(row) {
                row.querySelectorAll('td').forEach(function (cell) {
                    if (!cell.querySelector('button')) {
                        cell.classList.add('cell-checked');
                        selectedCells.add(cell);
                    }
                });
            }

            // Initial selection of the first clicked row (the row that was clicked)
            selectCellsInRow(row);

            // Handle mousemove to select neighboring rows
            const onMouseMove = (moveEvent) => {
                const targetRow = moveEvent.target.closest('tr');
                if (targetRow && targetRow !== row && targetRow.querySelector('td:first-child') && !targetRow.querySelector('td:first-child').querySelector('button')) {
                    // Select the neighboring row's cells
                    selectCellsInRow(targetRow);
                }
            };

            // Mouseup to stop selecting
            const onMouseUp = () => {
                event.preventDefault(); // Prevent text selection during mouse down
                event.stopPropagation(); // Prevent click event from bubbling up
                document.removeEventListener('mousemove', onMouseMove);  // Stop mousemove event
                document.removeEventListener('mouseup', onMouseUp);  // Stop mouseup event
            };

            // Add mousemove and mouseup listeners
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
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
const initiateSocket = async (table) => {
    socket = io('http://162.0.208.90');
    const joinRoom = (table) => {
        socket.emit('joinRoom', table);
    }
    socket.on('connect', () => {
        console.log('Connected to server with ID:', socket.id);
        joinRoom(table)
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
    socket.on('cellChanged', (data) => {
        const { rowId,
            rowName,
            value } = data
        const t = document.getElementById('tableToShow')
        t.querySelector('#'+rowId).querySelector(`[name="${rowName}"]`).value = value
    });
}
document.addEventListener('DOMContentLoaded', async function () {

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const table = urlParams.get('table');
    const show = urlParams.get('show');
    const query = urlParams.get('query');

    // Extract the query parameters

    if (!token) {
        window.localion.href = './'
    }
    document.querySelector('.current').textContent = table
    if (query) {
        settingsButton.remove()
        dataButton.remove()
        await generateQuery(query, token)
    }
    else {
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
        if (show === 'settings') {
            await generateSettingTable(table, token)
            settingsButton.checked = true

        }
        else {
            await generateMainTable(table, token)
            dataButton.checked = true
        }
        initiateSocket(table)
    }

    sButton.classList.add('loaded')


    sButton.classList.remove('loading')

})




/* 
code that prevent reloading not saving
*/
let isDirty = false;

// Function to update the isDirty flag
function updateDirtyState(mutationsList) {
    mutationsList.forEach(mutation => {
        if (mutation.target.classList.contains('loading-btn')) {
            if (mutation.target.classList.contains('save')) {
                isDirty = true;
            } else {
                isDirty = false;
            }
        }
    });
}

// Create an observer to watch for attribute changes
const observer = new MutationObserver(updateDirtyState);

// Find the element with the class "loading-btn"
const loadingButton = document.querySelector('.loading-btn');

// Start the observer on the element, watching for class attribute changes
if (loadingButton) {
    observer.observe(loadingButton, { attributes: true, attributeFilter: ['class'] });
}

// Add an event listener to warn before closing the page
window.addEventListener('beforeunload', function (e) {
    if (isDirty) {
        const message = "YOU HAVE UNSAVED CHANGED!";
        e.returnValue = message;
        return message;
    }
});
