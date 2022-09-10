const form = document.getElementById('form_1')
const search = document.getElementById('search_bar')

    const apiURL = 'https://darkwebapi.herokuapp.com/ahmiaapi/'
    // vedant = search.value.trim();
    
    form.addEventListener('submit', e=> {
        e.preventDefault();
        searchValue = search.value.trim();
    
        if(!searchValue){
            alert("There is nothing to search")
        }
        else{ 
            searchKeyword(searchValue)
        }
    })
    function testJS() {
        var b = document.getElementById('search_bar').value,
            url = 'http://127.0.0.1:5501/static/index.html?name=' + encodeURIComponent(b);
    
        document.location.href = url;
    }
    // localStorage.setItem("search_res", searchValue");
    // console.log(search_res);
    async function searchKeyword(searchValue){
        const searchResult = await fetch(`${apiURL}${searchValue}`)
        const data = await searchResult.json();
    
        console.log(data)
        // showData(data);
    
    // document.getElementById('api_Resp').innerHTML = JSON.stringify(data);
    let tableData=""
    data.map((values)=>{
        tableData+=` <tr>
        <td>
        <div>${values.text}<br>
          <a href="http://anonymto.com/?${values.href}">${values.href}</a>
          <div>
        </td>
        <td><input type="button" value="Investigate" onclick="window.open('http://127.0.0.1:5501/static/index.html')"/></td>
      </tr>`;
    });
    document.getElementById("tablebody").innerHTML=tableData;
    }