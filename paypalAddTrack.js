const save = async(table,id,row)=>{
    console.log('clicked')
    
    const statusRow =row.querySelector(`[cname="track status"]`)
    if(statusRow.textContent ==='adding'){
        return
    }
    statusRow.textContent ='adding'
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const response =  await fetch(`https://api.seositeshome.com/sendTracking?token=${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id:id.replace('id-',''), // Send the array of updated records
            }),
        });
    statusRow.textContent = 'added'
    if (response.ok) {
        alert('adding track info done');
    } else {
        const errorData = await response.json(); // Optional: get more details about the error
        alert(`Problem adding tracking info: ${errorData.error || 'Unknown error'}`);
    }

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
