const importTransactions = async(table,id,tr)=>{
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    let days = prompt("enter days");
    days = parseInt(days)
    const response =  await fetch(`https://api.seositeshome.com/importTransactions?token=${token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
                table,
                id,
                days
            }
        )
    })
    if (response.ok) {
        alert('import transaction done');
    } else {
        const errorData = await response.json(); // Optional: get more details about the error
        alert(`Problem importing: ${errorData.message || 'Unknown error'}`);
    }

}
var importTransactionsButtons = async()=>{
    const buttons = document.querySelectorAll(`[data-button="get-last-paypal-trans"]`)
    for(const button of buttons){
        const tr = button.closest('tr')
        const id = tr.id
        const urlParams = new URLSearchParams(window.location.search);
        const table = urlParams.get('table');
       
        button.onclick = ()=>importTransactions(table,id,tr)
        
        
    }

}
