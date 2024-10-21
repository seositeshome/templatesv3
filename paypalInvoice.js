const createInvoice = async(table,id,tr)=>{
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const product = prompt("Please enter product:");
    const email = prompt("Please enter email:");
    const amount = prompt("Please enter the amount:");
    const currency = prompt("Please enter the currency (e.g., USD, EUR):");
    const response =  await fetch(`https://api.seositeshome.com/createInvoice?token=${token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
                table,
                id,
                email,
                amount,
                currency,
                product

            }
        )
    })
    if (response.ok) {
        alert('Invoice sent successfully!');
    } else {
        const errorData = await response.json(); // Optional: get more details about the error
        alert(`Problem sending invoice: ${errorData.error || 'Unknown error'}`);
    }
}
var createInvoiceButtons = async()=>{
    const buttons = document.querySelectorAll(`[data-button="create-paypal-invoice"]`)
    for(const button of buttons){
        const tr = button.closest('tr')
        const id = tr.id
        const urlParams = new URLSearchParams(window.location.search);
        const table = urlParams.get('table');
       
        button.onclick = ()=>createInvoice(table,id,tr)
        
        
    }

}
const cancelInvoice = async(table,id,tr)=>{
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    await fetch(`https://api.seositeshome.com/cancelInvoice?token=${token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
                
                id,

            }
        )
    })
    tr.querySelector(`[cname='invoice status']`).textContent = 'cancelled'
    alert('invoice cancelled')
}
var cancelInvoiceButtons = async()=>{
    const buttons = document.querySelectorAll(`[data-button="paypal-cancel-invoice"]`)
    for(const button of buttons){
        const tr = button.closest('tr')
        const id = tr.id
        const urlParams = new URLSearchParams(window.location.search);
        const table = urlParams.get('table');
        if( tr.querySelector(`[cname='invoice status']`).textContent === 'cancelled'){
            button.remove()
        }
        button.onclick = ()=>cancelInvoice(table,id,tr)
        
        
    }

}