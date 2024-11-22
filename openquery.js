const openQuery = async(id) => {
    // Get current URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token'); // Get the token from the URL
    const table = urlParams.get('table'); // Get the table from the URL

    // Construct the new URL with query parameters
    const newUrl = `./tables.html?token=${token}&query=${id.replace('id-','')}`;

    // Open the new URL in a new window (or tab)
    window.open(newUrl, '_blank');  // '_blank' ensures it opens in a new tab or window

    // Optionally, you can log the new URL to the console for debugging purposes
    console.log('Opening URL in new window:', newUrl);
};
var openQueryButtons = async()=>{
    const buttons = document.querySelectorAll(`[data-button="data-open-query"]`)
    for(const button of buttons){
        const tr = button.closest('tr')
        const id = tr.id
        
       
        button.onclick = ()=>openQuery(id)
        
        
    }

}
