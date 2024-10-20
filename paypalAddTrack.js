const save = async(table,id,row)=>{
    console.log('clicked')
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
     await fetch(`https://api.seositeshome.com/sendTracking?token=${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id, // Send the array of updated records
            }),
        });
    row.querySelector(`[cname="track status"]`).textContent = 'added'
    alert('tracking added')
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
