function deleteCar(id){

    const index = carList.findIndex(car => car.id === id);

    carList.splice(index, 1);

    saveData();
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

        saveData();
        renderTable();

        modal.style.display = "none";

        document.getElementById("carNumberInput").value = "";

        document.getElementById("timeInput").value = "";
    }
}

renderTable();