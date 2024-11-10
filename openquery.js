const openQuery = async(id)=>{
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token'); // Get the token from the URL
    const table = urlParams.get('table'); // Get the table from the URL

    // Construct the new URL with query parameters
    const newUrl = `/tables.html?token=${token}&query=${id}`;

    // Update the browser's URL without reloading the page
    history.pushState({}, '', newUrl);

    // Optionally, you can log it to the console or perform other actions
    console.log('New URL:', newUrl);

}
var openQueryButtons = async()=>{
    const buttons = document.querySelectorAll(`[data-button="data-open-query"]`)
    for(const button of buttons){
        const tr = button.closest('tr')
        const id = tr.id
        
       
        button.onclick = ()=>openQuery(id)
        
        
    }

}
