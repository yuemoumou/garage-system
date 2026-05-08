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

const tableBody = document.getElementById("carTableBody");

function renderTable(data = carList){

    tableBody.innerHTML = "";

    data.forEach((car) => {

        tableBody.innerHTML += `
        <tr>
            <td>${car.carNumber}</td>
            <td>${car.time}</td>
            <td>
                <button class="delete-btn" onclick="deleteCar(${car.id})">
                    删除
                </button>
            </td>
        </tr>
        `;
    });
}

function saveDate(){
    localStorage.setItem("carList", JSON.stringify(carList));
}

renderTable();

function deleteCar(id){

    const index = carList.findIndex(car => car.id === id);

    carList.splice(index, 1);

    saveDate();
    renderTable();
}

document.getElementById("searchBtn").onclick = function(){

    const keyword = document.getElementById("searchInput").value;

    const result = carList.filter(car => {

        return car.carNumber.includes(keyword);

    });

    renderTable(result);
}

const modal = document.getElementById("modal");

const addBtn = document.getElementById("addBtn");

const confirmBtn = document.getElementById("confirmBtn");

const cancelBtn = document.getElementById("cancelBtn");

/* 打开弹窗 */
addBtn.onclick = function(){

    modal.style.display = "flex";
}

/* 取消按钮 */
cancelBtn.onclick = function(){

    modal.style.display = "none";

    document.getElementById("carNumberInput").value = "";

    document.getElementById("timeInput").value = "";
}

/* 确认按钮 */
confirmBtn.onclick = function(){

    const carNumber = document.getElementById("carNumberInput").value;

    const time = document.getElementById("timeInput").value;

    if(carNumber && time){

        carList.push({
            id: Date.now(),
            carNumber,
            time
        });

        saveDate();
        renderTable();

        modal.style.display = "none";

        document.getElementById("carNumberInput").value = "";

        document.getElementById("timeInput").value = "";
    }
}