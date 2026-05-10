const carList = JSON.parse(localStorage.getItem("carList")) || [
    {
        id:1,
        carNumber:"A12345",


        enterTime :Date.now(),

        exitTime:null,

        fee:0,

        status:"停车中"
    },
];