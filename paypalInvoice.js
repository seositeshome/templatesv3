const activateWebhook = async(table,id,tr)=>{
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    await fetch(`https://api.seositeshome.com/createInvoice?token=${token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
                table,
                id

            }
        ),
    })
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
