fetch('http://localhost:3000/api/productos/')
.then((response) =>{
    return response.json()
})
.then(data =>{
    console.log(data)
})
