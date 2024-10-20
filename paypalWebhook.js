const activateWebhook = async(table,id,tr)=>{
    tr.querySelector(`[cname="webhook status"]`).textContent = 'processing'
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    await fetch(`https://api.seositeshome.com/activatepaypalwebhook?token=${token}`, {
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
    tr.querySelector(`[cname="webhook status"]`).textContent = 'activated'
    alert('webhook activate')
}
var activateWebhookButtons = async()=>{
    const buttons = document.querySelectorAll(`[data-button="activate-paypal-webhook"]`)
    for(const button of buttons){
        const tr = button.closest('tr')
        const id = tr.id
        const urlParams = new URLSearchParams(window.location.search);
        const table = urlParams.get('table');
       
        button.onclick = ()=>activateWebhook(table,id,tr)
        
        
    }

}
