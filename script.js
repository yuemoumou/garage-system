const carList = [
    {
        carNumber:"A12345",
        time:"10:00"
    },
    {
        carNumber:"B88888",
        time:"11:00"
    }
];

const tableBody = document.getElementById("carTableBody");

function renderTable(){

    tableBody.innerHTML = "";

    carList.forEach((car, index) => {

        tableBody.innerHTML += `
        <tr>
            <td>${car.carNumber}</td>
            <td>${car.time}</td>
            <td>
                <button class="delete-btn" onclick="deleteCar(${index})">
                    删除
                </button>
            </td>
        </tr>
        `;
    });
}

renderTable();

function deleteCar(index)
{
    carList.splice(index, 1);

    renderTable();
}

document.getElementById("addBtn").onclick = function(){

    const carNumber = prompt("请输入车牌号");

    const time = prompt("请输入进入时间");

    if(carNumber && time){

        carList.push({
            carNumber,
            time
        });

        renderTable();
    }
}