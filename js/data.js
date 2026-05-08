const carList = JSON.parse(localStorage.getItem("carList")) || [
    {
        id:1,
        carNumber:"A12345",
        time:"10:00"
    },
    {
        id:2,
        carNumber:"B88888",
        time:"11:00"
    }
];