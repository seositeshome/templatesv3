const save = async(table,id,row)=>{
    console.log('clicked')
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
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const updatedItems = [obj]
    const { results } = await fetch(`https://api.seositeshome.com/tables/${table}?token=${token}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: updatedItems, // Send the array of updated records
            }),
        });
}
var activateTrackingButtons = async()=>{
    const buttons = document.querySelectorAll(`[data-button="paypal-add-tracking-number"]`)
    for(const button of buttons){
        const tr = button.closest('tr')
        const id = tr.id
        const urlParams = new URLSearchParams(window.location.search);
        const table = urlParams.get('table');
       
        button.onclick = ()=>save(table,id,tr)
        
        
    }

}
