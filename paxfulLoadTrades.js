const loadTrades = async(table,id,tr)=>{
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    const response =  await fetch(`https://api.seositeshome.com/loadTrades?token=${token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
                table,
                id:id.replace('id-',''),
            }
        )
    })
    if (response.ok) {
        alert('import transaction done');
    } else {
        const errorData = await response.json(); // Optional: get more details about the error
        alert(`Problem importing: ${errorData.error || 'Unknown error'}`);
    }

}
var loadTradesButton = async()=>{
    const buttons = document.querySelectorAll(`[data-button="paxful-load-trades"]`)
    for(const button of buttons){
        const tr = button.closest('tr')
        const id = tr.id
        const urlParams = new URLSearchParams(window.location.search);
        const table = urlParams.get('table');
       
        button.onclick = ()=>loadTrades(table,id,tr)
        
        
    }

}
