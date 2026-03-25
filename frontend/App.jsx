useEffect(() => {
  fetch("http://localhost:5000")
    .then(res => res.text())
    .then(data => console.log(data));
}, []);